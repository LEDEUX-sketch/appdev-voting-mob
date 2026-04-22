import axios from 'axios';

import { Platform } from 'react-native';

// Default to Android Emulator address for local development
// For web, use localhost
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
