// src/pages/Dashboard.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { User, Task, Project, TaskStatus, Priority } from '../types';

interface DashboardProps {
  user: User;
  tasks: Task[];
  projects: Project[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, tasks, projects }) => {
  // 1. Filter tasks assigned to current user
  const myTasks = tasks.filter(t => t.assigneeId === user.id);

  // 2. Data for Priority Chart
  const priorityData = [
    { name: Priority.HIGH, count: myTasks.filter(t => t.priority === Priority.HIGH).length, fill: '#6366f1' }, 
    { name: Priority.MEDIUM, count: myTasks.filter(t => t.priority === Priority.MEDIUM).length, fill: '#818cf8' },
    { name: Priority.LOW, count: myTasks.filter(t => t.priority === Priority.LOW).length, fill: '#a5b4fc' },
  ];

  // 3. Data for Project Status (Active vs Completed - Mock Logic)
  const projectStatusData = [
    { name: 'Active', value: projects.length, color: '#3b82f6' },
    { name: 'Completed', value: Math.floor(projects.length * 0.2), color: '#0f172a' } 
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-900 min-h-full text-slate-100">
      <h2 className="text-2xl font-bold mb-6">Project Management Dashboard</h2>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Chart */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="font-semibold mb-6 text-slate-200">My Tasks Priority</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#334155'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="font-semibold mb-6 text-slate-200">Total Projects Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Legend iconType="circle" />
                <Tooltip contentStyle={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Your Tasks Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="font-semibold text-slate-200">Your Recent Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.length > 0 ? myTasks.slice(0, 5).map(task => (
                <tr key={task.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 text-sm transition">
                  <td className="p-4 font-medium text-slate-200">{task.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium 
                      ${task.status === TaskStatus.DONE ? 'bg-green-500/20 text-green-400' : 
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600 text-slate-300'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`${task.priority === Priority.HIGH ? 'text-red-400' : 'text-slate-400'}`}>
                        {task.priority}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{task.dueDate}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No tasks assigned to you yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;