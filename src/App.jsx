import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Login from './pages/auth/Login';

// Admin Imports
import AdminDashboard from './pages/admin/Dashboard';
import Clients from './pages/admin/Clients';
import Projects from './pages/admin/Projects';
import Employees from './pages/admin/Employees';
import AdminTasks from './pages/admin/Tasks';
import Invoices from './pages/admin/Invoices';
import AdminReports from './pages/admin/Reports';

// Employee Imports
import EmployeeDashboard from './pages/employee/Dashboard';
import MyTasks from './pages/employee/MyTasks';
import MyProjects from './pages/employee/MyProjects';
import Profile from './pages/employee/Profile';

// Shared
import CalendarView from './pages/shared/CalendarView';
import ChatView from './pages/shared/ChatView';
import LeadsView from './pages/shared/Leads';

// Reports
import ReportsView from './pages/employee/Reports';

const ProtectedRoute = ({ children, role }) => {
  const { userInfo } = useSelector((state) => state.auth);
  
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (role && userInfo.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Root Redirect */}
          <Route 
             path="/" 
             element={
               userInfo ? (
                 <Navigate to={userInfo.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
               ) : (
                 <Navigate to="/login" replace />
               )
             } 
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="leads" element={<LeadsView />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="employees" element={<Employees />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={<ProtectedRoute role="employee"><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="leads" element={<LeadsView />} />
            <Route path="reports" element={<ReportsView />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="projects" element={<MyProjects />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
