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

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== newStatus) {
      try {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        await api.put(`/tasks/${taskId}`, { status: newStatus });
        toast.success(`Task moved`);
      } catch (error) {
        toast.error('Failed to move task');
        fetchData();
      }
    }
  };

  const renderTaskCard = (task) => (
    <div 
      key={task._id} 
      draggable 
      onDragStart={(e) => handleDragStart(e, task)}
      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col cursor-move hover:shadow-md transition-shadow active:cursor-grabbing"
    >
      <div className="flex justify-between items-start mb-2">
        {getPriorityBadge(task.priority)}
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal(task)} className="text-blue-400 hover:text-blue-600 transition-colors"><FiEdit /></button>
          <button onClick={() => handleDelete(task._id)} className="text-red-400 hover:text-red-600 transition-colors"><FiTrash2 /></button>
        </div>
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{task.title}</h3>
      {task.project && <p className="text-[10px] font-semibold text-primary-600 mb-2 bg-primary-50 inline-block px-1.5 py-0.5 rounded truncate">{task.project.name}</p>}
      <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
      
      <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-100 flex items-center gap-2">
        <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold text-gray-600">
          {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : '?'}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-800">{task.assignedTo?.name || 'Unassigned'}</p>
          <p className="text-[9px] text-gray-500">{task.assignedTo?.email}</p>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-gray-400'}`}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Tasks Kanban (Global)</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <FiPlus /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[calc(100vh-200px)]">
        {loading ? <p className="text-gray-500 lg:col-span-3">Loading kanban board...</p> : (
          <>
            {/* Pending Column */}
            <div className="bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden"
                 onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'pending')}>
              <div className="p-4 bg-gray-100/50 border-b border-gray-200">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs flex items-center justify-between">
                  Pending <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status==='pending').length}</span>
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
                 {tasks.filter(t => t.status==='pending').map(renderTaskCard)}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-blue-50/30 rounded-xl border border-blue-100 flex flex-col h-full overflow-hidden"
                 onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'inprogress')}>
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-bold text-blue-800 uppercase tracking-wider text-xs flex items-center justify-between">
                  In Progress <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status==='inprogress').length}</span>
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
                 {tasks.filter(t => t.status==='inprogress').map(renderTaskCard)}
              </div>
            </div>

            {/* Completed Column */}
            <div className="bg-teal-50/30 rounded-xl border border-teal-100 flex flex-col h-full overflow-hidden"
                 onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'completed')}>
              <div className="p-4 bg-teal-50 border-b border-teal-100">
                <h3 className="font-bold text-teal-800 uppercase tracking-wider text-xs flex items-center justify-between">
                  Completed <span className="bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status==='completed').length}</span>
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
                 {tasks.filter(t => t.status==='completed').map(renderTaskCard)}
              </div>
            </div>
          </>
        )}
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
