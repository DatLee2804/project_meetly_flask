// src/components/modals/CreateProjectModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectData: { name: string; description: string; memberIds: string[] }) => void;
  users: User[];
  currentUser: User;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, onClose, onCreate, users, currentUser 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  if (!isOpen) return null;

  const handleAddEmail = () => {
    if (emailInput.trim() && !emails.includes(emailInput.trim())) {
      setEmails([...emails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    // Logic: Tìm user ID từ email, nếu không thấy thì vẫn giữ logic add (hoặc bỏ qua tùy bạn)
    const memberIds = [currentUser.id];
    emails.forEach(email => {
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found && !memberIds.includes(found.id)) {
        memberIds.push(found.id);
      }
    });

    onCreate({
      name: name.trim(),
      description: description.trim(),
      memberIds
    });

    // Reset form
    setName('');
    setDescription('');
    setEmails([]);
    setEmailInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Create New Project</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Project Name
            </label>
            <input
              autoFocus
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-700 placeholder:text-slate-400"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none text-slate-700 placeholder:text-slate-400 h-28"
              placeholder="Brief description of the project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Add Members */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Add Members by Email
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 placeholder:text-slate-400"
                placeholder="colleague@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              />
              <button
                onClick={handleAddEmail}
                className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-semibold transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Try: sarah@company.com, mike@company.com
            </p>

            {/* Email Chips */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {emails.map((email, idx) => (
                  <div key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-slate-200">
                    <span>{email}</span>
                    <button onClick={() => setEmails(emails.filter(e => e !== email))} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;