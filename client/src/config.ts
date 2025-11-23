// Helper to convert HTTP to WebSocket protocol
const getWsUrl = (url: string): string => {
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }
  return url.startsWith('ws') ? url : `ws://${url}`;
};

// Use production URLs by default, fallback to localhost for development
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const defaultApiUrl = isProduction ? 'https://alcovia.onrender.com' : 'http://localhost:3000';

const apiUrl = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
const wsUrl = process.env.REACT_APP_WS_URL || process.env.NEXT_PUBLIC_WS_URL || getWsUrl(apiUrl);

export const config = {
  apiUrl,
  wsUrl,
};

