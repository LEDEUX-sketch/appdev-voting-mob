import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config.json';

// Use the API URL from the separate config.json file
const BASE_URL = config.apiUrl || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Inject auth token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const voterData = await AsyncStorage.getItem('voter_data');
      if (voterData) {
        const { access_token } = JSON.parse(voterData);
        if (access_token) {
          config.headers.Authorization = `Bearer ${access_token}`;
        }
      }
    } catch (e) {
      console.error('Interceptor error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for any future auth needs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      try {
        await AsyncStorage.removeItem('voter_data');
        // We can't use router here easily as it's not a hook, 
        // but the app should naturally react to missing voter_data if it checks it
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
