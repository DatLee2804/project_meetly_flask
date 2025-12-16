// src/components/modals/EditTaskModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, User as UserIcon, Tag, Flag, AlertCircle } from 'lucide-react';
import { User, Task, TaskStatus, Priority } from '../../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: any) => void;
  users: User[];
  task: Task | null; // Task cần sửa
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ 
  isOpen, onClose, onSave, users, task 
}) => {
  // Init State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Load dữ liệu cũ khi mở modal
  useEffect(() => {
    if (isOpen && task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setStatus(task.status);
        setPriority(task.priority);
        setTags(task.tags ? task.tags.join(', ') : '');
        setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setAssigneeId(task.assigneeId || '');
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const updates = {
      title,
      description,
      status,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      startDate: startDate || null,
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
    };

    onSave(task.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">Edit Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Title */}
          <div>
            <input 
              autoFocus
              className="w-full bg-slate-800 border border-slate-600 p-3 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" 
              placeholder="Task Title" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <textarea 
              className="w-full bg-slate-800 border border-slate-600 p-3 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none h-24" 
              placeholder="Description..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Row: Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 p-2.5 rounded-lg text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <AlertCircle className="absolute right-3 top-8 text-slate-500 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 p-2.5 rounded-lg text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <Flag className="absolute right-3 top-8 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Tags */}
          <div className="relative">
             <input 
                className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                placeholder="Tags (comma separated)" 
                value={tags}
                onChange={e => setTags(e.target.value)}
             />
             <Tag className="absolute left-3 top-3.5 text-slate-500" size={18} />
          </div>

          {/* Row: Dates */}
          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
             </div>
             <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
             </div>
          </div>

          {/* Assignee */}
          <div className="relative">
             <select 
                className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
             >
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
             </select>
             <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-xl flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg font-medium transition"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-900/20 transition w-full sm:w-auto"
           >
             Save Changes
           </button>
        </div>

      </div>
    </div>
  );
};

export default EditTaskModal;