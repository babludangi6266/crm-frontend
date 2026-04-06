import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiCheckSquare } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    title: '', description: '', project: '', assignedTo: '',
    priority: 'medium', status: 'pending', dueDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projRes, empRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/users')
      ]);
      setTasks(taskRes.data);
      setProjects(projRes.data);
      setEmployees(empRes.data.filter(u => u.role === 'employee'));
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (task = null) => {
    if (task) {
      setCurrentTask({
        ...task,
        project: task.project?._id || '',
        assignedTo: task.assignedTo?._id || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      setCurrentTask({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', status: 'pending', dueDate: '' });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/tasks/${currentTask._id}`, currentTask);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', currentTask);
        toast.success('Task added successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        toast.success('Task deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const getPriorityBadge = (priority) => {
    const map = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-orange-100 text-orange-800 border-orange-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${map[priority]}`}>{priority}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      inprogress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    const textMap = { pending: 'Pending', inprogress: 'In Progress', completed: 'Completed' };
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${map[status]}`}>{textMap[status]}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Tasks Management</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <FiPlus /> New Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Task Details</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Assignee</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Due Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading tasks...</td></tr>
                : tasks.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">No tasks found. Create one.</td></tr> : (
                  tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 w-96">
                        <div className="flex items-start gap-3">
                          <FiCheckSquare className="mt-1 flex-shrink-0 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{task.title}</span>
                              {getPriorityBadge(task.priority)}
                            </div>
                            <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">{task.description}</div>
                            <div className="text-primary-600 font-medium text-xs mt-1">Project: {task.project?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{task.assignedTo?.name}</div>
                        <div className="text-gray-500 text-xs">{task.assignedTo?.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500' : 'text-gray-700'}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(task.status)}</td>
                      <td className="p-4 flex gap-2 justify-end items-center h-full pt-6">
                        <button onClick={() => handleOpenModal(task)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"><FiEdit className="text-lg" /></button>
                        <button onClick={() => handleDelete(task._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="text-lg" /></button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.title} onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20" value={currentTask.description} onChange={e => setCurrentTask({ ...currentTask, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.project} onChange={e => setCurrentTask({ ...currentTask, project: e.target.value })}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.assignedTo} onChange={e => setCurrentTask({ ...currentTask, assignedTo: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.priority} onChange={e => setCurrentTask({ ...currentTask, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.status} onChange={e => setCurrentTask({ ...currentTask, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentTask.dueDate} onChange={e => setCurrentTask({ ...currentTask, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Tasks;
