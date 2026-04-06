import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiPlus, FiSearch, FiCalendar, FiList, FiEye, FiEdit } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';
import { useSelector } from 'react-redux';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'calendar' or 'list'
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  
  // Submit own report states
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], content: '' });
  
  const { userInfo } = useSelector(state => state.auth);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports');
      // Sort descending by date
      const sorted = data.sort((a,b) => new Date(b.date) - new Date(a.date));
      setReports(sorted);
      setFilteredReports(sorted);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const filtered = reports.filter(r => 
        r.employee?.name?.toLowerCase().includes(lower) || 
        r.employee?.department?.toLowerCase().includes(lower) ||
        r.content?.toLowerCase().includes(lower)
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [searchTerm, reports]);

  const handleOpenSubmitModal = (report = null) => {
    if (report && report.employee?._id === userInfo._id) {
       setFormData({ date: new Date(report.date).toISOString().split('T')[0], content: report.content });
    } else {
       setFormData({ date: new Date().toISOString().split('T')[0], content: '' });
    }
    setModalOpen(true);
  };

  const handleOpenViewModal = (report) => {
    setCurrentReport(report);
    setViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', formData);
      toast.success('Report submitted successfully');
      setModalOpen(false);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  // Setup Calendar Events
  const calendarEvents = filteredReports.map(report => ({
    id: report._id,
    title: `${report.employee?.name || 'Unknown'} - Report`,
    start: new Date(report.date),
    end: new Date(report.date),
    allDay: true,
    resource: report
  }));

  const handleEventClick = (event) => {
    handleOpenViewModal(event.resource);
  };

  const CustomEvent = ({ event }) => {
    const isMine = event.resource.employee?._id === userInfo._id;
    return (
      <div className={`p-1 text-xs rounded truncate font-medium ${isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {event.title}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <FiFileText className="text-primary-500" /> Organization Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">View daily reports from all employees and admins</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List View"
            >
              <FiList />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded flex items-center justify-center transition-colors ${viewMode === 'calendar' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Calendar View"
            >
              <FiCalendar />
            </button>
          </div>
          <button
            onClick={() => handleOpenSubmitModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
          >
            <FiPlus /> My Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-hidden auto-h">
              <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-event { background-color: transparent !important; padding: 0 !important; }
                .rbc-today { background-color: #f8fafc; }
                .rbc-header { padding: 10px 0; font-weight: 600; color: #475569; }
                .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: #f1f5f9; box-shadow: none; color: #0f172a; }
                .rbc-toolbar button:hover { background-color: #f8fafc; }
                .rbc-toolbar button { color: #64748b; border-color: #e2e8f0; }
              `}</style>
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={handleEventClick}
                  components={{
                    event: CustomEvent
                  }}
                  views={['month', 'week', 'day']}
                />
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Date</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Employee</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Role / Dept</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Preview</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredReports.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500">No reports found.</td></tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                            {new Date(report.date).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-800">{report.employee?.name || 'Unknown'}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded ${report.employee?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {report.employee?.role}
                            </span>
                            {report.employee?.department && (
                              <span className="ml-2 px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded bg-gray-100 text-gray-600">
                                {report.employee.department}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-600">
                            <p className="line-clamp-1 max-w-xs">{report.content}</p>
                          </td>
                          <td className="p-4 flex items-center justify-end gap-2">
                             {report.employee?._id === userInfo._id && (
                               <button onClick={() => handleOpenSubmitModal(report)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" title="Edit My Report">
                                 <FiEdit className="text-lg" />
                               </button>
                             )}
                             <button onClick={() => handleOpenViewModal(report)} className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-md transition-colors" title="View Full">
                               <FiEye className="text-lg" />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit Report Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="My Daily Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">If you already submitted a report for this date, it will be updated.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Content *</label>
            <textarea required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none h-40"
              value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="List your tasks, progress, blockers, etc..." />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Submit Report</button>
          </div>
        </form>
      </Modal>

      {/* View Report Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Report Details">
        {currentReport && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {currentReport.employee?.name || 'Unknown Employee'}
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${currentReport.employee?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {currentReport.employee?.role}
                  </span>
                </h3>
                <p className="text-sm text-gray-500">{currentReport.employee?.department || 'No Department'}</p>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-gray-900">{new Date(currentReport.date).toLocaleDateString()}</span>
                <span className="block text-xs text-gray-400">Date</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative max-h-96 overflow-y-auto custom-scrollbar">
               <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                 {currentReport.content}
               </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
