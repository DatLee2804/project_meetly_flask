// src/components/modals/CreateMeetingModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import { User, Project } from '../../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (meetingData: any) => void;
  users: User[];          // Danh sách toàn bộ user để map ID -> Tên
  activeProject: Project | null; // Cần project để lấy danh sách thành viên team
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ 
  isOpen, onClose, onCreate, users, activeProject 
}) => {
  // Init State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Format mặc định cho input datetime-local: YYYY-MM-DDTHH:mm
  const defaultStart = new Date();
  defaultStart.setMinutes(defaultStart.getMinutes() + 30); // Mặc định bắt đầu sau 30p
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1); // Mặc định kéo dài 1 tiếng

  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 16));
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen && activeProject) {
        setTitle('');
        setDescription('');
        // Mặc định chọn tất cả thành viên trong dự án
        setAttendeeIds(activeProject.members); 
    }
  }, [isOpen, activeProject]);

  if (!isOpen || !activeProject) return null;

  const handleToggleAttendee = (userId: string) => {
    setAttendeeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Validate ngày tháng đơn giản
    if (new Date(startDate) >= new Date(endDate)) {
        alert("End time must be after start time");
        return;
    }

    const meetingPayload = {
      title,
      description,
      startDate: new Date(startDate).toISOString(), // Chuyển về chuẩn ISO cho Backend
      endDate: new Date(endDate).toISOString(),
      attendees: attendeeIds,
      projectId: activeProject.id
    };

    onCreate(meetingPayload);
  };

  // Lọc ra danh sách User object thuộc Project này
  const projectMembers = users.filter(u => activeProject.members.includes(u.id));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">Schedule New Meeting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meeting Title</label>
            <input 
              autoFocus
              className="w-full bg-slate-800 border border-slate-600 p-3 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" 
              placeholder="e.g. Weekly Sync - Alpha" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meeting Agenda / Description</label>
            <textarea 
              className="w-full bg-slate-800 border border-slate-600 p-3 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none h-24" 
              placeholder="Discuss project milestones..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Row: Dates */}
          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Start Time</label>
                <div className="relative">
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                    <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>
             </div>
             <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">End Time</label>
                <div className="relative">
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-800 border border-slate-600 p-3 pl-10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                    <Clock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>
             </div>
          </div>

          {/* Attendees List */}
          <div>
             <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                <Users size={14}/> Add Attendees (Project Team)
             </label>
             <div className="bg-slate-800 border border-slate-600 rounded-lg max-h-40 overflow-y-auto p-2">
                {projectMembers.length > 0 ? (
                    projectMembers.map(user => (
                        <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer transition">
                            <input 
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
                                checked={attendeeIds.includes(user.id)}
                                onChange={() => handleToggleAttendee(user.id)}
                            />
                            <div className="flex items-center gap-2">
                                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                                <div className="text-sm text-slate-200">
                                    {user.name} <span className="text-slate-500 text-xs ml-1">({user.email})</span>
                                </div>
                            </div>
                        </label>
                    ))
                ) : (
                    <p className="text-slate-500 text-sm text-center p-2">No members found in this project.</p>
                )}
             </div>
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
             onClick={handleSubmit}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-900/20 transition w-full sm:w-auto"
           >
             Schedule Meeting
           </button>
        </div>

      </div>
    </div>
  );
};

export default CreateMeetingModal;