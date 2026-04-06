import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState({ name: '', company: '', email: '', phone: '', address: '', gst: '' });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setEditMode(true);
    } else {
      setCurrentClient({ name: '', company: '', email: '', phone: '', address: '', gst: '' });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/clients/${currentClient._id}`, currentClient);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', currentClient);
        toast.success('Client added successfully');
      }
      setModalOpen(false);
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/clients/${id}`);
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Clients Management</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
        >
          <FiPlus /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Company</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Email</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Phone</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading clients...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No clients found. Click "Add Client" to get started.</td></tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{client.name}</td>
                    <td className="p-4 text-gray-600 font-medium">{client.company}</td>
                    <td className="p-4 text-gray-600">{client.email}</td>
                    <td className="p-4 text-gray-600">{client.phone || '-'}</td>
                    <td className="p-4 flex gap-3 justify-end">
                      <button onClick={() => handleOpenModal(client)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                        <FiEdit className="text-lg" />
                      </button>
                      <button onClick={() => handleDelete(client._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete">
                        <FiTrash2 className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={currentClient.name} onChange={e => setCurrentClient({ ...currentClient, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={currentClient.company} onChange={e => setCurrentClient({ ...currentClient, company: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={currentClient.email} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={currentClient.phone} onChange={e => setCurrentClient({ ...currentClient, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none h-20"
              value={currentClient.address} onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST / PAN (Tax ID)</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={currentClient.gst} onChange={e => setCurrentClient({ ...currentClient, gst: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Create Client'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Clients;
