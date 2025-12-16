// src/components/modals/EditColumnModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface EditColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

const EditColumnModal: React.FC<EditColumnModalProps> = ({ 
  isOpen, onClose, initialTitle, onRename, onDelete 
}) => {
  const [title, setTitle] = useState(initialTitle);

  // Cập nhật state mỗi khi mở modal với column khác
  useEffect(() => {
    if (isOpen) {
        setTitle(initialTitle);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (title.trim() && title !== initialTitle) {
      onRename(title.trim());
    } else {
        onClose(); // Không đổi gì thì đóng luôn
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Edit Column</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Column Name</label>
            <input
              autoFocus
              className="w-full bg-slate-800 border border-slate-600 p-3 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="space-y-3 pt-2">
            <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-900/20 transition disabled:opacity-50"
            >
                Save Changes
            </button>

            <button
                onClick={onDelete}
                className="w-full py-2.5 bg-slate-700/50 border border-slate-600 text-red-400 hover:bg-red-900/20 hover:border-red-800/50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
                <Trash2 size={16} /> Delete Column
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditColumnModal;