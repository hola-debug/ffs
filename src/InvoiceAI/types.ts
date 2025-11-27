
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  linkedInventoryId?: string; // ID of the inventory item this maps to
  unitType?: string; // Unit type (kg, liters, units, etc.)
}

export type InvoiceCategory = 'Materials' | 'Supplies' | 'Services' | 'Maintenance' | 'Taxes' | 'Other' | 'Otros';
export type CompanyType = 'restaurant' | 'warehouse' | 'transport' | 'retail' | 'services' | 'other';
export type StockStatus = 'available' | 'low' | 'depleted';

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
  suggestedCompanyType?: CompanyType; // AI-suggested company type
  detectedUnits?: string[]; // AI-detected unit types
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
  stockStatus?: StockStatus;
  unitPrice?: number;
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

export type AppView = 'dashboard' | 'upload' | 'review' | 'inventory' | 'orders';

export type PriceStatus = 'ok' | 'low' | 'high' | 'unknown';

// New types for generic invoice system
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

export interface ItemMatch {
  id: string;
  invoice_item_id: string;
  matched_existing_item_id: string;
  confidence_score: number;
  match_method: 'ai' | 'manual';
  created_at: string;
}
