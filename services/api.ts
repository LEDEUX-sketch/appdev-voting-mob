import axios from 'axios';

import { Platform } from 'react-native';

// Localtunnel URL for cross-network access (works from any device/network)
// For web, use localhost
const TUNNEL_URL = 'https://cute-carrots-slide.loca.lt';
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:8000' : TUNNEL_URL; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
});

export default api;
