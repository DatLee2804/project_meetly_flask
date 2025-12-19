from dotenv import load_dotenv
import json
from typing import List, Optional

# --- Cần thêm dòng import này ở đầu file ---
from sqlalchemy.orm import joinedload 
from src.models.meeting import Meeting # Đảm bảo import đúng model

# LangGraph và LangChain
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage

# Import từ module này
from .schemas import AgentState, MeetingOutput, ReflectionOutput
from .prompts import ANALYSIS_PROMPT, REFLECTION_PROMPT, REFINEMENT_PROMPT
from .tools import (
    format_email_body_for_assignee, 
    get_emails_from_participants, 
    transcribe_audio, 
    create_tasks, 
    send_notification
)
from ...models.models import call_llm

# Load environment variables
load_dotenv()


def _extract_participant_names(participants: List[dict]) -> str:
    """Trích xuất danh sách tên participants để đưa vào prompt."""
    if not participants:
        return "Không có thông tin participants"
    
    names = [p.get('username', 'Unknown') for p in participants]
    return ", ".join(names)


class MeetingToTaskAgent:
    """
    Agent xử lý meeting recordings và tạo tasks tự động
    """
    
    def __init__(self):
        """
        Khởi tạo agent
        
        Args:
            provider_name: Tên provider LLM để sử dụng
        """
        self.model = call_llm(
            model_provider='gemini',
            model_name='gemini-2.5-flash-lite-preview-09-2025',
            temperature=0.1,
            top_p=0.5,
        )
        self.memory = MemorySaver()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Xây dựng workflow graph"""
        builder = StateGraph(AgentState)
        
        # Thêm các nodes
        builder.add_node('stt', self._stt)
        builder.add_node('analysis', self._analysis)
        builder.add_node('reflection', self._reflection)
        builder.add_node('refinement', self._refinement)
        builder.add_node('create_tasks', self._create_tasks)
        builder.add_node('notification', self._notification)
        
        # Thiết lập entry point
        builder.set_entry_point('stt')
        
        # Thêm các edges
        builder.add_edge('stt', 'analysis')
        builder.add_edge('analysis', 'reflection')
        
        # Conditional edge: reflection -> refine hoặc create_tasks
        builder.add_conditional_edges(
            'reflection',
            self._should_create_tasks,
            {
                False: 'refinement',
                True: 'create_tasks'
            }
        )
        
        # Edge: refinement quay lại reflection để kiểm tra lại
        builder.add_edge('refinement', 'reflection')
        
        # Edge: create_tasks -> notification -> END
        builder.add_edge('create_tasks', 'notification')
        builder.add_edge('notification', END)
        
        # Compile graph với memory và interrupt_before
        return builder.compile(
            checkpointer=self.memory,
            interrupt_before=['create_tasks']
        )
    
    # ==================== NODES ====================
    
    def _stt(self, state: AgentState):
        """Node 1: Chuyển đổi âm thanh thành văn bản"""
        print("\n[NODE 1] Đang chuyển đổi âm thanh thành văn bản...")
        print('='*100)
        
        transcript = transcribe_audio(
            state['audio_file_path'], 
            provider='gemini', 
            use_mock=False
        )
        
        print(f"  ✅ Transcript: {len(transcript)} ký tự")
        return {'transcript': transcript}
    
    def _analysis(self, state: AgentState):
        """Node 2: Phân tích và tạo MoM + Action Items"""
        print("\n[NODE 2] Đang phân tích và tạo MoM...")
        print('='*100)
        
        metadata = state.get('meeting_metadata', {})
        participants = metadata.get('participants', [])
        
        # Tạo metadata string (không bao gồm participants để tránh trùng lặp)
        metadata_display = {k: v for k, v in metadata.items() if k != 'participants'}
        metadata_str = json.dumps(metadata_display, indent=2, ensure_ascii=False)
        
        # Tạo danh sách participants
        participants_str = _extract_participant_names(participants)
        
        messages = [
            HumanMessage(content=ANALYSIS_PROMPT.format(
                participants=participants_str,
                metadata=metadata_str,
                transcript=state['transcript']
            ))
        ]
        
        response = self.model.with_structured_output(MeetingOutput).invoke(messages)
        
        # Chuyển đổi action items sang dict
        action_items_list = [item.dict() for item in response.action_items]
        
        print(f"  ✅ Summary: {len(response.summary)} ký tự")
        print(f"  ✅ Action Items: {len(action_items_list)} items")
        for item in action_items_list:
            print(f"     - {item.get('assignee', 'N/A')}: {item.get('title', '')[:40]}...")
        
        return {
            'mom': response.summary,
            'action_items': action_items_list,
        }
    
    def _reflection(self, state: AgentState):
        """Node 3: Tự kiểm tra và phát hiện lỗi"""
        print("\n[NODE 3] Đang tự kiểm tra chất lượng...")
        print('='*100)
        
        metadata = state.get('meeting_metadata', {})
        participants = metadata.get('participants', [])
        participants_str = _extract_participant_names(participants)
        
        action_items_str = json.dumps(state['action_items'], indent=2, ensure_ascii=False)
        
        messages = [
            HumanMessage(content=REFLECTION_PROMPT.format(
                participants=participants_str,
                mom=state['mom'],
                action_items=action_items_str
            ))
        ]
        
        response = self.model.with_structured_output(ReflectionOutput).invoke(messages)
        
        print(f"  📝 Critique: {response.critique[:100]}...")
        print(f"  🎯 Decision: {response.decision}")
        
        return {'critique': response.critique, 'reflect_decision': response.decision}
    
    def _refinement(self, state: AgentState):
        """Node 4: Tinh chỉnh dựa trên phản hồi"""
        print("\n[NODE 4] Tinh chỉnh MoM...")
        print('='*100)
        
        metadata = state.get('meeting_metadata', {})
        participants = metadata.get('participants', [])
        participants_str = _extract_participant_names(participants)
        
        action_items_str = json.dumps(state['action_items'], indent=2, ensure_ascii=False)
        
        messages = [
            HumanMessage(content=REFINEMENT_PROMPT.format(
                participants=participants_str,
                draft_mom=state['mom'],
                draft_action_items=action_items_str,
                critique=state['critique'],
                transcript=state['transcript']
            ))
        ]
        
        response = self.model.with_structured_output(MeetingOutput).invoke(messages)
        
        refined_action_items = [item.dict() for item in response.action_items]
        revision_count = state.get('revision_count', 0) + 1
        
        print(f"  🔄 Revision #{revision_count}")
        
        return {
            'mom': response.summary,
            'action_items': refined_action_items,
            'revision_count': revision_count
        }
    
    def _create_tasks(self, state: AgentState):
        """Node 5: Tạo tasks trong hệ thống backend"""
        print("\n[NODE 5] Tạo tasks...")
        print('='*100)
        
        action_items = state.get('action_items', [])
        meeting_metadata = state.get('meeting_metadata', {})
        participants = meeting_metadata.get('participants', [])
        
        # Extract project_id and author_user_id from meeting metadata
        project_id = meeting_metadata.get('projectId')
        author_user_id = meeting_metadata.get('authorUserId')
        
        # Build user_mapping: assignee name (lowercase) -> userId
        user_mapping = {}
        for p in participants:
            username = p.get('username', '')
            user_id = p.get('userId')
            if username and user_id:
                user_mapping[username.lower()] = user_id
        
        # Call API to create tasks
        tasks = create_tasks(
            action_items=action_items,
            project_id=project_id,
            author_user_id=author_user_id,
            user_mapping=user_mapping
        )
        
        print(f"  📊 Created {len(tasks)} tasks")
        return {'tasks_created': tasks}
    
    def _notification(self, state: AgentState):
        """Node 6: Gửi thông báo tới từng assignee"""
        print("\n[NODE 6] Gửi notification...")
        print('='*100)
        
        mom = state.get('mom')
        action_items = state.get('action_items', [])
        meeting_metadata = state.get('meeting_metadata', {})
        participants = meeting_metadata.get('participants', [])
        
        # Lấy email mapping từ participants
        email_map = get_emails_from_participants(participants)
        
        print(f"  👥 Participants với email: {list(email_map.keys())}")
        
        # Gửi email cho từng task
        results = []
        for task in action_items:
            assignee = task.get('assignee', '').lower()
            
            # Skip nếu là Unassigned
            if assignee == 'unassigned' or not assignee:
                print(f"  ⏭️ Skip task không có assignee: {task.get('title', '')[:30]}...")
                continue
            
            email = email_map.get(assignee)
            
            if not email:
                print(f"  ⚠️ Không tìm thấy email cho: {assignee}")
                results.append({
                    "assignee": assignee,
                    "email": None,
                    "title": task.get('title', ''),
                    "status": "skipped",
                    "reason": "Email not found in participants"
                })
                continue
            
            # Format email riêng cho task này
            email_body = format_email_body_for_assignee(
                assignee_name=assignee.title(),
                assignee_task=task,
                mom=mom,
                meeting_metadata=meeting_metadata
            )
            
            result = send_notification(
                email_body=email_body,
                receiver_email=email,
                subject=f"[Action Required] {meeting_metadata.get('title', 'Meeting')} - Công việc cho {assignee.title()}"
            )
            
            results.append({
                "assignee": assignee,
                "email": email,
                "title": task.get('title', ''),
                "status": "sent" if result else "failed"
            })
        
        sent_count = len([r for r in results if r['status'] == 'sent'])
        print(f"\n  📊 Đã gửi {sent_count}/{len(results)} email")
        
        return {'notification_sent': results}
    
    # ==================== CONDITIONAL LOGIC ====================
    
    def _should_create_tasks(self, state: AgentState) -> bool:
        """Quyết định có cần tinh chỉnh dựa trên critique không."""
        decision = state.get('reflect_decision', '')
        max_revisions = state.get('max_revisions', 2)
        revision_count = state.get('revision_count', 0)
        
        # Accept nếu decision là accept HOẶC đã đạt max revisions
        if decision == 'accept':
            return True
        if revision_count >= max_revisions:
            print(f"  ⚠️ Đạt max revisions ({max_revisions}), tiếp tục...")
            return True
        return False
    
    # ==================== PUBLIC METHODS ====================
    
    def run(self, audio_file_path: str, meeting_metadata: Optional[dict] = None, 
            max_revisions: int = 2, thread_id: str = '1'):
        """
        Chạy workflow đến điểm Human Review
        
        Args:
            audio_file_path: Đường dẫn đến file âm thanh
            meeting_metadata: Metadata của cuộc họp (bao gồm participants)
            max_revisions: Số lần tối đa cho phép tinh chỉnh
            thread_id: ID của thread cho memory
            
        Returns:
            Tuple[dict, dict]: (current_state, thread_config)
        """
        initial_state = {
            'audio_file_path': audio_file_path,
            'meeting_metadata': meeting_metadata or {},
            'max_revisions': max_revisions,
            'revision_count': 0,
        }
        
        thread = {'configurable': {'thread_id': thread_id}}
        
        print("\n🚀 Starting Meeting-to-Task Agent...")
        print("="*100)
        
        # Hiển thị participants
        participants = (meeting_metadata or {}).get('participants', [])
        if participants:
            print(f"👥 Participants: {_extract_participant_names(participants)}")
        
        # Chạy đến điểm interrupt
        for event in self.graph.stream(initial_state, thread):
            pass  # Events đã được print trong nodes

        current_state = self.graph.get_state(thread)
        return current_state.values, thread
    
    def continue_after_review(self, thread, updated_mom: str = None, 
                              updated_action_items: list = None):
        """Cập nhật state và tiếp tục workflow sau human review"""
        if updated_mom or updated_action_items:
            updates = {}
            if updated_mom:
                updates['mom'] = updated_mom
            if updated_action_items:
                updates['action_items'] = updated_action_items
            self.graph.update_state(thread, updates)
        
        print("\n▶️ Continuing after human review...")
        print("="*100)
        
        for event in self.graph.stream(None, thread):
            pass
        
        final_state = self.graph.get_state(thread)
        return final_state.values
    
    def get_graph(self):
        """Hiển thị graph dưới dạng hình ảnh"""
        from IPython.display import Image, display
        
        img = self.graph.get_graph().draw_mermaid_png()
        return display(Image(img))