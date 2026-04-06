import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBriefcase } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      if (userInfo.role === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    }
  }, [userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setCredentials(data));
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eaf6] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Decorative Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Claymorphism Main Card */}
      <div className="max-w-md w-full space-y-8 bg-[#f3f4f8] p-10 rounded-[2.5rem] relative z-10 
        shadow-[15px_15px_30px_#c3c6ce,_-15px_-15px_30px_#ffffff,inset_5px_5px_10px_#ffffff,inset_-5px_-5px_10px_#c3c6ce] 
        border border-white/40">

        <div className="flex flex-col items-center">
          {/* Claymorphism Icon Container */}
          <div className="bg-primary-500 rounded-2xl p-4 mb-4 flex items-center justify-center
            shadow-[6px_6px_12px_#c3c6ce,_-6px_-6px_12px_#ffffff,inset_3px_3px_6px_rgba(255,255,255,0.4),inset_-3px_-3px_6px_rgba(0,0,0,0.1)]">
            <FiBriefcase className="text-white text-3xl drop-shadow-md" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-800 tracking-tight">
            Sign in to Lexa<span className="text-primary-500">CRM</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-medium">
            Welcome back! Please enter your details.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={submitHandler}>
          <div className="flex flex-col gap-5">
            <div>
              <label className="sr-only">Email address</label>
              {/* Claymorphism Input (Pressed-in effect) */}
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none block w-full px-5 py-4 bg-[#f3f4f8] rounded-2xl text-gray-700 placeholder-gray-400 
                border-transparent focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all
                shadow-[inset_6px_6px_12px_#c3c6ce,inset_-6px_-6px_12px_#ffffff]"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              {/* Claymorphism Input (Pressed-in effect) */}
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-5 py-4 bg-[#f3f4f8] rounded-2xl text-gray-700 placeholder-gray-400 
                border-transparent focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all
                shadow-[inset_6px_6px_12px_#c3c6ce,inset_-6px_-6px_12px_#ffffff]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            {/* Claymorphism Button (Popped-out 3D effect) */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 text-sm font-bold rounded-2xl text-white bg-primary-500 
              hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all 
              shadow-[8px_8px_16px_#c3c6ce,_-8px_-8px_16px_#ffffff,inset_3px_3px_6px_rgba(255,255,255,0.4),inset_-3px_-3px_6px_rgba(0,0,0,0.1)]
              active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.2)] 
              disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;