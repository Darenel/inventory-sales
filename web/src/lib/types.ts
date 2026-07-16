export type SortDir = 'asc' | 'desc';

export type ListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  price: string;
  cost: string;
  stock: number;
  minStock: number;
  categoryId: string;
  supplierId: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleSummary = {
  id: string;
  sellerId: string;
  clientId: string | null;
  total: string;
  createdAt: string;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: string;
};

export type Sale = SaleSummary & {
  items: SaleItem[];
};

export type StockMovementType = 'purchase' | 'sale' | 'adjustment';

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  qty: number;
  reason: string | null;
  userId: string;
  createdAt: string;
};

export type StockAlertsResponse = {
  data: Product[];
  total: number;
};
