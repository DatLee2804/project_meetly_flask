// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { Mail, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import * as mockApi from '../api/mockApi';

interface AuthPageProps {
  onLogin: (u: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        // Mock Registration Logic
        await mockApi.registerUser(formData); 
        alert("Registration successful! Please login.");
        setIsRegister(false);
      } else {
        const user = await mockApi.loginUser({
            username: formData.username,
            password: formData.password
        });
        onLogin(user);
      }
    } catch (error: any) {
      const msg = (error).response?.data?.detail || "Authentication failed";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-2xl border border-indigo-700">
        <h2 className="text-3xl font-bold text-center text-indigo-400">
          {isRegister ? 'Register' : 'JiraMeet AI Login'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required
                className="w-full bg-slate-700 border border-slate-600 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
              />
            </div>
          )}
          {isRegister && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required
                className="w-full bg-slate-700 border border-slate-600 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
              />
            </div>
          )}
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username (Try 'alexj')" required
              className="w-full bg-slate-700 border border-slate-600 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
            />
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required
              className="w-full bg-slate-700 border border-slate-600 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-center text-slate-400">
          {isRegister ? 'Already have an account?' : 'Need an account?'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 transition"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;