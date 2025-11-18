import { useAccountsStore } from '@/hooks/useAccountsStore';

export function useAccountsLoader(_isOpen: boolean) {
  const { accounts, loading, refreshing } = useAccountsStore();
  return { accounts, loading: loading || refreshing };
}
