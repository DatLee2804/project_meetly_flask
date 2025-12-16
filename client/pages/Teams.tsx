// src/pages/Teams.tsx
import React, { useState } from 'react';
import { Plus, Users, CheckSquare, Briefcase, ChevronLeft, UserPlus, Shield, ExternalLink, Mail } from 'lucide-react';
import { User, Project, Task, TaskStatus, Priority } from '../types';

interface TeamsProps {
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  users: User[]; 
  onCreateTeam: () => void;
  onAddMember: (projectId: string, email: string) => void;
  // Callback tùy chọn nếu muốn nhảy sang Board từ trang chi tiết
  onOpenBoard?: (project: Project) => void; 
}

const Teams: React.FC<TeamsProps> = ({ 
  currentUser, 
  projects, 
  tasks, 
  users, 
  onCreateTeam,
  onAddMember,
  onOpenBoard
}) => {
  // State quản lý xem đang xem Team nào. Nếu null -> Xem list team.
  const [selectedTeam, setSelectedTeam] = useState<Project | null>(null);
  
  // State cho Modal mời thành viên
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Lọc dự án của user
  const myTeams = projects.filter(p => p.members.includes(currentUser.id));

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(selectedTeam && inviteEmail) {
      onAddMember(selectedTeam.id, inviteEmail);
      setInviteEmail('');
      setIsInviteOpen(false);
    }
  };

  // Helper màu mè
  const getProjectColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-indigo-600', 'bg-pink-600', 'bg-emerald-600'];
    return colors[name.length % colors.length];
  };

  // --- VIEW 1: CHI TIẾT THÀNH VIÊN (Giống ảnh 2) ---
  if (selectedTeam) {
    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header: Back button & Actions */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedTeam(null)} 
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {selectedTeam.name}
                        </h2>
                        <p className="text-sm text-slate-500">Team Management & Members</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {onOpenBoard && (
                        <button 
                            onClick={() => onOpenBoard(selectedTeam)}
                            className="text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 font-medium flex items-center gap-2 border border-slate-200"
                        >
                            <ExternalLink size={18} /> Go to Board
                        </button>
                    )}
                    <button 
                        onClick={() => setIsInviteOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm shadow-indigo-200"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>
            </div>

            {/* Member List Content */}
            <div className="p-8 overflow-y-auto max-w-5xl mx-auto w-full">
                <div className="space-y-4">
                    {selectedTeam.members.map((memberId, index) => {
                        const member = users.find(u => u.id === memberId);
                        if (!member) return null;

                        // Logic: Người đầu tiên là Manager (ví dụ)
                        const role = index === 0 ? 'Manager' : 'Member';
                        
                        // Lọc tasks của user này trong dự án
                        const activeTasks = tasks.filter(t => 
                            t.projectId === selectedTeam.id && 
                            t.assigneeId === memberId && 
                            t.status !== TaskStatus.DONE
                        );

                        return (
                            <div key={memberId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                {/* User Info */}
                                <div className="flex items-start gap-4 min-w-[280px]">
                                    <div className="relative">
                                        <img 
                                            src={member.avatar} 
                                            alt={member.name} 
                                            className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" 
                                        />
                                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${role === 'Manager' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {role === 'Manager' ? <Shield size={12} fill="currentColor" /> : <Users size={12} />}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">{member.name}</h4>
                                        <p className="text-sm text-slate-500 mb-2">{member.email}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            role === 'Manager' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            {role}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px bg-slate-100 self-stretch"></div>

                                {/* Active Tasks */}
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Active Tasks ({activeTasks.length})
                                        </span>
                                        {activeTasks.length === 0 && (
                                            <span className="text-xs text-slate-400 italic">No active tasks assigned.</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {activeTasks.map(t => (
                                            <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 max-w-[220px]">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    t.priority === Priority.HIGH ? 'bg-red-500' : 
                                                    t.priority === Priority.MEDIUM ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                                <span className="text-xs text-slate-700 font-medium truncate">{t.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invite Modal (Local) */}
            {isInviteOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Invite to {selectedTeam.name}</h3>
                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsInviteOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Send Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- VIEW 2: DANH SÁCH TEAMS (Grid View - Giống ảnh 1) ---
  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
       <div className="flex justify-between items-start mb-8">
         <div>
            <h2 className="text-3xl font-bold text-slate-800">Your Teams</h2>
            <p className="text-slate-500 mt-1">Manage your project teams and members.</p>
         </div>
         <button 
            onClick={onCreateTeam} 
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 transition"
         >
            <Plus size={20} /> Create New Team
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myTeams.map(team => {
            const memberCount = team.members.length;
            const taskCount = tasks.filter(t => t.projectId === team.id).length;
            const teamMembers = users.filter(u => team.members.includes(u.id));

            return (
                <div 
                  key={team.id} 
                  onClick={() => setSelectedTeam(team)} // Click vào card -> Set selected -> Chuyển view
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition cursor-pointer group flex flex-col justify-between h-full"
                >
                   {/* Card Content */}
                   <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 ${getProjectColor(team.name)} rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition`}>
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex -space-x-2">
                        {teamMembers.slice(0, 3).map(u => (
                          <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={u.name} />
                        ))}
                        {memberCount > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-medium">+{memberCount - 3}</div>
                        )}
                      </div>
                   </div>

                   <div className="mb-6">
                      <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-indigo-600 transition">{team.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5em]">
                        {team.description || "No description provided."}
                      </p>
                   </div>
                   
                   <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-slate-100 pt-4 mt-auto">
                      <div className="flex items-center gap-1.5"><Users size={16} className="text-slate-400"/><span>{memberCount} Members</span></div>
                      <div className="flex items-center gap-1.5"><CheckSquare size={16} className="text-slate-400"/><span>{taskCount} Tasks</span></div>
                   </div>
                </div>
            );
          })}
          
          {myTeams.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="bg-slate-50 p-4 rounded-full mb-4"><Briefcase size={32} className="text-slate-400" /></div>
                  <h3 className="text-lg font-semibold text-slate-700">No teams found</h3>
                  <button onClick={onCreateTeam} className="text-indigo-600 font-medium hover:underline mt-2">Create one now</button>
              </div>
          )}
       </div>
    </div>
  );
};

export default Teams;