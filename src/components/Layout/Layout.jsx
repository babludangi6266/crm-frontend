import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LexaAIBot from '../LexaAIBot';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <div className="lg:py-4 lg:pl-4 h-full">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
        <Navbar setSidebarOpen={setSidebarOpen} />
        
        <main className="w-full grow p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        
        {/* Futuristic Global AI Assistant */}
        <LexaAIBot />
      </div>
    </div>
  );
};

export default Layout;
