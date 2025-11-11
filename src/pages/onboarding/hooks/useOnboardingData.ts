import { useEffect, useMemo, useState } from 'react';
import type { Account, Category } from '../../../lib/types';
import { supabase } from '../../../lib/supabaseClient';
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

export function useOnboardingData() {
  const { user } = useSupabaseUser();
  const [accounts, setAccounts] = useState<Account[]>([]);
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
    if (!user?.id) return;

    let isMounted = true;

    const loadData = async () => {
      setLoadingData(true);
      setErrorMessage(null);

      const [{ data: accountsData, error: accountsError }, { data: categoriesData, error: categoriesError }] =
        await Promise.all([
          supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at'),
          supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        ]);

      if (!isMounted) {
        return;
      }

      if (accountsError || categoriesError) {
        setErrorMessage(
          accountsError?.message ?? categoriesError?.message ?? 'No pudimos cargar tus datos.',
        );
      } else {
        setAccounts(accountsData ?? []);
        setCategories(categoriesData ?? []);
        setPeriodForm((state) => ({
          ...state,
          accountId: state.accountId || accountsData?.[0]?.id || '',
        }));
      }

      setLoadingData(false);
    };

    loadData();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('onboarding-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'accounts'
        },
        (payload) => {
          console.log('🔄 [Onboarding] Account changed:', payload);
          const record = payload.new as any;
          if (record && record.user_id === user.id) {
            console.log('✅ [Onboarding] Refetching accounts...');
            loadData();
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories'
        },
        (payload) => {
          console.log('🔄 [Onboarding] Category changed:', payload);
          const record = payload.new as any;
          if (record && record.user_id === user.id) {
            console.log('✅ [Onboarding] Refetching categories...');
            loadData();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [Onboarding] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Onboarding] Successfully subscribed to realtime changes');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, item) => sum + item.balance, 0),
    [accounts],
  );

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
      setAccounts((prev) => [...prev, data]);
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

  return {
    accounts,
    categories,
    loadingData,
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
