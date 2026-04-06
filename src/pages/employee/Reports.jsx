import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiPlus, FiEdit } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], content: '' });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports');
      // Sort descending by date
      const sorted = data.sort((a,b) => new Date(b.date) - new Date(a.date));
      setReports(sorted);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenModal = (report = null) => {
    if (report) {
       setFormData({ date: new Date(report.date).toISOString().split('T')[0], content: report.content });
    } else {
       setFormData({ date: new Date().toISOString().split('T')[0], content: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create or update based on date
      await api.post('/reports', formData);
      toast.success('Report submitted successfully');
      setModalOpen(false);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <FiFileText className="text-primary-500" /> My Daily Reports
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
        >
          <FiPlus /> Submit Today's Report
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs w-40">Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Report Content</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No reports found. Click "Submit Today's Report".</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-700">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600 whitespace-pre-wrap">
                      {report.content}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(report)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                        <FiEdit className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Daily Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">If a report already exists for this date, it will be updated.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What did you work on? *</label>
            <textarea required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none h-40"
              value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="List your tasks, progress, blockers, etc..." />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Submit Report</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Reports;
