import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { FiUsers, FiBriefcase, FiUserCheck, FiDollarSign, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444']; // primary teal, amber, red

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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/admin');
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

  const { cards, projectDistribution, upcomingDeadlines, employeePerformance } = stats;

  const pieData = [
    { name: 'Ongoing', value: projectDistribution.ongoing },
    { name: 'On Hold', value: projectDistribution.onHold },
    { name: 'Completed', value: projectDistribution.completed },
  ];

  const barData = employeePerformance.map(emp => ({
    name: emp.name.split(' ')[0],
    completedTasks: emp.completedTasks
  }));

  // Mock revenue monthly data
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: cards.totalRevenue || 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Clients" value={cards.totalClients} icon={<FiUsers className="text-2xl" />} color="primary" />
        <StatCard title="Total Projects" value={cards.totalProjects} icon={<FiBriefcase className="text-2xl" />} color="primary" />
        <StatCard title="Total Employees" value={cards.totalEmployees} icon={<FiUserCheck className="text-2xl" />} color="primary" />
        <StatCard title="Total Revenue" value={`$${cards.totalRevenue.toLocaleString()}`} icon={<FiDollarSign className="text-2xl" />} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Project Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Employee Performance (Tasks Completed)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="completedTasks" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="text-red-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map(task => (
                <div key={task._id} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 text-red-900 rounded-r-md">
                  <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">Project: {task.project?.name}</p>
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
