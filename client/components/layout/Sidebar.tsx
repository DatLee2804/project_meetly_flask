// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { 
  Calendar, Users, MessageSquare, Settings, LogOut, Home, 
  Layout, ChevronDown, ChevronRight, FolderPlus, Search 
} from 'lucide-react';
import { User, Project, DashboardView } from '../../types';

interface SidebarProps {
  currentUser: User;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project | null) => void;
  dashboardView: DashboardView;
  setDashboardView: (view: DashboardView) => void;
  onLogout: () => void;
  onToggleChat: () => void;
  onCreateProject: () => void;
  onOpenSettings: () => void;
  
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, projects, activeProject, onSelectProject, 
  dashboardView, setDashboardView, onLogout, onToggleChat, onCreateProject, onOpenSettings
}) => {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(true);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-full">
        <div className="p-5 flex items-center gap-3 border-b border-slate-700">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">J</div>
          <span className="font-bold text-white text-lg tracking-tight">JiraMeet AI</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* User Profile */}
          <div className="flex items-center justify-between mb-6 p-2 bg-slate-800 rounded-lg group">
            <div className="flex items-center gap-3 overflow-hidden">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500 flex-shrink-0" />
                <div className="overflow-hidden">
                    <p className="text-white font-medium truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">Online</p>
                </div>
            </div>
            <button 
                onClick={onOpenSettings}
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
                title="User Settings"
            >
                <Settings size={16} />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input placeholder="Search..." className="w-full bg-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <nav className="space-y-1">
             {/* Global Views */}
             <button 
                onClick={() => { onSelectProject(null); setDashboardView('HOME'); }} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-slate-800 ${activeProject === null && dashboardView === 'HOME' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
             >
                <Home size={18} /> Home
            </button>

            <button 
                onClick={() => { onSelectProject(null); setDashboardView('TIMELINE'); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-slate-800 ${activeProject === null && dashboardView === 'TIMELINE' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
             >
                <Calendar size={18} /> Global Timeline
            </button>

             <button 
                onClick={() => { onSelectProject(null); setDashboardView('TEAMS'); }} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-slate-800 ${activeProject === null && dashboardView === 'TEAMS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
             >
                <Users size={18} /> All Teams
            </button>

            <div className="pt-4 pb-2">
              <div className="w-full h-px bg-slate-700 mb-4"></div>
            </div>

            {/* Projects Dropdown */}
            <div>
              <button 
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)} 
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition hover:bg-slate-800 ${activeProject ? 'text-white' : 'text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                    <Layout size={18} />
                    <span className="truncate">Projects</span>
                </div>
                {isProjectMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isProjectMenuOpen && (
                <div className="mt-1 space-y-1 pl-4 mb-2">
                    {projects.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => onSelectProject(p)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${activeProject?.id === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <span className="truncate">{p.name}</span>
                        </button>
                    ))}
                    <button 
                        onClick={onCreateProject}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                        <FolderPlus size={14} /> Create New Project
                    </button>
                </div>
              )}
            </div>

            <button onClick={onToggleChat} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-indigo-400 mt-4">
              <MessageSquare size={18} /> BotChat AI
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-700">
           <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition w-full">
             <LogOut size={18} /> Sign Out
           </button>
        </div>
    </aside>
  );
};

export default Sidebar;