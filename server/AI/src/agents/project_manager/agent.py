# server/AI/src/agents/project_manager/agent.py

import json
import operator
from typing import TypedDict, Annotated, Literal, List, Optional
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage, AnyMessage

# --- FIX IMPORTS CHO SERVER ---
try:
    # Import từ cấu trúc thư mục của Server
    from AI.src.models.models import call_llm
    from AI.src.rag.retriever import retrieve, format_retrieved_documents
    from .api_tools import ALL_API_TOOLS
except ImportError:
    # Fallback nếu chạy test local
    import sys
    from pathlib import Path
    # sys.path.append(...) 
    pass

# --- CONFIGURATION ---
# --- SỬA CẤU HÌNH MODEL ---
param_dict = {
    'router_kwargs': {
        'model_provider': 'gemini',
        # Đổi thành gemini-2.0-flash hoặc gemini-1.5-flash-latest
        'model_name': 'gemini-2.0-flash', 
        'temperature': 0.3,
        'top_p': 0.7,
    },
    'direct_kwargs': {
        'model_provider': 'gemini',
        'model_name': 'gemini-2.0-flash', # Đổi ở đây luôn
        'temperature': 0.5,
        'top_p': 0.9,
        'max_tokens': 500,
    },
    'large_deterministic_kwargs': { 
        'model_provider': 'gemini',
        'model_name': 'gemini-2.0-flash', # Và ở đây
        'temperature': 0.3,
        'top_p': 0.7,
    },
    'rewriter_kwargs': {
        'model_provider': 'gemini',
        'model_name': 'gemini-2.0-flash', # Cuối cùng là đây
        'temperature': 0.3,
        'top_p': 0.7,
        'max_tokens': 200,
    },
}

# --- STATE & SCHEMAS ---
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    query: str
    router_decision: str 
    grader_decision: str
    retrieved_documents: list[dict]
    grader_critique: str
    feedback_history: Annotated[List[str], operator.add]
    rewrite_numbers: int
    max_rewrite: int

class RouterOutput(BaseModel):
    decision: Literal["RAG", "TOOL_CALL", "DIRECT"] = Field(
        description="Quyết định phân luồng: RAG, DIRECT, hoặc TOOL_CALL"
    )

class GraderOuput(BaseModel):
    decision: Literal['QUERY_REWRITER', 'ANSWER']
    critique: str

# --- MAIN AGENT CLASS ---
class ProjectManagerAgent:
    def __init__(self, current_user_id: int):
        self.current_user_id = current_user_id
        
        # Init Models
        self.llm_router = call_llm(**param_dict['router_kwargs'])
        self.llm_rag = call_llm(**param_dict['large_deterministic_kwargs'])
        self.llm_direct = call_llm(**param_dict['direct_kwargs'])
        self.llm_tool_call = call_llm(**param_dict['large_deterministic_kwargs'])
        self.llm_grader = call_llm(**param_dict['large_deterministic_kwargs'])
        self.llm_rewriter = call_llm(**param_dict['rewriter_kwargs'])
        
        # Init Tools
        self.tools_list = ALL_API_TOOLS
        self.tools = {t.name: t for t in self.tools_list}
        self.llm_tool_call = self.llm_tool_call.bind_tools(self.tools_list)
        
        # Build Graph
        self.graph = self.build_graph()

    def run(self, message: str, project_id: str = None, user_id: str = None, thread_id: str = "general"):
        """Wrapper function để gọi Agent từ API Router"""
        initial_state = {
            "messages": [],
            "query": message,
            "retrieved_documents": [],
            "grader_critique": "",
            "rewrite_numbers": 0,
            "max_rewrite": 3,
            "router_decision": "",
            "grader_decision": "",
            "feedback_history": [],
        }
        
        # Chạy Graph
        try:
            final_state = self.graph.invoke(initial_state)
            
            # Lấy tin nhắn cuối cùng từ Bot
            last_message = final_state['messages'][-1]
            if hasattr(last_message, 'content'):
                return str(last_message.content)
            return "Đã xử lý xong nhưng không có phản hồi."
            
        except Exception as e:
            print(f"❌ Error in Agent Run: {e}")
            return f"Xin lỗi, tôi gặp lỗi khi xử lý: {str(e)}"

    def build_graph(self) -> StateGraph:
        builder = StateGraph(AgentState)
        
        builder.add_node('router', self.router)
        builder.add_node('retriever', self.retriever)
        builder.add_node('grader', self.grader)
        builder.add_node('query_rewriter', self.query_rewriter)
        builder.add_node('rag_generator', self.rag_generator)
        builder.add_node('tool_call', self.take_action)
        builder.add_node('tool_generator', self.tool_generator)
        builder.add_node('direct_generator', self.direct_generator)
        
        builder.set_entry_point('router')
        
        builder.add_conditional_edges('router', self._intent_classify, {
            'RAG': 'retriever', 'TOOL_CALL': 'tool_generator', 'DIRECT': 'direct_generator'
        })
        
        builder.add_edge('retriever', 'grader')
        builder.add_conditional_edges('grader', self._exist_rewrite, {
            True: 'query_rewriter', False: 'rag_generator'
        })
        builder.add_edge('query_rewriter', 'retriever')
        builder.add_edge('rag_generator', END)
        
        builder.add_conditional_edges('tool_generator', self._exist_tool, {
            True: 'tool_call', False: END
        })
        builder.add_edge('tool_call', 'tool_generator')
        builder.add_edge('direct_generator', END)
        
        return builder.compile()

    # --- NODE FUNCTIONS ---
    def router(self, state: AgentState):
        query = state['query']
        prompt = """Phân loại câu hỏi vào 1 trong 3 nhánh:
DIRECT - Trả lời trực tiếp (Chào hỏi, kiến thức chung)
RAG - Tra cứu tài liệu (Quy trình, quy định công ty)
TOOL_CALL - Thao tác dữ liệu (Task của tôi, tạo task, search)"""
        
        messages = [SystemMessage(content=prompt), HumanMessage(content=query)]
        try:
            response = self.llm_router.with_structured_output(RouterOutput).invoke(messages)
            return {'router_decision': response.decision}
        except:
            return {'router_decision': 'DIRECT'} # Fallback

    def tool_generator(self, state: AgentState):
        messages = state.get('messages', [])
        query = state['query']
        tool_prompt = f"PM Assistant - User ID: {self.current_user_id}. Trả lời tiếng Việt."
        
        msgs = [SystemMessage(content=tool_prompt), HumanMessage(content=query)] + messages
        response = self.llm_tool_call.invoke(msgs)
        return {'messages': [response]}

    def take_action(self, state: AgentState):
        last_message = state['messages'][-1]
        tool_messages = []
        if hasattr(last_message, 'tool_calls'):
            for tool_call in last_message.tool_calls:
                tool_name = tool_call['name']
                tool_args = tool_call['args']
                
                # Scope Enforcement
                if tool_name == 'get_user_tasks': tool_args['user_id'] = self.current_user_id
                if tool_name == 'create_task': tool_args['author_user_id'] = self.current_user_id
                
                if tool_name in self.tools:
                    res = self.tools[tool_name].invoke(tool_args)
                    tool_messages.append(ToolMessage(content=json.dumps(res, default=str), tool_call_id=tool_call['id']))
        return {'messages': tool_messages}

    def retriever(self, state: AgentState):
        query = state['query']
        try:
            docs = retrieve(query=query, collection_name='ProjectDocuments', use_reranker=True, top_k=3)
            formatted = format_retrieved_documents(docs)
        except:
            formatted = []
        return {'retrieved_documents': formatted}

    def grader(self, state: AgentState):
        # Simplification for robustness
        return {'grader_decision': 'ANSWER', 'feedback_history': []}

    def query_rewriter(self, state: AgentState):
        return {'query': state['query'], 'rewrite_numbers': state.get('rewrite_numbers', 0) + 1}

    def rag_generator(self, state: AgentState):
        docs = state['retrieved_documents']
        query = state['query']
        prompt = f"Trả lời câu hỏi dựa trên tài liệu sau:\n{docs}\nCâu hỏi: {query}"
        response = self.llm_rag.invoke([HumanMessage(content=prompt)])
        return {'messages': [response]}

    def direct_generator(self, state: AgentState):
        response = self.llm_direct.invoke([HumanMessage(content=state['query'])])
        return {"messages": [response]}

    # --- CONDITIONAL ---
    def _intent_classify(self, state): return state['router_decision']
    def _exist_rewrite(self, state): return False # Tạm tắt loop rewrite để test ổn định trước
    def _exist_tool(self, state):
        last = state.get('messages', [])[-1]
        return bool(getattr(last, 'tool_calls', None))