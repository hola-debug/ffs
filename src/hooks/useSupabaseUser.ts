import { useAuth } from '../contexts/AuthContext';

export function useSupabaseUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
