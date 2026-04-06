import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBriefcase, FiUsers } from 'react-icons/fi';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/projects');
        setProjects(data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      onhold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? <p className="text-gray-500">Loading projects...</p> : projects.length === 0 ? <p className="text-gray-500">No active projects assigned.</p> : (
          projects.map(proj => (
            <div key={proj._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 border border-primary-200 shadow-inner">
                    <FiBriefcase className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{proj.name}</h3>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">{proj.client?.company}</p>
                  </div>
                </div>
                {getStatusBadge(proj.status)}
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed flex-grow">{proj.description || 'No description provided.'}</p>

              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  <span>Progress</span>
                  <span className="text-primary-600">{proj.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                  <div className="bg-primary-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${proj.progress || 0}%` }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 text-sm grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold trackering-wider text-gray-500 mb-1">Tech Stack</p>
                  <p className="font-medium text-gray-800 truncate">{proj.technologyStack?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold trackering-wider text-gray-500 mb-1 flex items-center gap-1.5"><FiUsers className="text-lg -mt-0.5" /> Team Size</p>
                  <p className="font-medium text-gray-800">{proj.assignedEmployees?.length || 0} Members</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default MyProjects;
