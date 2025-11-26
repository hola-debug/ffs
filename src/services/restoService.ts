import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from './authService';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  restaurant_id: string;
  total: number;
  pdf_path: string | null;
  created_at: string;
}

export const restoService = {
  async createRestaurant(name: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('restaurants')
      .insert([{ owner_id: userId, name } as any])
      .select()
      .single();

    if (error) throw error;
    return data as Restaurant;
  },

  async getRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Restaurant[];
  },

  async addInventoryItem(restaurantId: string, item: Omit<InventoryItem, 'id' | 'created_at' | 'restaurant_id'>) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('inventories')
      .insert([{ ...item, restaurant_id: restaurantId } as any])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async updateInventoryItem(itemId: string, updates: Partial<Omit<InventoryItem, 'id' | 'created_at' | 'restaurant_id'>>) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('inventories')
      .update(updates as any)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async deleteInventoryItem(itemId: string) {
    const { error } = await supabase
      .from('inventories')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async getInventory(restaurantId: string) {
    const { data, error } = await supabase
      .from('inventories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('item_name');

    if (error) throw error;
    return data as InventoryItem[];
  },

  async createInvoice(restaurantId: string, total: number, pdfPath: string) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ restaurant_id: restaurantId, total, pdf_path: pdfPath } as any])
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  async getInvoices(restaurantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('restaurant_id', restaurantId)
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

  async updateInvoice(invoiceId: string, updates: Partial<Omit<Invoice, 'id' | 'created_at' | 'restaurant_id'>>) {
    // @ts-expect-error - Supabase types not matching generated schema
    const { data, error } = await supabase
      .from('invoices')
      .update(updates as any)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  }
};
