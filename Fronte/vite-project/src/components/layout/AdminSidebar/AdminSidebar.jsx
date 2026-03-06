import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MonitorPlay, 
  Film,
  Ticket,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ item, currentPath }) => {
  const [isOpen, setIsOpen] = useState(
    item.subItems ? item.subItems.some(sub => currentPath.startsWith(sub.path)) : false
  );

  const isActive = item.path 
    ? (item.path === '/admin' ? currentPath === '/admin' : currentPath.startsWith(item.path))
    : item.subItems?.some(sub => currentPath.startsWith(sub.path));

  if (item.subItems) {
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between px-4 py-3 rounded-md transition-all duration-200 ${
            isActive 
              ? 'bg-white/10 text-white font-medium border-l-4 border-white' 
              : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={isActive ? 'text-white' : 'text-white/70'}>
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="text-white/50">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </button>
        
        {isOpen && (
          <div className="flex flex-col space-y-1 pl-11 pr-3 py-1">
            {item.subItems.map((sub, idx) => {
              const isSubActive = currentPath === sub.path || currentPath.startsWith(sub.path + '/');
              return (
                <NavLink
                  key={idx}
                  to={sub.path}
                  className={`flex items-center py-2 px-3 rounded-md transition-all duration-200 ${
                    isSubActive
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{sub.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 ${
        isActive 
          ? 'bg-white/10 text-white font-medium border-l-4 border-white' 
          : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
      }`}
    >
      <div className={isActive ? 'text-white' : 'text-white/70'}>
        {item.icon}
      </div>
      <span className="text-sm font-medium">{item.name}</span>
    </NavLink>
  );
};

const AdminSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { 
      name: 'Tổng quan', 
      path: '/admin', 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      name: 'Tạo vé (POS)', 
      path: '/admin/pos', 
      icon: <Ticket size={20} /> 
    },
    { 
      name: 'Quản lý rạp chiếu', 
      icon: <MonitorPlay size={20} />,
      subItems: [
        { name: 'Quản lý phòng', path: '/admin/rooms' },
        { name: 'Quản lý sơ đồ ghế', path: '/admin/seat-map' }
      ]
    },
    { 
      name: 'Phim và Suất Chiếu', 
      icon: <Film size={20} />,
      subItems: [
        { name: 'Quản lý phim', path: '/admin/movies' },
        { name: 'Quản lý suất chiếu', path: '/admin/showtimes' },
        { name: 'Quản lý hóa đơn', path: '/admin/invoices' }
      ]
    },
    { 
      name: 'Khách hàng', 
      path: '/admin/users', 
      icon: <Users size={20} /> 
    }
  ];

  return (
    <aside className="w-64 bg-admin-sidebar text-white min-h-screen flex flex-col shrink-0 overflow-y-auto">
      <div className="h-20 flex items-center px-6 border-b border-white/10 sticky top-0 bg-admin-sidebar z-10">
        <h1 className="text-xl font-bold tracking-widest uppercase text-white">BEECINEMA</h1>
      </div>
      
      <div className="p-4 pt-6 text-xs font-semibold text-white/50 uppercase tracking-widest">
        Menu
      </div>
      
      <nav className="flex-1 flex flex-col space-y-1.5 px-3 pb-6">
        {menuItems.map((item, index) => (
          <SidebarItem key={index} item={item} currentPath={currentPath} />
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
