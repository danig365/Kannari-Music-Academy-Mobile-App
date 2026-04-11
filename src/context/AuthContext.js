/**
 * AuthContext — shared auth state between AppNavigator and login/logout screens.
 * Login screens call setRole('student') etc. to swap the navigator tree.
 * Logout screens call setRole(null) to return to Auth screens.
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext({
  role: null,
  setRole: () => {},
});

export const AuthProvider = AuthContext.Provider;
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
