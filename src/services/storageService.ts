import { supabase } from '../lib/supabaseClient';

export const storageService = {
  async uploadInvoice(userId: string, invoiceId: string, file: File) {
    const path = `${userId}/invoices/${invoiceId}.pdf`;
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  },

  getInvoiceUrl(path: string) {
    const { data } = supabase.storage
      .from('invoices')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
};
