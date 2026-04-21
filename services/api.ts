import axios from 'axios';

// Default to Android Emulator address for local development
// Change to your machine's IP address if using a physical device
const BASE_URL = 'http://10.0.2.2:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
