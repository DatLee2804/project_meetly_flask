// src/api/realApi.ts
import axios from 'axios';
import { 
    User, Project, Task, Meeting, NewTask, 
    ProjectCreate, MeetingCreate, TaskUpdate, TaskStatus 
} from '../types';

// Cấu hình Base URL (trỏ về port 8000 của FastAPI)
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor: Tự động nhét Token vào Header mỗi khi gửi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- HELPER: Phiên dịch viên (Mappers) ---
// Chuyển từ Backend (snake_case) -> Frontend (camelCase)

const mapUser = (data: any): User => ({
    id: data.id,
    name: data.name,
    username: data.username,
    email: data.email,
    avatar: data.avatar || 'https://via.placeholder.com/150', // Fallback nếu null
    role: 'Member', // Backend chưa có role, tui gán tạm
    bio: ''
});

const mapProject = (data: any): Project => ({
    id: data.id,
    name: data.name,
    description: data.description || '',
    // Backend trả về list User object trong members, Frontend cần list ID
    members: data.members.map((m: any) => m.id) 
});

const mapTask = (data: any): Task => ({
    id: data.id,
    title: data.title,
    description: data.description || '',
    status: data.status as TaskStatus,
    priority: data.priority,
    tags: data.tags || [],
    startDate: data.created_at, // Backend dùng created_at
    dueDate: data.due_date,
    authorId: data.author_id,
    assigneeId: data.assignee_id,
    projectId: data.project_id,
    comments: data.comments || 0,
    // Assignee object sẽ được map nếu backend trả về (cần chỉnh backend thêm option joinedload)
});

const mapMeeting = (data: any): Meeting => ({
    id: data.id,
    title: data.title,
    description: data.description || '',
    startDate: data.start_date,
    endDate: data.end_date,
    attendees: data.attendee_ids || [],
    recordingUrl: data.recording_url || '',
    transcript: data.transcript,
    projectId: data.project_id,
    aiSummary: data.summary,
    // AI Task trong MeetingOut backend trả về là list object, frontend cần map lại nếu muốn hiển thị
    aiActionItems: data.ai_tasks ? data.ai_tasks.map((t: any) => t.title) : [] 
});

// --- 1. Auth API ---

// Lưu ý: Login cần cả password, mock cũ chỉ có username
export async function loginUser(credentials: any): Promise<User> {
    // 1. Gọi login để lấy Token
    const res = await api.post('/users/login', credentials);
    const { access_token } = res.data;
    
    // 2. Lưu token vào LocalStorage
    localStorage.setItem('access_token', access_token);

    // 3. Gọi /me để lấy thông tin User chi tiết
    const userRes = await api.get('/users/me');
    return mapUser(userRes.data);
}

export async function registerUser(newUserData: any): Promise<User> {
    const res = await api.post('/users/register', newUserData);
    return mapUser(res.data);
}

export async function getCurrentUser(): Promise<User> {
    const res = await api.get('/users/me');
    return mapUser(res.data);
}

export async function updateUserSettings(userId: string, updates: Partial<User>): Promise<User> {
    // Backend chưa có endpoint update user cụ thể, đây là placeholder
    // Nếu có, sẽ gọi api.put(`/users/${userId}`, updates)
    console.warn("Backend update user endpoint not implemented yet");
    return { ...updates, id: userId } as User; 
}

// --- 2. Project API ---

// Hàm mới: Lấy Projects và trích xuất luôn thông tin Users từ đó
export async function getInitialData(): Promise<{ projects: Project[], users: User[] }> {
    const res = await api.get('/projects/');
    const rawData = res.data; // Dữ liệu thô từ backend (members là mảng object User)

    // 1. Map sang cấu trúc Project (Frontend chỉ cần member ID)
    const projects = rawData.map(mapProject);

    // 2. Trích xuất thông tin User để lưu vào kho User của Frontend
    const uniqueUsersMap = new Map<string, User>();
    
    rawData.forEach((p: any) => {
        // Duyệt qua từng thành viên trong project response
        if (Array.isArray(p.members)) {
            p.members.forEach((m: any) => {
                // Nếu chưa có trong map thì thêm vào (mapUser là hàm convert snake_case -> camelCase)
                if (!uniqueUsersMap.has(m.id)) {
                    uniqueUsersMap.set(m.id, mapUser(m));
                }
            });
        }
    });

    return { 
        projects, 
        users: Array.from(uniqueUsersMap.values()) // Trả về mảng các User unique
    };
}

export async function createProject(newProject: ProjectCreate, ownerId: string): Promise<Project> {
    // Convert frontend camelCase -> backend snake_case
    const payload = {
        name: newProject.name,
        description: newProject.description,
        member_ids: newProject.memberIds
    };
    const res = await api.post('/projects/', payload);
    return mapProject(res.data);
}

// --- 3. Task API ---

export async function getTasksByProject(projectId: string, statusFilter?: string): Promise<Task[]> {
    let url = `/tasks/${projectId}`;
    if (statusFilter) url += `?status_filter=${statusFilter}`;
    
    const res = await api.get(url);
    // Cần fetch thêm thông tin assignee cho mỗi task nếu backend không trả về full object
    // Tạm thời map cơ bản
    return res.data.map(mapTask);
}

export async function createTask(newTask: NewTask, authorId: string): Promise<Task> {
    const payload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        project_id: newTask.projectId,
        assignee_id: newTask.assigneeId || null,
        due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        tags: newTask.tags,
        author_id: authorId  // Use the authorId parameter instead of newTask.authorId
    };
    const res = await api.post('/tasks/', payload);
    return mapTask(res.data);
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<Task> {
    // Backend endpoint: PATCH /tasks/{task_id}/status?new_status=...
    const res = await api.patch(`/tasks/${taskId}/status?new_status=${newStatus}`);
    return mapTask(res.data);
}

// export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
//     // Backend chưa có endpoint update full task, bồ cần bổ sung vào backend sau
//     console.warn("Full task update endpoint missing in backend");
//     return {} as Task; 
// }

// --- 4. Meeting & AI API ---

export async function getMeetingsByProject(projectId: string): Promise<Meeting[]> {
    const res = await api.get(`/meetings/${projectId}`);
    return res.data.map(mapMeeting);
}

// export async function createMeeting(newMeeting: MeetingCreate, creatorId: string): Promise<Meeting> {
//     const payload = {
//         title: newMeeting.title,
//         description: newMeeting.description,
//         start_date: newMeeting.startDate,
//         end_date: newMeeting.endDate,
//         project_id: newMeeting.projectId,
//         attendee_ids: newMeeting.attendeeIds,
//         recording_url: newMeeting.recordingUrl
//     };
//     const res = await api.post('/meetings/', payload);
//     return mapMeeting(res.data);
// }

export async function processTranscript(meetingId: string, transcript: string): Promise<Task[]> {
    // Gọi endpoint AI thật
    const res = await api.post(`/ai/meeting/${meetingId}/process-transcript`, {
        transcript: transcript
    });
    // Endpoint này trả về List[TaskOut]
    return res.data.map(mapTask);
}

export async function chatWithAI(prompt: string): Promise<string> {
    const res = await api.post('/ai/chat', { transcript: prompt });
    return res.data.transcript; // Backend trả về schema MeetingTranscript
}

export async function updateTask(taskId: string, updates: any): Promise<Task> {
    // Map dữ liệu từ frontend (camelCase) sang backend (snake_case)
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.description) payload.description = updates.description;
    if (updates.status) payload.status = updates.status;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.tags) payload.tags = updates.tags;
    
    // Backend Pydantic dùng snake_case cho mấy trường này
    if (updates.startDate) payload.start_date = updates.startDate;
    if (updates.dueDate) payload.due_date = updates.dueDate;
    if (updates.assigneeId) payload.assignee_id = updates.assigneeId;

    // Gọi API Patch của backend (Endpoint: /tasks/{task_id})
    // Lưu ý: Nếu backend bồ chưa có route này thì dùng tạm logic fake ở dưới
    // const res = await api.patch(`/tasks/${taskId}`, payload);
    // return mapTask(res.data);

    // --- TẠM THỜI TRẢ VỀ LUÔN ĐỂ UI CHẠY ĐƯỢC (Nếu chưa backend chưa xong) ---
    return { id: taskId, ...updates } as Task;
}

// src/api/mockApi.ts

// ... (các import giữ nguyên)

export async function createMeeting(newMeeting: any, creatorId: string): Promise<Meeting> {
    console.log("🚀 Preparing to create meeting...", newMeeting);

    // 1. Chuẩn bị Payload cho Backend (Python thích snake_case và ISO Date)
    const payload = {
        title: newMeeting.title,
        description: newMeeting.description,
        
        // Convert ngày giờ sang chuẩn ISO 8601 mà Backend hiểu
        start_date: newMeeting.startDate ? new Date(newMeeting.startDate).toISOString() : null,
        end_date: newMeeting.endDate ? new Date(newMeeting.endDate).toISOString() : null,
        
        project_id: newMeeting.projectId,
        
        // Backend yêu cầu mảng string, frontend gửi mảng string -> OK
        attendee_ids: newMeeting.attendees || [], 
        
        // Các trường optional gửi rỗng hoặc null
        recording_url: "",
        transcript: "",
        summary: ""
    };

    try {
        // 2. GỌI API THẬT (Bỏ comment dòng này)
        // Endpoint khớp với server/src/api/v1/meeting_router.py
        const res = await api.post('/meetings/', payload);
        
        console.log("✅ Meeting created in DB:", res.data);

        // 3. Map dữ liệu trả về từ Server để hiển thị lên UI
        // Server trả về snake_case, ta map lại thành camelCase cho React dùng
        return {
            id: res.data.id,
            title: res.data.title,
            description: res.data.description,
            startDate: res.data.start_date,
            endDate: res.data.end_date,
            attendees: res.data.attendee_ids,
            recordingUrl: res.data.recording_url,
            transcript: res.data.transcript,
            projectId: res.data.project_id,
            aiSummary: res.data.summary,
            aiActionItems: [] // Server chưa trả về cái này thì để rỗng
        } as Meeting;

    } catch (error) {
        console.error("❌ Error creating meeting in DB:", error);
        throw error; // Ném lỗi ra để App.tsx bắt được và alert
    }
}

export async function addMemberToProject(projectId: string, email: string): Promise<User> {
    try {
        const res = await api.post(`/projects/${projectId}/members`, { email });
        // Map dữ liệu trả về từ backend (snake_case) sang frontend
        return mapUser(res.data);
    } catch (error: any) {
        console.error("Add member error:", error);
        // Ném lỗi ra để App.tsx bắt được và hiển thị alert
        throw error.response?.data?.detail || "Failed to add member";
    }
}

export async function triggerAiAnalysis(meetingId: string): Promise<any> {
    // Gọi endpoint FastAPI
    const res = await api.post(`/meetings/${meetingId}/analyze`);
    return res.data;
}

// Hàm gọi Chat API thật (hoặc Mock tạm)
export async function chatWithProjectManager(message: string, projectId?: string): Promise<string> {
    try {
        // Dùng luôn biến 'api' đã có sẵn ở trên (Nó tự lo URL và Token rồi)
        // Đường dẫn lúc này sẽ là: http://localhost:8000/api/v1/ai/chat
        const response = await api.post('/ai/chat', { 
            message,
            project_id: projectId,
            thread_id: "thread_1" 
        });

        return response.data.response; 
    } catch (error) {
        console.error("API Chat Error:", error);
        throw error;
    }
}