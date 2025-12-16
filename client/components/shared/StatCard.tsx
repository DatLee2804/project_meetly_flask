// src/components/shared/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // e.g., 'text-green-400'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-800 p-5 rounded-xl shadow-lg flex items-center justify-between border border-slate-700">
    <div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color} bg-slate-700/50`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

export default StatCard;