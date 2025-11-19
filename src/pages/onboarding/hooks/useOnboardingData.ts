import { useEffect, useMemo, useState } from 'react';
import type { Account, AccountCurrency, Category } from '../../../lib/types';
import { supabase } from '../../../lib/supabaseClient';
import { useAccountsStore } from '../../../hooks/useAccountsStore';
import { useSupabaseUser } from '../../../hooks/useSupabaseUser';
import type {
  AccountFormState,
  CategoryDraftState,
  PendingCategoryItem,
  PendingCategoryState,
  PeriodFormState,
} from '../types';
import type { Category as CategoryRecord } from '../../../lib/types';

const INITIAL_ACCOUNT_FORM: AccountFormState = {
  name: '',
  currency: 'UYU',
  balance: '',
  type: 'other',
};

const INITIAL_CATEGORY_DRAFTS: CategoryDraftState = {
  income: '',
  fixed: '',
  variable: '',
  random: '',
  saving: '',
};

const INITIAL_PERIOD_FORM: PeriodFormState = {
  accountId: '',
  percentage: 3,
  label: 'Alimentación',
  days: 20,
};

const INITIAL_PENDING_CATEGORIES: PendingCategoryState = {
  income: [],
  fixed: [],
  variable: [],
  random: [],
  saving: [],
};

const createEmptyKindMap = <T,>(value: T) =>
  ({
    income: value,
    fixed: value,
    variable: value,
    random: value,
    saving: value,
  }) as Record<CategoryRecord['kind'], T>;

type OnboardingAccount = Account & {
  balance: number;
  currency: string;
};

const FALLBACK_CURRENCY = 'UYU';

const mapAccountForOnboarding = (
  account: Account,
  overrides?: Partial<Pick<OnboardingAccount, 'balance' | 'currency'>>
): OnboardingAccount => {
  const normalizedCurrencies: AccountCurrency[] = account.currencies ?? [];
  const primaryCurrency = normalizedCurrencies.find((entry) => entry.is_primary) ?? normalizedCurrencies[0];

  return {
    ...account,
    currencies: normalizedCurrencies,
    balance: primaryCurrency?.balance ?? overrides?.balance ?? 0,
    currency: primaryCurrency?.currency ?? overrides?.currency ?? FALLBACK_CURRENCY,
  };
};

export function useOnboardingData() {
  const { user } = useSupabaseUser();
  const { accounts: storeAccounts, getTotalBalance, loading: accountsLoading, refreshing: accountsRefreshing } =
    useAccountsStore();
  const normalizedAccounts = useMemo<OnboardingAccount[]>(
    () => storeAccounts.map((account) => mapAccountForOnboarding(account)),
    [storeAccounts]
  );
  const [accounts, setAccounts] = useState<OnboardingAccount[]>(() => normalizedAccounts);
  useEffect(() => {
    setAccounts(normalizedAccounts);
  }, [normalizedAccounts]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(INITIAL_ACCOUNT_FORM);
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraftState>(
    INITIAL_CATEGORY_DRAFTS,
  );
  const [periodForm, setPeriodForm] = useState<PeriodFormState>(INITIAL_PERIOD_FORM);
  const [pendingCategories, setPendingCategories] = useState<PendingCategoryState>(
    INITIAL_PENDING_CATEGORIES,
  );
  const [savingCategories, setSavingCategories] = useState(false);
  const [recentCategoryIds, setRecentCategoryIds] = useState<Record<Category['kind'], string[]>>(
    createEmptyKindMap([]),
  );
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      return;
    }
    setPeriodForm((state) => ({
      ...state,
      accountId: state.accountId || accounts[0].id,
    }));
  }, [accounts, setPeriodForm]);

  useEffect(() => {
    if (!user?.id) {
      setLoadingData(false);
      return;
    }

    let isMounted = true;

    const loadCategories = async () => {
      setLoadingData(true);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (!isMounted) return;

        if (error) {
          setErrorMessage(error.message);
        } else {
          setCategories(data ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message ?? 'No pudimos cargar tus datos.');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadCategories();

    const channel = supabase
      .channel('onboarding-categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => {
          if (isMounted) {
            loadCategories();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalBalance = useMemo(() => getTotalBalance('UYU'), [getTotalBalance]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === periodForm.accountId) ?? accounts[0],
    [accounts, periodForm.accountId],
  );

  const allocatedAmount = useMemo(() => {
    if (!selectedAccount) return 0;
    return Math.round((selectedAccount.balance * periodForm.percentage) / 100);
  }, [selectedAccount, periodForm.percentage]);

  const dailyAmount = useMemo(() => {
    if (!periodForm.days || periodForm.days <= 0) return 0;
    return Math.floor(allocatedAmount / periodForm.days);
  }, [allocatedAmount, periodForm.days]);

  const handleAddAccount = async () => {
    const balanceValue = Number(accountForm.balance);
    if (!user?.id || !accountForm.name.trim() || Number.isNaN(balanceValue)) {
      return;
    }

    setSavingAccount(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: accountForm.name.trim(),
        type: accountForm.type,
        currency: accountForm.currency.toUpperCase(),
        balance: balanceValue,
        is_primary: accounts.length === 0,
      })
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else if (data) {
      const fallbackAccount = mapAccountForOnboarding(
        { ...data, currencies: [] } as Account,
        {
          balance: Number(accountForm.balance) || 0,
          currency: accountForm.currency || FALLBACK_CURRENCY,
        }
      );
      setAccounts((prev) => [...prev, fallbackAccount]);
      setAccountForm((state) => ({
        ...state,
        name: '',
        balance: '',
      }));
      if (!periodForm.accountId) {
        setPeriodForm((state) => ({
          ...state,
          accountId: data.id,
        }));
      }
    }

    setSavingAccount(false);
  };

  const isSavedCategory = (kind: Category['kind'], name: string) =>
    categories.some(
      (category) => category.kind === kind && category.name.toLowerCase() === name.toLowerCase(),
    );

  const togglePresetCategory = (kind: Category['kind'], name: string) => {
    if (isSavedCategory(kind, name)) return;
    setPendingCategories((prev) => {
      const exists = prev[kind].some(
        (item) => item.source === 'preset' && item.name.toLowerCase() === name.toLowerCase(),
      );
      return {
        ...prev,
        [kind]: exists
          ? prev[kind].filter(
              (item) => !(item.source === 'preset' && item.name.toLowerCase() === name.toLowerCase()),
            )
          : [...prev[kind], { name, source: 'preset' }],
      };
    });
  };

  const addCustomCategory = (kind: Category['kind'], value: string) => {
    const draft = value.trim();
    if (!draft || isSavedCategory(kind, draft)) return;
    setPendingCategories((prev) => {
      const exists = prev[kind].some((item) => item.name.toLowerCase() === draft.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        [kind]: [...prev[kind], { name: draft, source: 'custom' }],
      };
    });
    setCategoryDrafts((prev) => ({ ...prev, [kind]: '' }));
  };

  const removePendingCategory = (kind: Category['kind'], value: string) => {
    setPendingCategories((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((item) => item.name.toLowerCase() !== value.toLowerCase()),
    }));
  };

  const persistPendingCategories = async () => {
    if (!user?.id) return true;

    const payload: Array<{ user_id: string; name: string; kind: Category['kind'] }> = [];

    for (const kind of Object.keys(pendingCategories) as Category['kind'][]) {
      const uniqueNames = new Set<string>();
      pendingCategories[kind].forEach((item: PendingCategoryItem) => {
        const normalized = item.name.trim();
        if (!normalized) return;
        if (isSavedCategory(kind, normalized)) return;
        const lower = normalized.toLowerCase();
        if (!uniqueNames.has(lower)) {
          uniqueNames.add(lower);
          payload.push({ user_id: user.id, name: normalized, kind });
        }
      });
    }

    if (payload.length === 0) {
      return true;
    }

    setSavingCategories(true);
    setErrorMessage(null);

    const { data, error } = await supabase.from('categories').insert(payload).select();

    if (error) {
      setErrorMessage(error.message);
      setSavingCategories(false);
      return false;
    }

    if (data) {
      setCategories((prev) => [...prev, ...data]);
      setRecentCategoryIds((prev) => {
        const next = { ...prev };
        (['income', 'fixed', 'variable', 'random', 'saving'] as Category['kind'][]).forEach(
          (kind) => {
            const newIds = data
              .filter((category) => category.kind === kind)
              .map((category) => category.id);
            if (newIds.length === 0) return;
            const existing = prev[kind].filter((id) => !newIds.includes(id));
            next[kind] = [...newIds, ...existing].slice(0, 5);
          },
        );
        return next;
      });
    }

    setPendingCategories(INITIAL_PENDING_CATEGORIES);
    setSavingCategories(false);
    return true;
  };

  const createPeriod = async () => {
    if (!user?.id) {
      setPeriodError('Necesitamos que inicies sesión para crear un periodo.');
      return false;
    }

    const account =
      accounts.find((candidate) => candidate.id === periodForm.accountId) ?? accounts[0];

    if (!account) {
      setPeriodError('Agregá una cuenta antes de crear un periodo.');
      return false;
    }

    if (!periodForm.label.trim()) {
      setPeriodError('Elegí un nombre para tu periodo.');
      return false;
    }

    if (periodForm.days <= 0) {
      setPeriodError('El periodo debe durar al menos 1 día.');
      return false;
    }

    setSavingPeriod(true);
    setPeriodError(null);

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + periodForm.days - 1);

    const { data: newPeriod, error } = await supabase
      .from('periods')
      .insert({
        user_id: user.id,
        account_id: account.id,
        name: periodForm.label.trim(),
        percentage: periodForm.percentage,
        days: periodForm.days,
        allocated_amount: allocatedAmount,
        daily_amount: dailyAmount,
        currency: account.currency,
        starts_at: startsAt.toISOString().slice(0, 10),
        ends_at: endsAt.toISOString().slice(0, 10),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      setPeriodError(error.message);
      setSavingPeriod(false);
      return false;
    }

    const updatedBalance = Number(Math.max(0, account.balance - allocatedAmount).toFixed(2));

    const { error: updateAccountError } = await supabase
      .from('accounts')
      .update({ balance: updatedBalance })
      .eq('id', account.id);

    if (updateAccountError) {
      if (newPeriod?.id) {
        await supabase.from('periods').delete().eq('id', newPeriod.id);
      }
      setPeriodError('No pudimos actualizar el saldo de la cuenta. Reintentá más tarde.');
      setSavingPeriod(false);
      return false;
    }

    setAccounts((prev) =>
      prev.map((candidate) =>
        candidate.id === account.id ? { ...candidate, balance: updatedBalance } : candidate,
      ),
    );

    setSavingPeriod(false);
    return true;
  };

  const isLoadingData = loadingData || accountsLoading || accountsRefreshing;

  return {
    accounts,
    categories,
    loadingData: isLoadingData,
    errorMessage,
    totalBalance,
    accountForm,
    setAccountForm,
    savingAccount,
    addAccount: handleAddAccount,
    categoryDrafts,
    setCategoryDrafts,
    pendingCategories,
    togglePresetCategory,
    addCustomCategory,
    removePendingCategory,
    persistPendingCategories,
    savingCategories,
    savingPeriod,
    periodError,
    recentCategoryIds,
    periodForm,
    setPeriodForm,
    selectedAccount,
    allocatedAmount,
    dailyAmount,
    createPeriod,
  };
}
