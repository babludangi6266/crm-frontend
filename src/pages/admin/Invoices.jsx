import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiFileText, FiDownload } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';
import Modal from '../../components/Modals/Modal';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState({
    invoiceNumber: '', client: '', project: '', amount: 0, dueDate: '', status: 'unpaid'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, cliRes, projRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients'),
        api.get('/projects')
      ]);
      setInvoices(invRes.data);
      setClients(cliRes.data);
      setProjects(projRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (invoice = null) => {
    if (invoice) {
      setCurrentInvoice({
        ...invoice,
        client: invoice.client?._id || '',
        project: invoice.project?._id || '',
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      const rnd = 'INV-' + Math.floor(1000 + Math.random() * 9000);
      setCurrentInvoice({ invoiceNumber: rnd, client: '', project: '', amount: 0, dueDate: '', status: 'unpaid' });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/invoices/${currentInvoice._id}`, currentInvoice);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', currentInvoice);
        toast.success('Invoice generated');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success('Invoice deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleDownloadPDF = (invoice) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #333;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #14b8a6; padding-bottom: 20px;">
          <div>
            <h1 style="color: #14b8a6; font-size: 28px; margin: 0;">Lexa ERP</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Corporate Headquarters</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 24px; color: #333;">INVOICE</h2>
            <p style="margin: 5px 0; font-weight: bold;">#${invoice.invoiceNumber}</p>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div>
            <h4 style="margin: 0 0 10px 0; color: #666; text-transform: uppercase; font-size: 12px;">Billed To:</h4>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${invoice.client?.company || 'N/A'}</p>
            <p style="margin: 5px 0; color: #555;">${invoice.client?.name || ''}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb; text-align: left;">
              <th style="padding: 12px; border-bottom: 1px solid #eee;">Description (Project)</th>
              <th style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${invoice.project?.name || 'Services Rendered'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${invoice.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #333;">
              <span>Total Due:</span>
              <span style="color: #14b8a6;">$${invoice.amount.toLocaleString()}</span>
            </div>
            <p style="text-align: right; font-size: 12px; color: #888; margin-top: 5px; text-transform: uppercase; font-weight: bold;">Status: ${invoice.status}</p>
          </div>
        </div>
        
        <div style="margin-top: 80px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          Thank you for doing business with us!
        </div>
      </div>
    `;

    const opt = {
      margin:       0,
      filename:     `Invoice_${invoice.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const getStatusBadge = (status) => {
    return status === 'paid'
      ? <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-green-100 text-green-800 border border-green-200 rounded-full">PAID</span>
      : <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-red-100 text-red-800 border border-red-200 rounded-full">UNPAID</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Invoices & Billing</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <FiPlus /> Generate Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Invoice #</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Client & Project</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Amount ($)</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Due Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading invoices...</td></tr>
                : invoices.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-gray-500">No invoices generated.</td></tr> : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2 mt-1">
                          <FiFileText className="text-primary-500 text-lg" /> {inv.invoiceNumber}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{inv.client?.company}</div>
                        <div className="text-gray-500 text-xs mt-0.5">Project: {inv.project?.name}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">${inv.amount?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`font-medium ${new Date(inv.dueDate) < new Date() && inv.status === 'unpaid' ? 'text-red-600' : 'text-gray-700'}`}>
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(inv.status)}</td>
                      <td className="p-4 flex gap-2 justify-end items-center h-full">
                        <button onClick={() => handleDownloadPDF(inv)} className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md transition-colors" title="Download PDF"><FiDownload className="text-lg" /></button>
                        <button onClick={() => handleOpenModal(inv)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"><FiEdit className="text-lg" /></button>
                        <button onClick={() => handleDelete(inv._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="text-lg" /></button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Invoice' : 'Generate Invoice'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.invoiceNumber} onChange={e => setCurrentInvoice({ ...currentInvoice, invoiceNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.amount} onChange={e => setCurrentInvoice({ ...currentInvoice, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.client} onChange={e => setCurrentInvoice({ ...currentInvoice, client: e.target.value })}>
              <option value="">Select Client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.company} ({c.name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.project} onChange={e => setCurrentInvoice({ ...currentInvoice, project: e.target.value })}>
              <option value="">Select Project</option>
              {projects.filter(p => p.client?._id === currentInvoice.client || !currentInvoice.client).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.dueDate} onChange={e => setCurrentInvoice({ ...currentInvoice, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentInvoice.status} onChange={e => setCurrentInvoice({ ...currentInvoice, status: e.target.value })}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Generate Invoice'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Invoices;
