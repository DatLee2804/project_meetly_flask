// src/pages/Settings.tsx
import React, { useState } from 'react';
import { Camera, X } from 'lucide-react'; // <--- Nhớ import X
import { User } from '../types';

interface UserSettingsProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void; // <--- Thêm prop này để tắt bảng
}

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser, onUpdateUser, onClose }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [password, setPassword] = useState('');

  const handleSave = () => {
    // Logic lưu update (giả lập)
    const updatedUser = { ...currentUser, name, email, avatar };
    onUpdateUser(updatedUser);
    
    alert("Profile updated successfully!");
    onClose(); // <--- Lưu xong thì tự động đóng luôn
  };

  return (
    // Thêm lớp overlay tối màu phía sau để focus vào settings
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
        
      {/* Panel Settings trượt từ phải sang */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header có nút tắt */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>
            <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
                <X size={24} />
            </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                    <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="text-white" />
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-2">@{currentUser.username || 'username'}</p>
            </div>

            {/* Inputs */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input 
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled // Thường email không cho sửa lung tung
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Avatar URL</label>
                <input 
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <input 
                    type="password"
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition"
            >
                Save Changes
            </button>
        </div>

      </div>
    </div>
  );
};

export default UserSettings;