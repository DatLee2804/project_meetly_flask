// src/components/shared/TaskCard.tsx
import React from 'react';
import { Clock, MessageSquare, Edit2, MoreHorizontal } from 'lucide-react';
import { Task, Priority, User } from '../../types';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, onEdit }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      draggable 
      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition mb-3 group relative"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition z-10"
        title="Edit Task"
      >
        <Edit2 size={14} />
      </button>

      <div className="mb-2 pr-6">
        <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{task.title}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 min-h-[1.5em]">
            {task.description || <span className='italic opacity-50'>No description</span>}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
         <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
            task.priority === Priority.HIGH ? 'bg-red-50 text-red-700 border-red-100' : 
            task.priority === Priority.MEDIUM ? 'bg-amber-50 text-amber-700 border-amber-100' :
            'bg-blue-50 text-blue-700 border-blue-100'
         }`}>
          {task.priority}
        </span>
        {(task.startDate || task.dueDate) && (
             <span className="text-[10px] text-slate-500 flex items-center bg-slate-50 px-1.5 rounded border border-slate-100">
                <Clock size={10} className="mr-1" />
                {formatDate(task.startDate)} {task.startDate && task.dueDate ? '-' : ''} {formatDate(task.dueDate)}
             </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <MessageSquare size={14} />
          <span>{task.comments || 0}</span>
        </div>
        {assignee && (
          <img src={assignee.avatar} alt={assignee.name} title={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" />
        )}
      </div>
    </div>
  );
};

export default TaskCard;