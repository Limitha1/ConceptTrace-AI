import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbff] text-slate-800 flex flex-col font-sans">

      <TopNavbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
      
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar 
          mobileOpen={mobileSidebarOpen} 
          onCloseMobile={() => setMobileSidebarOpen(false)} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
