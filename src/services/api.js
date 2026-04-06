import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  //baseURL: 'https://crm-backend-k2us.onrender.com/api',

});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
