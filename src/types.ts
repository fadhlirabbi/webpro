export type ViewMode =
  | 'dashboard'
  | 'suppliers'
  | 'barang'
  | 'pembeli'
  | 'transaksi'
  | 'pembayaran'
  | 'help'
  | 'admin';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  imageUrl: string;
  totalProductsProvided: number;
  status: 'Active' | 'Inactive';
}

export interface ItemBarang {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  imageUrl: string;
  description: string;
}

export interface Pembeli {
  id: string;
  name: string;
  type: 'Individual' | 'Corporate' | 'Wholesaler';
  initials: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl: string;
  totalOrders: number;
  totalSpent: number;
  status: 'Active' | 'VIP' | 'Inactive';
  joinDate: string;
}

export type TransactionStatus = 'Lunas' | 'Pending' | 'Batal' | 'Completed' | 'Failed' | 'Processing';

export interface TransactionItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasePrice?: number;
}

export interface Transaction {
  id: string;
  transactionNo: string; // e.g. #TRX-092
  pembeliId: string;
  pembeliName: string;
  pembeliInitials: string;
  pembeliAvatarUrl?: string;
  date: string;
  time: string;
  items: TransactionItem[];
  status: TransactionStatus;
  paymentMethod: 'Bank Transfer' | 'Tunai' | 'E-Wallet' | string;
  totalAmount: number;
  estimatedProfit?: number;
  notes?: string;
}

export type PaymentStatus = 'Berhasil' | 'Gagal' | 'Unpaid' | 'Pending' | 'Success' | 'Rejected';

export interface Payment {
  id: string;
  paymentNo: string;
  transactionNo: string;
  pembeliName: string;
  amount: number;
  method: 'Bank Transfer' | 'Tunai' | 'E-Wallet' | string;
  date: string;
  time: string;
  status: PaymentStatus;
  proofImageUrl?: string;
}

export interface DashboardMetrics {
  totalSuppliers: number;
  supplierGrowth: number;
  totalBarangItems: number;
  barangGrowth: number;
  totalPembeli: number;
  pembeliGrowth: number;
  totalTransaksiAmount: number; // in IDR
  transaksiGrowth: number;
}
