import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiBriefcase, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
    <div className={`p-4 rounded-lg bg-${color}-100 text-${color}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/employee');
        setStats(data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 flex justify-center text-gray-500">Loading dashboard...</div>;
  if (!stats) return null;

  const { taskSummary, myProjects, upcomingDeadlines } = stats;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending Tasks" value={taskSummary.pending} icon={<FiAlertCircle className="text-2xl" />} color="red" />
        <StatCard title="In Progress" value={taskSummary.inProgress} icon={<FiClock className="text-2xl" />} color="blue" />
        <StatCard title="Completed Tasks" value={taskSummary.completed} icon={<FiCheckSquare className="text-2xl" />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiBriefcase className="text-primary-500" /> My Projects</h3>
            <Link to="/employee/projects" className="text-sm text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-3 py-1.5 rounded-md transition-colors">View All</Link>
          </div>
          <div className="space-y-4">
            {myProjects.length === 0 ? (
              <p className="text-gray-500 text-sm">No assigned projects.</p>
            ) : myProjects.slice(0, 5).map(proj => (
              <div key={proj._id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{proj.name}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border 
                     ${proj.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      proj.status === 'ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                    {proj.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 font-medium">{proj.client?.company}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 overflow-hidden">
                  <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${proj.progress || 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FiClock className="text-red-500" /> Upcoming Deadlines</h3>
            <Link to="/employee/tasks" className="text-sm text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-3 py-1.5 rounded-md transition-colors">View Tasks</Link>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming deadlines.</p>
            ) : upcomingDeadlines.map(task => (
              <div key={task._id} className="flex justify-between items-center p-3 sm:p-4 bg-red-50/70 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{task.title}</h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">{task.project?.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">{new Date(task.dueDate).toLocaleDateString()}</div>
                  <div className="text-[10px] uppercase font-bold bg-white border border-red-200 text-red-500 px-2 py-0.5 rounded mt-1 inline-block">{task.priority} Priority</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
