
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  linkedInventoryId?: string; // ID of the inventory item this maps to
}

export type InvoiceCategory = 'Materia Prima' | 'Insumos' | 'Servicios' | 'Mantenimiento' | 'Impuestos' | 'Otros';

export interface Invoice {
  id: string;
  vendorName: string;
  date: string; // ISO string YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  category?: InvoiceCategory;
  status: 'draft' | 'saved';
  originalImage?: string; // Base64 string for preview
  createdAt: number;
  isSmartMatch?: boolean; // Flag to indicate if vendor template was applied
  matchedOrderId?: string; // ID of the purchase order this invoice fulfills
}

export interface ReferencePrice {
  id: string;
  itemName: string; // Keywords to match
  minPrice: number;
  maxPrice: number;
}

export interface VendorProfile {
  vendorName: string; // Canonical name
  aliases: string[]; // Variations (e.g., "CocaCola", "Coca-Cola Dist.")
  defaultCategory: InvoiceCategory;
  confidenceScore: number; // 0-1, increases with confirmed invoices
  itemMappings: Record<string, string>; // Maps "Invoice Description" -> "Inventory Item ID"
  invoiceCount: number;
  lastSeen: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  minStock: number;
}

export interface PurchaseOrder {
  id: string;
  vendorName: string;
  date: string;
  expectedDate?: string;
  items: InvoiceItem[];
  total: number;
  status: 'pending' | 'received' | 'cancelled';
}

export interface UploadJob {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: Invoice;
  error?: string;
}

export type AppView = 'dashboard' | 'upload' | 'review' | 'prices' | 'inventory' | 'orders';

export type PriceStatus = 'ok' | 'low' | 'high' | 'unknown';
