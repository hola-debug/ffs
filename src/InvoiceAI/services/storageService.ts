
import { Invoice, ReferencePrice, VendorProfile, InventoryItem, PurchaseOrder } from "../types";


const INVOICE_KEY = 'app_invoices';
const PRICE_KEY = 'app_prices';
const VENDOR_KEY = 'app_vendor_profiles';
const INVENTORY_KEY = 'app_inventory';
const ORDERS_KEY = 'app_orders';

// --- MOCK DATA FOR INITIALIZATION ---
const INITIAL_PRICES: ReferencePrice[] = [
  { id: '1', itemName: 'monitor', minPrice: 100, maxPrice: 500 },
  { id: '2', itemName: 'teclado', minPrice: 20, maxPrice: 150 },
  { id: '3', itemName: 'café', minPrice: 2, maxPrice: 15 },
  { id: '4', itemName: 'silla', minPrice: 50, maxPrice: 300 },
  { id: '5', itemName: 'hosting', minPrice: 5, maxPrice: 50 },
];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Carne Molida', quantity: 50, unit: 'kg', category: 'Materia Prima', minStock: 20 },
    { id: '2', name: 'Papas', quantity: 100, unit: 'kg', category: 'Materia Prima', minStock: 30 },
    { id: '3', name: 'Aceite', quantity: 20, unit: 'lt', category: 'Insumos', minStock: 10 },
    { id: '4', name: 'Servilletas', quantity: 500, unit: 'un', category: 'Insumos', minStock: 100 },
];

const INITIAL_ORDERS: PurchaseOrder[] = [
    { 
        id: '101', 
        vendorName: 'Distribuidora Carnes', 
        date: new Date().toISOString().split('T')[0], 
        items: [{ description: 'Carne Molida', quantity: 20, unitPrice: 5, total: 100 }], 
        total: 100,
        status: 'pending'
    }
];

// --- INVOICES ---

export const getInvoices = (): Invoice[] => {
  const data = localStorage.getItem(INVOICE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInvoice = (invoice: Invoice): void => {
  const invoices = getInvoices();
  const existingIndex = invoices.findIndex(i => i.id === invoice.id);
  
  // 1. Learn from this invoice (Updates Vendor Profile with mappings)
  learnVendorPatterns(invoice);

  // 2. Save Invoice
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
  
  // 3. Automations (Explicit Linking)
  processInventoryUpdates(invoice);
  processOrderClosing(invoice);
};

export const deleteInvoice = (id: string): void => {
  const invoices = getInvoices().filter(i => i.id !== id);
  localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
};

// --- REFERENCE PRICES ---

export const getReferencePrices = (): ReferencePrice[] => {
  const data = localStorage.getItem(PRICE_KEY);
  if (!data) {
    localStorage.setItem(PRICE_KEY, JSON.stringify(INITIAL_PRICES));
    return INITIAL_PRICES;
  }
  return JSON.parse(data);
};

export const saveReferencePrice = (price: ReferencePrice): void => {
  const prices = getReferencePrices();
  const existingIndex = prices.findIndex(p => p.id === price.id);
  
  if (existingIndex >= 0) {
    prices[existingIndex] = price;
  } else {
    prices.push(price);
  }
  
  localStorage.setItem(PRICE_KEY, JSON.stringify(prices));
};

export const deleteReferencePrice = (id: string): void => {
    const prices = getReferencePrices().filter(p => p.id !== id);
    localStorage.setItem(PRICE_KEY, JSON.stringify(prices));
};

// --- VENDOR PROFILES & INTELLIGENCE ---

export const getVendorProfiles = (): VendorProfile[] => {
  const data = localStorage.getItem(VENDOR_KEY);
  return data ? JSON.parse(data) : [];
};

export const applyVendorIntelligence = (draft: Invoice): Invoice => {
    const profiles = getVendorProfiles();
    const rawName = draft.vendorName.toLowerCase().trim();

    // 1. Find Profile
    const profile = profiles.find(p => 
        p.vendorName.toLowerCase() === rawName || 
        p.aliases.some(alias => alias.toLowerCase() === rawName) ||
        rawName.includes(p.vendorName.toLowerCase())
    );

    if (profile) {
        // Apply Learned Category
        if (profile.defaultCategory) {
            draft.category = profile.defaultCategory;
        }
        // Normalize Name
        draft.vendorName = profile.vendorName;
        draft.isSmartMatch = true;

        // Apply Learned Item Mappings (Auto-link Inventory)
        if (profile.itemMappings) {
            draft.items.forEach(item => {
                const mapKey = item.description.trim().toLowerCase();
                if (profile.itemMappings[mapKey]) {
                    item.linkedInventoryId = profile.itemMappings[mapKey];
                }
            });
        }
    }

    return draft;
};

export const learnVendorPatterns = (finalInvoice: Invoice): void => {
    if (!finalInvoice.vendorName) return;

    const profiles = getVendorProfiles();
    const name = finalInvoice.vendorName.trim();
    
    let profileIndex = profiles.findIndex(p => p.vendorName.toLowerCase() === name.toLowerCase());
    
    // New mappings from this invoice
    const newMappings: Record<string, string> = {};
    finalInvoice.items.forEach(item => {
        if (item.linkedInventoryId) {
            newMappings[item.description.trim().toLowerCase()] = item.linkedInventoryId;
        }
    });

    if (profileIndex >= 0) {
        // Update Existing
        const p = profiles[profileIndex];
        if (finalInvoice.category) p.defaultCategory = finalInvoice.category;
        
        p.invoiceCount = (p.invoiceCount || 0) + 1;
        p.lastSeen = Date.now();
        p.confidenceScore = Math.min((p.confidenceScore || 0.5) + 0.1, 1.0);
        
        // Merge mappings
        p.itemMappings = { ...(p.itemMappings || {}), ...newMappings };
        
        profiles[profileIndex] = p;

    } else {
        // Create New
        const newProfile: VendorProfile = {
            vendorName: name,
            aliases: [name],
            defaultCategory: finalInvoice.category || 'Otros',
            confidenceScore: 0.5,
            itemMappings: newMappings,
            invoiceCount: 1,
            lastSeen: Date.now()
        };
        profiles.push(newProfile);
    }
    
    localStorage.setItem(VENDOR_KEY, JSON.stringify(profiles));
};

// --- INVENTORY ---

export const getInventory = (): InventoryItem[] => {
    const data = localStorage.getItem(INVENTORY_KEY);
    if (!data) {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(INITIAL_INVENTORY));
        return INITIAL_INVENTORY;
    }
    return JSON.parse(data);
};

export const saveInventoryItem = (item: InventoryItem): void => {
    const inventory = getInventory();
    const existingIndex = inventory.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) inventory[existingIndex] = item;
    else inventory.push(item);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
};

// Process explicit inventory updates based on linked IDs
const processInventoryUpdates = (invoice: Invoice) => {
    const inventory = getInventory();
    let updated = false;

    invoice.items.forEach(invItem => {
        if (invItem.linkedInventoryId) {
            // Case A: User linked it to an existing item
            const idx = inventory.findIndex(i => i.id === invItem.linkedInventoryId);
            if (idx >= 0) {
                inventory[idx].quantity += invItem.quantity;
                updated = true;
            }
        } else {
            // Case B: No link provided. 
            // Optional: We could try to auto-create here, but for now we skip unlinked items
            // to avoid polluting inventory with bad OCR data.
            // Or we could fallback to string matching (legacy behavior):
            const matchIndex = inventory.findIndex(stockItem => 
                invItem.description.toLowerCase() === stockItem.name.toLowerCase()
            );
            if (matchIndex >= 0) {
                inventory[matchIndex].quantity += invItem.quantity;
                updated = true;
            }
        }
    });

    if (updated) {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
};

// --- PURCHASE ORDERS ---

export const getPurchaseOrders = (): PurchaseOrder[] => {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
    }
    return JSON.parse(data);
};

export const savePurchaseOrder = (order: PurchaseOrder): void => {
    const orders = getPurchaseOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = order;
    else orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const deletePurchaseOrder = (id: string): void => {
    const orders = getPurchaseOrders().filter(o => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

const processOrderClosing = (invoice: Invoice) => {
    const orders = getPurchaseOrders();
    let updated = false;
    
    // Explicit match via ID
    if (invoice.matchedOrderId) {
        const orderIdx = orders.findIndex(o => o.id === invoice.matchedOrderId);
        if (orderIdx >= 0) {
            orders[orderIdx].status = 'received';
            // Optional: Check if received quantity matches ordered quantity
            updated = true;
        }
    } else {
        // Fallback: Legacy logic (close by vendor name if only 1 pending)
        // This is less safe, so we prefer the explicit match.
    }

    if (updated) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
};
