import { useDispatch, useSelector } from 'react-redux';
import { FiMenu, FiBell, FiUser } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white drop-shadow-sm justify-between px-4 py-4 md:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(true);
          }}
          className="z-50 block rounded-sm border border-gray-200 bg-white p-1.5 shadow-sm lg:hidden"
        >
          <FiMenu className="text-2xl text-gray-500" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-gray-800">
            Welcome, {userInfo?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors bg-gray-100 rounded-full">
          <FiBell className="text-xl" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <div className="relative flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <span className="block text-sm font-medium text-black">
              {userInfo?.name}
            </span>
            <span className="block text-xs font-semibold text-primary-600 uppercase">
              {userInfo?.role}
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200 cursor-pointer overflow-hidden shadow-sm">
             {userInfo?.avatar ? (
                <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
             ) : (
                <FiUser className="text-xl" />
             )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-600 hover:text-red-800 ml-2 transition-colors border border-red-200 bg-red-50 px-3 py-1.5 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
