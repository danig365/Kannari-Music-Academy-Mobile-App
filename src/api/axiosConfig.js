/**
 * Axios Configuration for Kannari Music Academy
 * Copied from frontend/src/config.js — localStorage → AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE } from './endpoints';

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Request interceptor — attach token from AsyncStorage
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handle 401 (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored auth data on unauthorized
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
