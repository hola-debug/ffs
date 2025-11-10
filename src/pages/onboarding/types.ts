import type { Account, Category } from '../../lib/types';

export type StepId = 'welcome' | 'accounts' | 'categories' | 'period';

export interface StepConfig {
  id: StepId;
  label: string;
  actionLabel?: string;
}

export interface CategorySection {
  title: string;
  description: string;
  kind: Category['kind'];
}

export interface AccountFormState {
  name: string;
  currency: string;
  balance: string;
  type: Account['type'];
}

export type CategoryDraftState = Record<Category['kind'], string>;

export interface PendingCategoryItem {
  name: string;
  source: 'preset' | 'custom';
}

export type PendingCategoryState = Record<Category['kind'], PendingCategoryItem[]>;

export interface PeriodFormState {
  accountId: string;
  percentage: number;
  label: string;
  days: number;
}
