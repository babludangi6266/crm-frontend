import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiFilter } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const DEPARTMENTS = ['Sales', 'Management', 'Development', 'Operations', 'Marketing'];
  const EMP_TYPES = ['Part Time', 'Full Time', 'Intern', 'Freelancer'];
  const SALARY_MODES = ['Commission Based', 'Project Based'];
  const GENDERS = ['Male', 'Female', 'Other'];

  const [currentEmp, setCurrentEmp] = useState({
    name: '', email: '', password: '', role: 'employee',
    department: 'Sales', designation: '', salaryMode: 'Commission Based',
    employmentType: 'Full Time', gender: 'Male', contactNumber: ''
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setEmployees(data.filter(u => u.role === 'employee'));
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    if (filterDept !== 'All' && emp.department !== filterDept) return false;
    if (filterType !== 'All' && emp.employmentType !== filterType) return false;
    return true;
  });

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setCurrentEmp({ ...emp, password: '' });
      setEditMode(true);
    } else {
      setCurrentEmp({ 
        name: '', email: '', password: '', role: 'employee', 
        department: 'Sales', designation: '', salaryMode: 'Commission Based',
        employmentType: 'Full Time', gender: 'Male', contactNumber: '' 
      });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        const payload = { ...currentEmp };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${currentEmp._id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/auth/register', currentEmp);
        toast.success('Employee created successfully');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const getAvatar = (name, gen) => {
      const bg = gen === 'Female' ? 'fbcfe8' : gen === 'Male' ? 'bfdbfe' : 'f3f4f6';
      const color = gen === 'Female' ? 'be185d' : gen === 'Male' ? '1e40af' : '374151';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Employees Management</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <FiPlus /> Add Employee
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
         <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mr-2"><FiFilter /> Filters:</div>
         <div>
           <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Department</label>
           <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
             <option value="All">All Departments</option>
             {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
         </div>
         <div>
           <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Employee Type</label>
           <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
             <option value="All">All Types</option>
             {EMP_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
         </div>
         { (filterDept !== 'All' || filterType !== 'All') && (
           <button onClick={() => { setFilterDept('All'); setFilterType('All'); }} className="text-xs text-primary-600 font-medium hover:underline p-1">Clear</button>
         )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Contact</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Dept & Role</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Employment</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                : filteredEmployees.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">No employees match filters.</td></tr> : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={getAvatar(emp.name, emp.gender)} alt={emp.name} className="h-10 w-10 rounded-full shadow-sm border border-gray-200" />
                          <div>
                            <div className="font-semibold text-gray-900">{emp.name}</div>
                            <div className="text-gray-500 text-[10px] font-medium mt-0.5">Joined: {new Date(emp.joiningDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-800 font-medium">{emp.email}</div>
                        <div className="text-gray-500 text-xs">{emp.contactNumber || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">{emp.department || 'General'}</span>
                        <div className="text-xs text-gray-500 mt-1 font-medium">{emp.designation || 'Staff'}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">{emp.employmentType || 'Full Time'}</span>
                        <div className="text-[10px] text-gray-500 mt-1.5 uppercase font-semibold">{emp.salaryMode || 'Commission Based'}</div>
                      </td>
                      <td className="p-4 flex gap-2 justify-end items-center h-full">
                        <button onClick={() => handleOpenModal(emp)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"><FiEdit className="text-lg" /></button>
                        <button onClick={() => handleDelete(emp._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="text-lg" /></button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.name} onChange={e => setCurrentEmp({ ...currentEmp, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.email} onChange={e => setCurrentEmp({ ...currentEmp, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.designation} onChange={e => setCurrentEmp({ ...currentEmp, designation: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.contactNumber} onChange={e => setCurrentEmp({ ...currentEmp, contactNumber: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.gender} onChange={e => setCurrentEmp({ ...currentEmp, gender: e.target.value })}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.department} onChange={e => setCurrentEmp({ ...currentEmp, department: e.target.value })}>
                 {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emp Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.employmentType} onChange={e => setCurrentEmp({ ...currentEmp, employmentType: e.target.value })}>
                 {EMP_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Mode</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.salaryMode} onChange={e => setCurrentEmp({ ...currentEmp, salaryMode: e.target.value })}>
                 {SALARY_MODES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{editMode ? 'Reset Password (blank: keep)' : 'Password *'}</label>
              <input type="password" required={!editMode} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={currentEmp.password} onChange={e => setCurrentEmp({ ...currentEmp, password: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">{editMode ? 'Save Changes' : 'Add Employee'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Employees;
