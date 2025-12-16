// src/pages/TaskBoard.tsx
import React from 'react';
import { Plus, MoreHorizontal, Edit2, Briefcase, Flag, Calendar, Hash, User as UserIcon } from 'lucide-react';
import { Task, Project, TaskStatus, Priority, User } from '../types';
import TaskCard from '../components/shared/TaskCard';

// --- KANBAN BOARD VIEW ---
export const BoardView: React.FC<{ 
  tasks: Task[], 
  columns: string[],
  users: User[],
  onMove: (id: string, s: string) => void, 
  onNew: () => void, 
  onEdit: (t: Task) => void,
  onAddColumn: () => void,
  onEditColumn: (c: string) => void
}> = ({ tasks, columns, users, onMove, onNew, onEdit, onAddColumn, onEditColumn }) => {
  
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onMove(taskId, status);
  };

  return (
    <div className="flex h-full overflow-x-auto gap-4 p-4 items-start">
      {columns.map(status => (
        <div 
          key={status} 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, status)}
          className="min-w-[280px] w-[320px] bg-slate-100 rounded-xl p-3 flex flex-col max-h-full"
        >
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide truncate pr-2 flex-1" title={status}>{status}</h3>
            <div className="flex items-center gap-1">
               <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{tasks.filter(t => t.status === status).length}</span>
               <button onClick={() => onEditColumn(status)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition">
                 <MoreHorizontal size={16} />
               </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar pr-1">
            {tasks.filter(t => t.status === status).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                assignee={users.find(u => u.id === task.assigneeId)}
                onEdit={onEdit} 
              />
            ))}
          </div>
          <button onClick={onNew} className="mt-2 w-full py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
            <Plus size={16} className="mr-1" /> Create Task
          </button>
        </div>
      ))}
      <div className="min-w-[280px] flex items-center justify-center">
        <button onClick={onAddColumn} className="text-slate-400 hover:text-indigo-600 flex items-center font-medium">
          <Plus size={20} className="mr-2" /> Add Column
        </button>
      </div>
    </div>
  );
};

// --- LIST VIEW ---
export const ListView: React.FC<{ tasks: Task[], users: User[], projects: Project[], onEdit: (t: Task) => void }> = ({ tasks, users, projects, onEdit }) => (
  <div className="p-6 space-y-4">
    {tasks.map(task => {
        const author = users.find(u => u.id === task.authorId);
        const assignee = users.find(u => u.id === task.assigneeId);
        const project = projects.find(p => p.id === task.projectId);

        return (
          <div key={task.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition p-5 group">
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">#{task.id}</span>
                   {project && (
                     <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-medium">
                        <Briefcase size={12} />
                        {project.name}
                     </div>
                   )}
                </div>
                <button 
                  onClick={() => onEdit(task)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                    <Edit2 size={16} />
                </button>
             </div>

             <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{task.title}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
                    {task.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-slate-100 mb-4">
                <div>
                   <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Status</span>
                   <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold
                      ${task.status === TaskStatus.DONE ? 'bg-green-100 text-green-700' : 
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 
                        task.status === TaskStatus.TODO ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'}`}>
                      {task.status}
                   </span>
                </div>
                <div>
                   <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Priority</span>
                   <div className="flex items-center gap-1.5">
                      <Flag size={14} className={
                          task.priority === Priority.HIGH ? 'text-red-500' :
                          task.priority === Priority.MEDIUM ? 'text-amber-500' : 'text-blue-500'
                      } />
                      <span className="text-sm font-medium">{task.priority}</span>
                   </div>
                </div>
                <div>
                   <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Due Date</span>
                   <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar size={14} />
                      {task.dueDate || 'N/A'}
                   </div>
                </div>
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                        {task.tags && task.tags.length > 0 ? task.tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                                <Hash size={10} /> {tag}
                            </span>
                        )) : <span className="text-sm text-slate-400">-</span>}
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase mr-1">Assignee:</span>
                    {assignee ? (
                        <div className="flex items-center gap-2 bg-slate-50 pl-1 pr-3 py-1 rounded-full border border-slate-100">
                            <img src={assignee.avatar} className="w-5 h-5 rounded-full" />
                            <span className="text-xs font-medium text-slate-700">{assignee.name}</span>
                        </div>
                    ) : <span className="text-xs text-slate-400">Unassigned</span>}
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase mr-1">Author:</span>
                    {author ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <UserIcon size={14} />
                            <span className="text-xs">{author.name}</span>
                        </div>
                    ) : <span className="text-xs text-slate-400">Unknown</span>}
                 </div>
             </div>
          </div>
        );
    })}
  </div>
);

// --- TABLE VIEW ---
export const TableView: React.FC<{ tasks: Task[], users: User[] }> = ({ tasks, users }) => (
  <div className="p-4 overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="text-slate-500 text-sm border-b border-slate-200">
          <th className="p-3 font-medium">Key</th>
          <th className="p-3 font-medium">Title</th>
          <th className="p-3 font-medium">Status</th>
          <th className="p-3 font-medium">Priority</th>
          <th className="p-3 font-medium">Assignee</th>
          <th className="p-3 font-medium">Due Date</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const assignee = users.find(u => u.id === task.assigneeId);
          return (
            <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                <td className="p-3 text-slate-400 font-mono text-xs">#{task.id}</td>
                <td className="p-3 font-medium text-slate-900">{task.title}</td>
                <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{task.status}</span></td>
                <td className="p-3">{task.priority}</td>
                <td className="p-3 flex items-center gap-2">
                    {assignee && <img src={assignee.avatar} className="w-6 h-6 rounded-full" />}
                    <span>{assignee?.name || 'Unassigned'}</span>
                </td>
                <td className="p-3 text-slate-500">{task.dueDate}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Mặc định export rỗng để tránh lỗi nếu file được import default, nhưng ta dùng named export
const TaskBoard = () => <div>Use named exports</div>;
export default TaskBoard;