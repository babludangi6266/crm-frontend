import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState({
    name: '', description: '', client: '', status: 'ongoing', budget: 0,
    assignedEmployees: [], technologyStack: '', startDate: '', endDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, cliRes, empRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/users')
      ]);
      setProjects(projRes.data);
      setClients(cliRes.data);
      setEmployees(empRes.data.filter(u => u.role === 'employee'));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (project = null) => {
    if (project) {
      setCurrentProject({
        ...project,
        client: project.client?._id || '',
        assignedEmployees: project.assignedEmployees.map(e => e._id),
        technologyStack: project.technologyStack.join(', '),
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      setCurrentProject({
        name: '', description: '', client: '', status: 'ongoing', budget: 0,
        assignedEmployees: [], technologyStack: '', startDate: '', endDate: ''
      });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...currentProject };
      payload.technologyStack = payload.technologyStack.split(',').map(t => t.trim()).filter(Boolean);

      if (editMode) {
        await api.put(`/projects/${currentProject._id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project added successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        toast.success('Project deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      onhold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${map[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Projects Management</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <FiPlus /> New Project
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Project Info</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Client</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Progress</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading projects...</td></tr>
                : projects.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">No projects found. Provide a client to create one.</td></tr> : (
                  projects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{proj.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{proj.description}</div>
                        <div className="text-gray-400 text-xs mt-1">Tech: {proj.technologyStack?.join(', ') || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{proj.client?.company}</div>
                        <div className="text-gray-500 text-xs">{proj.client?.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-200">
                          <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${proj.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 mt-1 block">{proj.progress || 0}% Complete</span>
                      </td>
                      <td className="p-4">{getStatusBadge(proj.status)}</td>
                      <td className="p-4 flex gap-2 justify-end items-center h-full">
                        <button onClick={() => handleOpenModal(proj)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"><FiEdit className="text-lg" /></button>
                        <button onClick={() => handleDelete(proj._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="text-lg" /></button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Project' : 'Create Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.name} onChange={e => setCurrentProject({ ...currentProject, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 resize-none h-16" value={currentProject.description} onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.client} onChange={e => setCurrentProject({ ...currentProject, client: e.target.value })}>
              <option value="">Select a Client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.company} ({c.name})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.status} onChange={e => setCurrentProject({ ...currentProject, status: e.target.value })}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="onhold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.budget} onChange={e => setCurrentProject({ ...currentProject, budget: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack (comma separated)</label>
            <input type="text" placeholder="e.g. React, Node.js, MongoDB" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.technologyStack} onChange={e => setCurrentProject({ ...currentProject, technologyStack: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Employees (Ctrl/Cmd+Click to select multiple)</label>
            <select multiple className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 h-28 custom-scrollbar" value={currentProject.assignedEmployees} onChange={e => {
              const options = [...e.target.options];
              const selected = options.filter(o => o.selected).map(o => o.value);
              setCurrentProject({ ...currentProject, assignedEmployees: selected });
            }}>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.department || 'No dept'})</option>)}
            </select>
          </div>
          {editMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
              <input type="number" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentProject.progress} onChange={e => setCurrentProject({ ...currentProject, progress: e.target.value })} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Projects;
