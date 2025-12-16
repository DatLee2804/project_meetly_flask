// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Layout, List, Clock, Table as TableIcon, Video, Plus, Settings, X, ChevronDown, MessageSquare, Search, LogOut } from 'lucide-react';
import { User, Task, Project, Meeting, TaskStatus, Priority, ViewMode } from './types';
import * as api from './api/mockApi'; // Hoặc import realApi

// Import Components
import Sidebar from './components/layout/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { BoardView, ListView, TableView } from './pages/TaskBoard';
import TimelineView from './components/shared/TimelineView';
import MeetingView from './pages/MeetingView';
import UserSettings from './pages/Settings';
import TeamsView from './pages/Teams';
import CreateProjectModal from './components/modals/CreateProjectModal'; // <--- IMPORT MỚI
import CreateTaskModal from './components/modals/CreateTaskModal';
import AddColumnModal from './components/modals/AddColumnModal';
import EditColumnModal from './components/modals/EditColumnModal';
import EditTaskModal from './components/modals/EditTaskModal';
import CreateMeetingModal from './components/modals/CreateMeetingModal';
// Mock Teams View placeholder nếu chưa kịp tạo file
const TeamsPlaceholder: React.FC<any> = () => <div className="p-8">Teams View Under Construction</div>;

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Toàn bộ user trong hệ thống

  // View State
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dashboardView, setDashboardView] = useState<'HOME' | 'TIMELINE' | 'TEAMS'>('HOME');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.KANBAN);
  const [isAddColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [boardColumns, setBoardColumns] = useState<string[]>(Object.values(TaskStatus));
  const [showChat, setShowChat] = useState(false);
  const [isEditColumnModalOpen, setEditColumnModalOpen] = useState(false);
  const [currentEditingColumn, setCurrentEditingColumn] = useState<string>('');
  const [isEditTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isMeetingModalOpen, setMeetingModalOpen] = useState(false);
  // Modals
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
 // ... (Thêm các state modal khác như CreateProject, CreateMeeting tương tự file AI)
 // ... trong src/App.tsx

  // src/App.tsx

  // --- SỬA LẠI HÀM NÀY ---
  const handleAddMember = async (projectId: string, email: string) => {
    try {
        // 1. Gọi API thêm thành viên
        const newMember = await api.addMemberToProject(projectId, email);
        
        // 2. Nếu thành công (không bị lỗi), cập nhật state Projects
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                // Thêm ID thành viên mới vào danh sách members của project
                return { ...p, members: [...p.members, newMember.id] };
            }
            return p;
        }));

        // 3. Cập nhật luôn danh sách Users cục bộ (để hiển thị Avatar, Tên...)
        setUsers(prev => {
            // Chỉ thêm nếu chưa có trong list
            if (!prev.find(u => u.id === newMember.id)) {
                return [...prev, newMember];
            }
            return prev;
        });

        alert(`${newMember.name} added to the team successfully!`);

    } catch (error) {
        // Hiển thị lỗi từ Backend (ví dụ: User not found, Already member...)
        alert(`Error: ${error}`);
    }
  };
  // --- Initial Data Fetch ---
  useEffect(() => {
    if (currentUser) {
        const fetchData = async () => {
            try {
                // 1. GỌI HÀM MỚI: Lấy cả Project lẫn Users
                const { projects: fetchedProjects, users: fetchedUsers } = await api.getInitialData();
                
                setProjects(fetchedProjects);
                
                // QUAN TRỌNG: Cập nhật danh sách users toàn cục
                // Gộp fetchedUsers với currentUser để đảm bảo không thiếu chính mình
                const allUsersMap = new Map();
                // Ưu tiên currentUser (để có dữ liệu mới nhất)
                allUsersMap.set(currentUser.id, currentUser); 
                // Thêm các user lấy được từ Project
                fetchedUsers.forEach(u => allUsersMap.set(u.id, u));
                
                setUsers(Array.from(allUsersMap.values())); 

                // ... (Phần fetch tasks/meetings giữ nguyên)
                const taskPromises = fetchedProjects.map(p => api.getTasksByProject(p.id));
                const allTasks = (await Promise.all(taskPromises)).flat();
                setTasks(allTasks);

                const meetingPromises = fetchedProjects.map(p => api.getMeetingsByProject(p.id));
                const allMeetings = (await Promise.all(meetingPromises)).flat();
                setMeetings(allMeetings);

            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        fetchData();
    }
  }, [currentUser]);

  if (!currentUser) {
    return <AuthPage onLogin={setCurrentUser} />;
  }

  // Helper logic
  const currentProjectTasks = activeProject ? tasks.filter(t => t.projectId === activeProject.id) : [];
  const currentProjectMeetings = activeProject ? meetings.filter(m => m.projectId === activeProject.id) : [];

  const handleLogout = () => {
      setCurrentUser(null);
      setTasks([]);
      setProjects([]);
      localStorage.removeItem('access_token');
  };

  const handleTaskMove = (taskId: string, newStatus: string) => {
      // Cập nhật UI ngay lập tức
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t));
      // Gọi API cập nhật
      api.updateTaskStatus(taskId, newStatus as TaskStatus);
  };
  // --- Handlers cho Create Project ---
  const handleCreateProject = async (projectData: { name: string; description: string; memberIds: string[] }) => {
    try {
        const newProject = await api.createProject(projectData, currentUser.id);
        setProjects([...projects, newProject]);
        setActiveProject(newProject);
        setCreateProjectModalOpen(false); // Đóng modal sau khi tạo xong
        alert("Project created successfully!");
    } catch (error) {
        console.error("Failed to create project:", error);
    }
  };
  // --- Handlers cho Create Task ---
  const handleCreateTask = async (taskData: any) => {
    try {
        const newTask = await api.createTask(taskData, currentUser!.id);
        setTasks(prev => [...prev, newTask]);
        
        setTaskModalOpen(false);
        // alert("Task created successfully!"); // Comment lại nếu thấy phiền
    } catch (error) {
        console.error("Failed to create task:", error);
    }
  };
  // --- Handlers cho Create Column ---
  const handleAddColumn = (newColumnTitle: string) => {
    if (boardColumns.includes(newColumnTitle)) {
      alert("Column already exists!");
      return;
    }
    setBoardColumns([...boardColumns, newColumnTitle]);
    setAddColumnModalOpen(false);
  };
  // --- Handlers Edit Column ---
  
  // Mở modal
  const handleOpenEditColumn = (columnTitle: string) => {
      setCurrentEditingColumn(columnTitle);
      setEditColumnModalOpen(true);
  };

  // Đổi tên cột
  const handleRenameColumn = (newTitle: string) => {
      if (boardColumns.includes(newTitle)) {
          alert("Column name already exists!");
          return;
      }

      // 1. Cập nhật danh sách cột
      setBoardColumns(prev => prev.map(c => c === currentEditingColumn ? newTitle : c));

      // 2. Cập nhật status của tất cả Tasks đang ở cột cũ sang tên mới
      // (Quan trọng: nếu không làm bước này, task sẽ biến mất khỏi board)
      setTasks(prev => prev.map(t => 
          t.status === currentEditingColumn ? { ...t, status: newTitle as TaskStatus } : t
      ));

      setEditColumnModalOpen(false);
  };

  // Xóa cột
  const handleDeleteColumn = () => {
      const confirm = window.confirm(`Delete column "${currentEditingColumn}"? Tasks will be moved to the first available column.`);
      if (!confirm) return;

      const remainingColumns = boardColumns.filter(c => c !== currentEditingColumn);
      
      if (remainingColumns.length === 0) {
          alert("You cannot delete the last column!");
          return;
      }

      // Di chuyển task sang cột đầu tiên còn lại
      const fallbackColumn = remainingColumns[0];
      setTasks(prev => prev.map(t => 
          t.status === currentEditingColumn ? { ...t, status: fallbackColumn as TaskStatus } : t
      ));

      setBoardColumns(remainingColumns);
      setEditColumnModalOpen(false);
  };
  // 1. Thêm State lưu task đang sửa

  // 2. KHAI BÁO HÀM handleOpenEditTask (Cái bồ đang thiếu nè)
  const handleOpenEditTask = (task: Task) => {
      setTaskToEdit(task);
      setEditTaskModalOpen(true);
  };

  // 3. KHAI BÁO HÀM handleUpdateTask (Để lưu sau khi sửa)
  const handleUpdateTask = async (taskId: string, updates: any) => {
      try {
          // Gọi API update (đảm bảo api.updateTask đã có)
          await api.updateTask(taskId, updates);
          
          // Cập nhật giao diện ngay lập tức
          setTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, ...updates } : t
          ));

          setEditTaskModalOpen(false);
          setTaskToEdit(null);
      } catch (error) {
          console.error("Failed to update task:", error);
      }
  };
  // src/App.tsx

  const handleCreateMeeting = async (meetingData: any) => {
      // Check kỹ xem có Project chưa
      if (!activeProject) {
          alert("Please select a project first!");
          return;
      }

      try {
          // Gộp thêm projectId vào dữ liệu gửi đi
          const meetingPayload = {
              ...meetingData,
              projectId: activeProject.id 
          };

          const newMeeting = await api.createMeeting(meetingPayload, currentUser!.id);
          
          // Cập nhật State để hiện ngay lên giao diện
          setMeetings([...meetings, newMeeting]);
          setMeetingModalOpen(false);
          alert("Meeting scheduled successfully!");
      } catch (error) {
          console.error("Failed to schedule meeting:", error);
          alert("Failed to save meeting to database.");
      }
  };

  console.log("Dashboard view: ", dashboardView)
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar 
        currentUser={currentUser}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => { setActiveProject(p); if(p) setViewMode(ViewMode.BOARD); }}
        dashboardView={dashboardView}
        setDashboardView={setDashboardView}
        onLogout={handleLogout}
        onToggleChat={() => setShowChat(!showChat)}
        onCreateProject={() => setCreateProjectModalOpen(true)} 
        onOpenSettings={() => setIsUserSettingsOpen(true)}
      />

   <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!activeProject ? (
           // --- KHU VỰC GLOBAL (Khi chưa chọn Project) ---
           
           dashboardView === 'HOME' ? (
              <Dashboard user={currentUser} tasks={tasks} projects={projects} />
           ) : dashboardView === 'TIMELINE' ? (
             <div className="flex flex-col h-full bg-white">
                {/* ... header ... */}
                <div className="flex-1 overflow-hidden">
                    <TimelineView 
                        tasks={tasks} 
                        meetings={meetings} // <--- TRUYỀN TOÀN BỘ MEETINGS VÀO ĐÂY
                    />
                </div>
             </div>
           ) : dashboardView === 'TEAMS' ? (
             <TeamsView 
                currentUser={currentUser} 
                projects={projects} 
                tasks={tasks}
                users={users}
                
                // Hàm mở modal tạo project
                onCreateTeam={() => setCreateProjectModalOpen(true)} 
                
                // Hàm add member (Logic cũ của bồ)
                onAddMember={handleAddMember}

                // (Tùy chọn) Hàm này sẽ được gọi khi bấm nút "Go to Board" trong trang chi tiết
                onOpenBoard={(project) => {
                    setActiveProject(project);
                    setViewMode(ViewMode.BOARD);
                }}
             />
           ) : null
           
        ) : (
          // --- KHU VỰC PROJECT (Khi đã chọn Project) ---
          <>
            {/* PROJECT HEADER */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800">{activeProject.name}</h1>
                <div className="bg-slate-100 rounded-lg p-1 flex items-center">
                  <button onClick={() => setViewMode(ViewMode.BOARD)} className={`p-1.5 rounded ${viewMode === 'BOARD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="Board"><Layout size={18}/></button>
                  <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-1.5 rounded ${viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="List"><List size={18}/></button>
                  <button onClick={() => setViewMode(ViewMode.TIMELINE)} className={`p-1.5 rounded ${viewMode === 'TIMELINE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="Timeline"><Clock size={18}/></button>
                  <button onClick={() => setViewMode(ViewMode.TABLE)} className={`p-1.5 rounded ${viewMode === 'TABLE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="Table"><TableIcon size={18}/></button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button onClick={() => setViewMode(ViewMode.MEETING)} className={`p-1.5 rounded ${viewMode === 'MEETING' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="Meetings"><Video size={18}/></button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                    onClick={() => viewMode === 'MEETING' ? setMeetingModalOpen(true) : setTaskModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-200 transition"
                >
                  <Plus size={18} /> 
                  {viewMode === 'MEETING' ? 'Schedule Meeting' : 'Create Task'}
                </button>
                <Settings className="text-slate-400 cursor-pointer hover:text-slate-600" size={20} />
              </div>
            </header>

            {/* PROJECT VIEWS CONTENT */}
            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
              {viewMode === 'BOARD' && (
                <BoardView 
                  tasks={currentProjectTasks} 
                  columns={boardColumns}
                  users={users}
                  onMove={handleTaskMove} 
                  onNew={() => setTaskModalOpen(true)} 
                  onEdit={handleOpenEditTask} 
                  onAddColumn={() => setAddColumnModalOpen(true)} 
                  onEditColumn={handleOpenEditColumn}
                />
              )}
              {viewMode === 'LIST' && (
                <ListView 
                    tasks={currentProjectTasks} 
                    users={users} 
                    projects={projects} 
                    onEdit={handleOpenEditTask} 
                />
               )}
              {viewMode === 'TABLE' && <TableView tasks={currentProjectTasks} users={users} />}
              {viewMode === 'TABLE' && <TableView tasks={currentProjectTasks} users={users} />}
              
              {viewMode === 'TIMELINE' && (
                  <TimelineView 
                      tasks={currentProjectTasks} 
                      meetings={currentProjectMeetings} // <--- TRUYỀN PROJECT MEETINGS VÀO ĐÂY
                  />
              )}
              
              {viewMode === 'MEETING' && (
                <MeetingView 
                  meetings={currentProjectMeetings} 
                  currentUser={currentUser} 
                  onOpenDetail={() => {}} 
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Chat (Placeholder) */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-2xl flex items-center justify-center border border-slate-200 z-50">
           BotChat Integration Component Here
        </div>
      )}

      {/* Modals placeholders */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
             <div className="bg-white p-8 rounded">
                 <h2>Task Modal ({editingTask ? 'Edit' : 'Create'})</h2>
                 <button onClick={() => { setTaskModalOpen(false); setEditingTask(null); }}>Close</button>
             </div>
        </div>
      )}

      {isUserSettingsOpen && (
          <UserSettings 
            currentUser={currentUser} 
            onUpdateUser={setCurrentUser} 
            
            // THÊM DÒNG NÀY:
            onClose={() => setIsUserSettingsOpen(false)} 
          />
      )}    
        <CreateProjectModal 
          isOpen={isCreateProjectModalOpen}
          onClose={() => setCreateProjectModalOpen(false)}
          onCreate={handleCreateProject}
          users={users}
          currentUser={currentUser!}
      />

      <CreateTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onCreate={handleCreateTask}
        users={users}
        activeProject={activeProject}
      />
    {/* Add Column Modal */}
      <AddColumnModal 
        isOpen={isAddColumnModalOpen}
        onClose={() => setAddColumnModalOpen(false)}
        onAdd={handleAddColumn}
      />
    {/* Edit Column Modal */}
      <EditColumnModal 
        isOpen={isEditColumnModalOpen}
        onClose={() => setEditColumnModalOpen(false)}
        initialTitle={currentEditingColumn}
        onRename={handleRenameColumn}
        onDelete={handleDeleteColumn}
      />

       {/* Edit Task Modal */}
      <EditTaskModal 
        isOpen={isEditTaskModalOpen}
        onClose={() => { setEditTaskModalOpen(false); setTaskToEdit(null); }}
        onSave={handleUpdateTask}
        users={users}
        task={taskToEdit}
      />

      {/* Create Meeting Modal */}
      <CreateMeetingModal 
        isOpen={isMeetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        onCreate={handleCreateMeeting}
        users={users}
        activeProject={activeProject}
      />

      
    </div>
   
    
  );
}