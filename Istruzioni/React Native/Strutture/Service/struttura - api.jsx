import axios from 'axios';
import { API_BASE_URL } from '../utils/common';

//CONFIGURAZIONE
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'react-native',
  },
  timeout: 60000
});

//INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token scaduto o utente non autorizzato");
      // Qui potresti inserire una logica di logout forzato
    }
    return Promise.reject(error);
  }
);