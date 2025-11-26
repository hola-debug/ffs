import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from './authService';

export type CompanyType = 'restaurant' | 'warehouse' | 'transport' | 'retail' | 'services' | 'other';
export type StockStatus = 'available' | 'low' | 'depleted';

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  company_type: CompanyType;
  created_at: string;
}

export interface InvoiceItemDB {
  id: string;
  company_id: string;
  item_name: string;
  current_stock: number;
  stock_consumed: number;
  stock_status: StockStatus;
  unit_type: string;
  unit_price: number;
  last_updated: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  total: number;
  subtotal?: number;
  tax?: number;
  vendor_name?: string;
  invoice_date?: string;
  category?: string;
  status?: 'draft' | 'saved' | 'processed';
  pdf_path: string | null;
  created_at: string;
}

export interface ItemMatch {
  id: string;
  invoice_item_id: string;
  matched_existing_item_id: string;
  confidence_score: number;
  match_method: 'ai' | 'manual';
  created_at: string;
  created_by: string;
}

export const invoiceService = {
  // Company Management
  async createCompany(name: string, type: CompanyType = 'other') {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('companies')
      .insert([{ owner_id: userId, name, company_type: type } as any])
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  },

  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Company[];
  },

  async updateCompany(companyId: string, updates: Partial<Pick<Company, 'name' | 'company_type'>>) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('companies')
      .update(updates as any)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  },

  async deleteCompany(companyId: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) throw error;
  },

  // Invoice Items Management (with Stock Control)
  async addInvoiceItem(
    companyId: string,
    item: {
      item_name: string;
      current_stock: number;
      unit_type: string;
      unit_price: number;
    }
  ) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([{ ...item, company_id: companyId, stock_consumed: 0 } as any])
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceItemDB;
  },

  async getInvoiceItems(companyId: string) {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('company_id', companyId)
      .order('item_name');

    if (error) throw error;
    return data as InvoiceItemDB[];
  },

  async updateItemStock(
    itemId: string,
    amount: number,
    operation: 'add' | 'subtract' = 'add'
  ) {
    // First get current stock
    // @ts-expect-error - Supabase types not matching generated schema
    const { data: currentItem, error: fetchError } = await supabase
      .from('invoice_items')
      .select('current_stock, stock_consumed')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const newStock = operation === 'add' 
      ? currentItem.current_stock + amount 
      : currentItem.current_stock - amount;
    
    const newConsumed = operation === 'subtract'
      ? currentItem.stock_consumed + amount
      : currentItem.stock_consumed;

    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoice_items')
      .update({ 
        current_stock: Math.max(0, newStock),
        stock_consumed: newConsumed,
        last_updated: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceItemDB;
  },

  async getItemStockStatus(itemId: string) {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('current_stock, stock_consumed, stock_status')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateInvoiceItem(
    itemId: string,
    updates: Partial<Omit<InvoiceItemDB, 'id' | 'company_id' | 'created_at'>>
  ) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoice_items')
      .update({ ...updates, last_updated: new Date().toISOString() } as any)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceItemDB;
  },

  async deleteInvoiceItem(itemId: string) {
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  // Invoice Management
  async createInvoice(
    companyId: string,
    invoiceData: {
      total: number;
      subtotal?: number;
      tax?: number;
      vendor_name?: string;
      invoice_date?: string;
      category?: string;
      status?: 'draft' | 'saved' | 'processed';
      pdf_path?: string;
    }
  ) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ company_id: companyId, ...invoiceData } as any])
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  async getInvoices(companyId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  async deleteInvoice(invoiceId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  },

  async updateInvoice(
    invoiceId: string,
    updates: Partial<Omit<Invoice, 'id' | 'company_id' | 'created_at'>>
  ) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoices')
      .update(updates as any)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  // Item Matching Management
  async createItemMatch(
    invoiceItemId: string,
    matchedExistingItemId: string,
    confidenceScore: number,
    matchMethod: 'ai' | 'manual' = 'manual'
  ) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoice_item_matches')
      .insert([{
        invoice_item_id: invoiceItemId,
        matched_existing_item_id: matchedExistingItemId,
        confidence_score: confidenceScore,
        match_method: matchMethod,
        created_by: userId
      } as any])
      .select()
      .single();

    if (error) throw error;
    return data as ItemMatch;
  },

  async getItemMatches(invoiceItemId: string) {
    const { data, error } = await supabase
      .from('invoice_item_matches')
      .select('*')
      .eq('invoice_item_id', invoiceItemId);

    if (error) throw error;
    return data as ItemMatch[];
  }
};
