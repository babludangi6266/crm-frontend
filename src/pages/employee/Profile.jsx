import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { setCredentials } from '../../store/slices/authSlice';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';

const Profile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setContactNumber(userInfo.contactNumber || '');
      setGender(userInfo.gender || 'Male');
    }
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { name, contactNumber, gender };
      if (password) payload.password = password;

      const { data } = await api.put(`/users/${userInfo._id}`, payload);
      dispatch(setCredentials({ ...userInfo, ...data }));
      toast.success('Profile updated successfully');
      setPassword(''); // clear password field
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (name, gen) => {
      const bg = gen === 'Female' ? 'fbcfe8' : gen === 'Male' ? 'bfdbfe' : 'f3f4f6';
      const color = gen === 'Female' ? 'be185d' : gen === 'Male' ? '1e40af' : '374151';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bg}&color=${color}&size=128`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img src={getAvatar(userInfo.name, userInfo.gender)} alt="Avatar" className="h-28 w-28 rounded-full shadow-md border-4 border-white object-cover" />
          <div className="flex-1 text-center md:text-left mt-2">
            <h3 className="text-3xl font-bold text-gray-900">{userInfo.name}</h3>
            <p className="text-primary-600 font-semibold text-lg mt-1">{userInfo.designation || 'Employee'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
               <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">{userInfo.department || 'General'}</span>
               <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">{userInfo.employmentType || 'Full Time'}</span>
               <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100">{userInfo.salaryMode || 'Commission Based'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={submitHandler} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FiUser className="text-gray-400" /> Full Name</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FiMail className="text-gray-400" /> Email Address</label>
              <input type="email" disabled className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-4 py-2.5 cursor-not-allowed"
                value={email} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FiPhone className="text-gray-400" /> Contact Number</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FiUser className="text-gray-400" /> Gender</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
               <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Security Settings</h4>
               <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FiLock className="text-gray-400" /> New Password</label>
               <input type="password" placeholder="Leave blank to keep current" className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:bg-primary-400 flex items-center gap-2">
              {loading ? 'Saving Changes...' : 'Save Profile Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Profile;
