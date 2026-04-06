import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiPieChart, 
  FiUsers, 
  FiBriefcase, 
  FiCheckSquare, 
  FiFileText, 
  FiUser, 
  FiX,
  FiCalendar,
  FiMessageSquare,
  FiTarget
} from 'react-icons/fi';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { pathname } = location;
  const trigger = useRef(null);
  const sidebar = useRef(null);
  
  const { userInfo } = useSelector((state) => state.auth);
  const isAdmin = userInfo?.role === 'admin';

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const adminLinks = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <FiPieChart /> },
    { title: 'Calendar', path: '/admin/calendar', icon: <FiCalendar /> },
    { title: 'Chat', path: '/admin/chat', icon: <FiMessageSquare /> },
    { title: 'Leads', path: '/admin/leads', icon: <FiTarget /> },
    { title: 'Clients', path: '/admin/clients', icon: <FiUsers /> },
    { title: 'Projects', path: '/admin/projects', icon: <FiBriefcase /> },
    { title: 'Employees', path: '/admin/employees', icon: <FiUser /> },
    { title: 'Tasks', path: '/admin/tasks', icon: <FiCheckSquare /> },
    { title: 'Invoices', path: '/admin/invoices', icon: <FiFileText /> },
    { title: 'Reports', path: '/admin/reports', icon: <FiFileText /> },
  ];

  const employeeLinks = [
    { title: 'Dashboard', path: '/employee/dashboard', icon: <FiPieChart /> },
    { title: 'Calendar', path: '/employee/calendar', icon: <FiCalendar /> },
    { title: 'Chat', path: '/employee/chat', icon: <FiMessageSquare /> },
    { title: 'Leads', path: '/employee/leads', icon: <FiTarget /> },
    { title: 'Reports', path: '/employee/reports', icon: <FiFileText /> },
    { title: 'My Tasks', path: '/employee/tasks', icon: <FiCheckSquare /> },
    { title: 'My Projects', path: '/employee/projects', icon: <FiBriefcase /> },
    { title: 'Profile', path: '/employee/profile', icon: <FiUser /> },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-40 flex h-full w-64 flex-col overflow-y-hidden glass-dark text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] duration-300 ease-linear lg:static lg:translate-x-0 lg:rounded-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5 lg:py-6">
        <NavLink to="/">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-2 shadow-lg">
              <FiBriefcase className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Lexa<span className="text-primary-500">CRM</span></h1>
          </div>
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="block lg:hidden text-gray-400 hover:text-white"
        >
          <FiX className="text-2xl" />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-2 py-4 px-4 lg:mt-4 lg:px-6">
          <ul className="mb-6 flex flex-col gap-2">
            {links.map((link, index) => (
              <li key={index}>
                <NavLink
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-300 ease-in-out hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg ${
                    pathname.includes(link.path) ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-gray-300'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  {link.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
