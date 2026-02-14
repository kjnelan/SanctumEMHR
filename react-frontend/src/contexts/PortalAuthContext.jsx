import { createContext, useContext } from 'react';

const PortalAuthContext = createContext(null);

export function usePortalAuthContext() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error('usePortalAuthContext must be used within PortalAuthProvider');
  }
  return context;
}

export default PortalAuthContext;
