import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuthFetch() {
  const { authFetch } = useContext(AuthContext);
  return authFetch;
}
