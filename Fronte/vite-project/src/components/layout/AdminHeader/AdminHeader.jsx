import React from 'react';
import { Menu, Maximize, Bell, Moon } from 'lucide-react';

const AdminHeader = () => {
  return (
    <header className="h-20 bg-white flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
      <div className="flex items-center text-admin-textMuted cursor-pointer hover:text-admin-text">
        <Menu size={24} />
      </div>
      
      <div className="flex items-center space-x-6 text-gray-400">
        <button className="hover:text-admin-sidebar transition-colors">
          <Maximize size={20} />
        </button>
        <button className="hover:text-admin-sidebar transition-colors">
          <Moon size={20} />
        </button>
        <div className="relative cursor-pointer hover:text-admin-sidebar transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        </div>
        
        <div className="flex items-center space-x-3 border-l border-gray-100 pl-6 cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-gray-100 group-hover:ring-admin-sidebar transition-all">
            <img src="https://i.pravatar.cc/150?img=11" alt="admin profile" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-gray-700 group-hover:text-admin-sidebar transition-colors">Admin</span>
            <span className="text-xs text-gray-400">Hoàn Trần</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
