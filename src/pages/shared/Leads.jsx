import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiTarget, FiMessageCircle, FiMic, FiDownload } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';
import { useSelector } from 'react-redux';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [listening, setListening] = useState(false);
  
  const { userInfo } = useSelector(state => state.auth);

  const [currentLead, setCurrentLead] = useState({
    name: '', company: '', email: '', mobileNo: '', description: '', status: 'New', location: '', issueDate: ''
  });
  
  const [followUpData, setFollowUpData] = useState({ date: '', description: '' });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/leads');
      setLeads(data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setCurrentLead({
        ...lead,
        issueDate: lead.issueDate ? lead.issueDate.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      setCurrentLead({ name: '', company: '', email: '', mobileNo: '', description: '', status: 'New', location: '', issueDate: new Date().toISOString().split('T')[0] });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleOpenFollowUp = (lead) => {
    setCurrentLead(lead);
    setFollowUpData({ date: new Date().toISOString().split('T')[0], description: '' });
    setFollowUpModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/leads/${currentLead._id}`, currentLead);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', currentLead);
        toast.success('Lead added successfully');
      }
      setModalOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const submitFollowUp = async (e) => {
    e.preventDefault();
    try {
      if (!followUpData.date || !followUpData.description) {
        return toast.error('Date and description required');
      }
      await api.post(`/leads/${currentLead._id}/followup`, followUpData);
      toast.success('Follow-up logged successfully');
      setFollowUpModalOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add follow up');
    }
  };

  const handleDictate = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error('Voice dictation not supported in this browser.');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFollowUpData(prev => ({ ...prev, description: prev.description + (prev.description ? ' ' : '') + transcript }));
    };
    recognition.onerror = (e) => toast.error('Microphone error: ' + e.error);
    recognition.start();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        toast.success('Lead deleted successfully');
        fetchLeads();
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-purple-100 text-purple-800',
      'Lost': 'bg-red-100 text-red-800',
      'Converted': 'bg-green-100 text-green-800'
    };
    return <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const getEngagementScore = (lead) => {
    let score = 0;
    if (lead.email) score += 20;
    if (lead.mobileNo) score += 20;
    if (lead.description && lead.description.trim().length > 5) score += 10;
    score += Math.min(lead.followUps.length * 25, 50); // Up to 50 pts for followups
    return score; // Max 100
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">🔥 Hot ({score}%)</div>;
    if (score >= 50) return <div className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded flex items-center gap-1">⚡ Warm ({score}%)</div>;
    return <div className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">❄️ Cold ({score}%)</div>;
  };

  const getAtRiskStatus = (lead) => {
    if (lead.status === 'Converted' || lead.status === 'Lost') return false;
    
    let lastContactDate = lead.issueDate ? new Date(lead.issueDate) : null;
    if (lead.followUps && lead.followUps.length > 0) {
       const latestFollowUp = new Date(Math.max(...lead.followUps.map(f => new Date(f.date))));
       lastContactDate = latestFollowUp > lastContactDate ? latestFollowUp : lastContactDate;
    }
    
    if (!lastContactDate) return false;
    
    const diffTime = Math.abs(new Date() - lastContactDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 14;
  };

  const exportCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Mobile Number', 'Location', 'Status', 'Engagement Score', 'Issue Date'];
    const rows = leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.mobileNo || '').replace(/"/g, '""')}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      l.status,
      getEngagementScore(l),
      l.issueDate ? new Date(l.issueDate).toLocaleDateString() : 'N/A'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lexa_Leads_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <FiTarget className="text-primary-500" /> Lead Management
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
          >
            <FiDownload /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
          >
            <FiPlus /> New Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Lead Intel</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Contact</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status & Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Score & Follow-ups</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No leads found. Click "New Lead" to get started.</td></tr>
              ) : (
                leads.sort((a,b) => getEngagementScore(b) - getEngagementScore(a)).map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{lead.name}</div>
                      <div className="text-gray-600 font-medium text-xs">{lead.company}</div>
                      <div className="text-gray-400 text-xs mt-1 truncate max-w-xs">{lead.description}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-600 font-medium">{lead.email || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">{lead.mobileNo || 'N/A'}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5">{lead.location}</div>
                    </td>
                    <td className="p-4">
                       {getAtRiskStatus(lead) ? (
                         <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md border bg-red-100 text-red-800 border-red-300 shadow-sm flex items-center gap-1 w-max">
                           🚨 AT RISK
                         </span>
                       ) : (
                         getStatusBadge(lead.status)
                       )}
                       <div className="text-xs text-gray-500 font-medium mt-2">Issued: {new Date(lead.issueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                       <div className="mb-2 flex justify-between items-center">
                         {getScoreBadge(getEngagementScore(lead))}
                         <button onClick={() => handleOpenFollowUp(lead)} className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 hover:bg-primary-100 px-2 py-1 rounded transition-colors border border-primary-200">
                           + Log
                         </button>
                       </div>
                       <div className="space-y-1 mt-1 max-h-20 overflow-y-auto custom-scrollbar">
                         {lead.followUps.length === 0 ? <p className="text-[10px] text-gray-400 italic">No logs</p> : 
                           lead.followUps.slice().reverse().map((f, i) => (
                              <div key={i} className="text-[10px] bg-gray-50 p-1.5 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700">{new Date(f.date).toLocaleDateString()}</span> - 
                                <span className="text-gray-500 truncate inline-block max-w-[100px] ml-1 align-bottom">{f.description}</span>
                                <div className="text-gray-400 mt-0.5" style={{ fontSize: '8px' }}>By: {f.addedBy?.name}</div>
                              </div>
                           ))
                         }
                       </div>
                    </td>
                    <td className="p-4 flex gap-2 justify-end items-center h-full">
                      <button onClick={() => handleOpenModal(lead)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                        <FiEdit className="text-lg" />
                      </button>
                      {userInfo?.role === 'admin' && (
                        <button onClick={() => handleDelete(lead._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete">
                          <FiTrash2 className="text-lg" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Lead' : 'Add New Lead'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Name *</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.name} onChange={e => setCurrentLead({ ...currentLead, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.company} onChange={e => setCurrentLead({ ...currentLead, company: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.email} onChange={e => setCurrentLead({ ...currentLead, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.mobileNo} onChange={e => setCurrentLead({ ...currentLead, mobileNo: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none h-20"
              value={currentLead.description} onChange={e => setCurrentLead({ ...currentLead, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" value={currentLead.status} onChange={e => setCurrentLead({ ...currentLead, status: e.target.value })}>
                 <option value="New">New</option>
                 <option value="Contacted">Contacted</option>
                 <option value="Qualified">Qualified</option>
                 <option value="Lost">Lost</option>
                 <option value="Converted">Converted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.location} onChange={e => setCurrentLead({ ...currentLead, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={currentLead.issueDate} onChange={e => setCurrentLead({ ...currentLead, issueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Create Lead'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={followUpModalOpen} onClose={() => setFollowUpModalOpen(false)} title={`Log Follow-up: ${currentLead.name}`}>
         <form onSubmit={submitFollowUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up Date *</label>
              <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={followUpData.date} onChange={e => setFollowUpData({ ...followUpData, date: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Discussion / Notes *</label>
                <button 
                  type="button" 
                  onClick={handleDictate}
                  className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded transition-colors ${listening ? 'text-red-600 bg-red-50 animate-pulse' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                >
                  <FiMic /> {listening ? 'Listening...' : 'Dictate'}
                </button>
              </div>
              <textarea required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none h-24"
                value={followUpData.description} onChange={e => setFollowUpData({ ...followUpData, description: e.target.value })} placeholder="What was discussed?" />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button type="button" onClick={() => setFollowUpModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm cursor-pointer">Save Follow-up</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
export default Leads;
