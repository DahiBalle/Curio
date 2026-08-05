import { createContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
  // Mocking useAuth for now
  return {
    user: {
      name: 'Admin User',
      username: 'admin'
    }
  };
};
