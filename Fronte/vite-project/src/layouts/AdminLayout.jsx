import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar/AdminSidebar';
import AdminHeader from '../components/layout/AdminHeader/AdminHeader';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-admin-bg font-sans overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
