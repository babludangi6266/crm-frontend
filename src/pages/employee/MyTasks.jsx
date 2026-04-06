import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiMessageSquare } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';
import { useSelector } from 'react-redux';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '', dueDate: '', priority: 'medium', project: '' });
  const [projects, setProjects] = useState([]);
  const { userInfo } = useSelector(state => state.auth);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error);
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newTaskData };
      if (!payload.project) delete payload.project;
      await api.post('/tasks', payload);
      toast.success('Task created successfully');
      setCreateModalOpen(false);
      setNewTaskData({ title: '', description: '', dueDate: '', priority: 'medium', project: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  };

  const handleOpenModal = (task) => {
    setCurrentTask(task);
    setNewStatus(task.status);
    setNewComment('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (newStatus !== currentTask.status) payload.status = newStatus;
      if (newComment.trim()) payload.comment = newComment.trim();

      if (Object.keys(payload).length > 0) {
        await api.put(`/tasks/${currentTask._id}`, payload);
        toast.success('Task updated successfully');
        fetchTasks();
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const getPriorityBadge = (p) => {
    const c = p === 'high' ? 'text-red-700 bg-red-100 border-red-200' : p === 'medium' ? 'text-orange-700 bg-orange-100 border-orange-200' : 'text-green-700 bg-green-100 border-green-200';
    return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${c}`}>{p}</span>;
  };
  const getStatusBadge = (s) => {
    const c = s === 'completed' ? 'bg-teal-100 text-teal-800 border-teal-200' : s === 'inprogress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200';
    const txt = s === 'inprogress' ? 'In Progress' : s === 'completed' ? 'Completed' : 'Pending';
    return <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${c}`}>{txt}</span>;
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
        fetchTasks();
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
        <button onClick={() => handleOpenModal(task)} className="text-gray-400 hover:text-primary-600 transition-colors">
          <FiMessageSquare />
        </button>
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{task.title}</h3>
      {task.project && <p className="text-[10px] font-semibold text-primary-600 mb-2 bg-primary-50 inline-block px-1.5 py-0.5 rounded truncate">{task.project.name}</p>}
      <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-grow">{task.description}</p>
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-gray-400'}`}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">My Tasks Kanban</h2>
        <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium">
          <FiCheckSquare /> New Task
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Update Task Progress">
        {currentTask && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-1">{currentTask.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{currentTask.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 bg-white" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiMessageSquare className="text-primary-500" /> Add Comment / Work Log
              </label>
              <textarea className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 resize-none h-24" placeholder="Describe what you worked on..." value={newComment} onChange={e => setNewComment(e.target.value)}></textarea>
            </div>

            {currentTask.comments && currentTask.comments.length > 0 && (
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                <h5 className="font-medium text-sm text-gray-700 mb-3 border-b border-gray-200 pb-2">Previous Comments</h5>
                <div className="space-y-4">
                  {currentTask.comments.map((c, i) => (
                    <div key={i} className="text-sm border-l-2 border-primary-500 pl-3">
                      <p className="text-gray-800 leading-relaxed">{c.text}</p>
                      <p className="text-[10px] font-semibold text-gray-500 mt-1 uppercase tracking-wider">{new Date(c.createdAt).toLocaleString()} • {c.createdBy === userInfo._id ? 'You' : 'Admin'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Save Update</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
             <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
               value={newTaskData.title} onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })} />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
             <textarea required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
               value={newTaskData.description} onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
               <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                 value={newTaskData.dueDate} onChange={e => setNewTaskData({ ...newTaskData, dueDate: e.target.value })} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
               <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                 value={newTaskData.priority} onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value })}>
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Related Project (Optional)</label>
             <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                 value={newTaskData.project} onChange={e => setNewTaskData({ ...newTaskData, project: e.target.value })}>
                 <option value="">-- No Project --</option>
                 {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
             </select>
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
             <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
             <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Create Task</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
export default MyTasks;
