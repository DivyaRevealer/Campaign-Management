import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api', // fallback to /api
  //withCredentials: true, // if you use cookies/sessions
});

export default api;