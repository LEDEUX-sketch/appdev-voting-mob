import axios from 'axios';

import { Platform } from 'react-native';

// Using localtunnel for mobile data access
const BASE_URL = 'https://young-bobcats-begin.loca.lt'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Required to bypass the localtunnel warning page
  },
});

export default api;
