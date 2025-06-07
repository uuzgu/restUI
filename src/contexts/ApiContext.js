import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { getBaseUrl } from '../controllers/paymentController';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const api = axios.create({
    baseURL: getBaseUrl() + '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 