import { readAuthSession } from '../auth/storage';
import {
  Category,
  Client,
  ListResponse,
  Product,
  Sale,
  SaleItem,
  SortDir,
  StockAlertsResponse,
  StockMovement,
  StockMovementType,
  Supplier,
} from '../lib/types';
import { createDemoState } from './data';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type CollectionName = 'categories' | 'clients' | 'suppliers' | 'products';
type Entity = Category | Client | Supplier | Product;
type Body = Record<string, unknown>;

export class DemoRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DemoRequestError';
    this.status = status;
  }
}

const state = createDemoState();
const currency = (value: number) => value.toFixed(2);
const stamp = () => new Date().toISOString();

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function requireBody(options: RequestOptions): Body {
  return (options.body ?? {}) as Body;
}

function searchText(value: Record<string, unknown>) {
  return Object.values(value)
    .filter((part) => typeof part === 'string' || typeof part === 'number')
    .join(' ')
    .toLowerCase();
}

function compareValues<T extends Record<string, unknown>>(left: T, right: T, sortBy: string, sortDir: SortDir) {
  const leftValue = left[sortBy];
  const rightValue = right[sortBy];
  const leftNumber = Number(leftValue);
  const rightNumber = Number(rightValue);
  const compareAsNumber = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  const leftComparable = compareAsNumber ? leftNumber : String(leftValue ?? '').toLowerCase();
  const rightComparable = compareAsNumber ? rightNumber : String(rightValue ?? '').toLowerCase();

  if (leftComparable < rightComparable) {
    return sortDir === 'asc' ? -1 : 1;
  }
  if (leftComparable > rightComparable) {
    return sortDir === 'asc' ? 1 : -1;
  }
  return 0;
}

function list<T extends Record<string, unknown>>(items: T[], url: URL, defaultSortBy = 'name'): ListResponse<T> {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const search = url.searchParams.get('search')?.trim().toLowerCase();
  const sortBy = url.searchParams.get('sortBy') ?? defaultSortBy;
  const sortDir = (url.searchParams.get('sortDir') ?? 'asc') as SortDir;

  const filtered = search ? items.filter((item) => searchText(item).includes(search)) : items;
  const sorted = [...filtered].sort((left, right) => compareValues(left, right, sortBy, sortDir));
  const start = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  return {
    data: sorted.slice(start, start + limit),
    total: sorted.length,
    page,
    limit,
  };
}

function collection(name: CollectionName) {
  return state[name] as Entity[];
}

function validateName(body: Body) {
  const name = String(body.name ?? '').trim();
  if (!name) {
    throw new DemoRequestError(400, 'Name is required.');
  }
  return name;
}

function optionalString(value: unknown) {
  const stringValue = typeof value === 'string' ? value.trim() : '';
  return stringValue || null;
}

function createEntity(name: CollectionName, body: Body) {
  const createdAt = stamp();

  if (name === 'categories') {
    const entity: Category = { id: id('cat'), name: validateName(body), createdAt, updatedAt: createdAt };
    state.categories.unshift(entity);
    return entity;
  }

  if (name === 'clients') {
    const entity: Client = {
      id: id('cli'),
      name: validateName(body),
      email: optionalString(body.email),
      phone: optionalString(body.phone),
      address: optionalString(body.address),
      createdAt,
      updatedAt: createdAt,
    };
    state.clients.unshift(entity);
    return entity;
  }

  if (name === 'suppliers') {
    const entity: Supplier = {
      id: id('sup'),
      name: validateName(body),
      email: optionalString(body.email),
      phone: optionalString(body.phone),
      address: optionalString(body.address),
      createdAt,
      updatedAt: createdAt,
    };
    state.suppliers.unshift(entity);
    return entity;
  }

  return createProduct(body);
}

function updateEntity(name: CollectionName, entityId: string, body: Body) {
  const items = collection(name);
  const index = items.findIndex((item) => item.id === entityId);

  if (index < 0) {
    throw new DemoRequestError(404, 'Record not found.');
  }

  const updatedAt = stamp();
  const current = items[index];

  if (name === 'categories') {
    const updated: Category = { ...(current as Category), name: validateName(body), updatedAt };
    state.categories[index] = updated;
    return updated;
  }

  if (name === 'products') {
    return updateProduct(entityId, body);
  }

  const updated = {
    ...current,
    name: validateName(body),
    email: optionalString(body.email),
    phone: optionalString(body.phone),
    address: optionalString(body.address),
    updatedAt,
  };
  items[index] = updated as Entity;
  return updated;
}

function deleteEntity(name: CollectionName, entityId: string) {
  const items = collection(name);
  const index = items.findIndex((item) => item.id === entityId);

  if (index < 0) {
    throw new DemoRequestError(404, 'Record not found.');
  }

  items.splice(index, 1);
}

function numberField(body: Body, field: string) {
  const value = Number(body[field]);
  if (!Number.isFinite(value) || value < 0) {
    throw new DemoRequestError(400, 'Numbers must be zero or greater.');
  }
  return value;
}

function createProduct(body: Body) {
  const createdAt = stamp();
  const product: Product = {
    id: id('prd'),
    sku: String(body.sku ?? '').trim(),
    name: validateName(body),
    price: currency(numberField(body, 'price')),
    cost: currency(numberField(body, 'cost')),
    stock: numberField(body, 'stock'),
    minStock: numberField(body, 'minStock'),
    categoryId: String(body.categoryId ?? ''),
    supplierId: String(body.supplierId ?? ''),
    createdAt,
    updatedAt: createdAt,
  };

  if (!product.sku || !product.categoryId || !product.supplierId) {
    throw new DemoRequestError(400, 'SKU, category, and supplier are required.');
  }

  state.products.unshift(product);
  return product;
}

function updateProduct(productId: string, body: Body) {
  const index = state.products.findIndex((product) => product.id === productId);
  if (index < 0) {
    throw new DemoRequestError(404, 'Product not found.');
  }

  const product: Product = {
    ...state.products[index],
    sku: String(body.sku ?? '').trim(),
    name: validateName(body),
    price: currency(numberField(body, 'price')),
    cost: currency(numberField(body, 'cost')),
    stock: numberField(body, 'stock'),
    minStock: numberField(body, 'minStock'),
    categoryId: String(body.categoryId ?? ''),
    supplierId: String(body.supplierId ?? ''),
    updatedAt: stamp(),
  };

  if (!product.sku || !product.categoryId || !product.supplierId) {
    throw new DemoRequestError(400, 'SKU, category, and supplier are required.');
  }

  state.products[index] = product;
  return product;
}

function listProducts(url: URL) {
  const categoryId = url.searchParams.get('categoryId');
  const lowStock = url.searchParams.get('lowStock') === 'true';
  let products = state.products;

  if (categoryId) {
    products = products.filter((product) => product.categoryId === categoryId);
  }
  if (lowStock) {
    products = products.filter((product) => product.stock <= product.minStock);
  }

  return list(products as unknown as Record<string, unknown>[], url) as unknown as ListResponse<Product>;
}

function currentUserId() {
  return readAuthSession()?.user.id ?? 'usr-admin';
}

function createSale(body: Body) {
  const items = body.items as Array<{ productId?: string; qty?: number }> | undefined;
  if (!items?.length) {
    throw new DemoRequestError(400, 'Add at least one product.');
  }

  for (const line of items) {
    const product = state.products.find((item) => item.id === line.productId);
    const qty = Number(line.qty);

    if (!product || !Number.isInteger(qty) || qty <= 0) {
      throw new DemoRequestError(400, 'Sale items must include a product and quantity.');
    }

    if (product.stock < qty) {
      throw new DemoRequestError(409, `Insufficient stock for ${product.sku}. Available: ${product.stock}.`);
    }
  }

  const createdAt = stamp();
  const saleId = id('sal');
  const saleItems: SaleItem[] = items.map((line, index) => {
    const product = state.products.find((item) => item.id === line.productId)!;
    const qty = Number(line.qty);
    product.stock -= qty;
    product.updatedAt = createdAt;

    state.stockMovements.unshift({
      id: id('mov'),
      productId: product.id,
      type: 'sale',
      qty: -qty,
      reason: `Sale ${saleId}`,
      userId: currentUserId(),
      createdAt,
    });

    return {
      id: `${saleId}-line-${index + 1}`,
      saleId,
      productId: product.id,
      qty,
      unitPrice: product.price,
    };
  });

  const sale: Sale = {
    id: saleId,
    sellerId: currentUserId(),
    clientId: typeof body.clientId === 'string' ? body.clientId : null,
    total: currency(saleItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.qty, 0)),
    createdAt,
    items: saleItems,
  };

  state.sales.unshift(sale);
  return sale;
}

function listSales(url: URL) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  let sales = state.sales;

  if (from) {
    sales = sales.filter((sale) => sale.createdAt >= from);
  }
  if (to) {
    sales = sales.filter((sale) => sale.createdAt <= to);
  }

  return list(sales as unknown as Record<string, unknown>[], url, 'createdAt') as unknown as ListResponse<Sale>;
}

function adjustStock(body: Body) {
  const product = state.products.find((item) => item.id === body.productId);
  const qty = Number(body.qty);

  if (!product) {
    throw new DemoRequestError(404, 'Product not found.');
  }
  if (!Number.isInteger(qty) || qty === 0) {
    throw new DemoRequestError(400, 'Quantity must be a non-zero whole number.');
  }
  if (product.stock + qty < 0) {
    throw new DemoRequestError(409, `Insufficient stock for ${product.sku}. Available: ${product.stock}.`);
  }

  const createdAt = stamp();
  product.stock += qty;
  product.updatedAt = createdAt;

  const movement: StockMovement = {
    id: id('mov'),
    productId: product.id,
    type: 'adjustment',
    qty,
    reason: String(body.reason ?? '').trim() || null,
    userId: currentUserId(),
    createdAt,
  };
  state.stockMovements.unshift(movement);
  return movement;
}

function listMovements(url: URL) {
  const productId = url.searchParams.get('productId');
  const type = url.searchParams.get('type') as StockMovementType | null;
  let movements = state.stockMovements;

  if (productId) {
    movements = movements.filter((movement) => movement.productId === productId);
  }
  if (type) {
    movements = movements.filter((movement) => movement.type === type);
  }

  return list(movements as unknown as Record<string, unknown>[], url, 'createdAt') as unknown as ListResponse<StockMovement>;
}

function stockAlerts(): StockAlertsResponse {
  const data = state.products.filter((product) => product.stock <= product.minStock);
  return { data, total: data.length };
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysAgo(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function salesSince(days: number) {
  const from = daysAgo(days - 1).toISOString();
  return state.sales.filter((sale) => sale.createdAt >= from);
}

function salesTotal(sales: Sale[]) {
  return currency(sales.reduce((sum, sale) => sum + Number(sale.total), 0));
}

function dashboardSummary() {
  const todayStart = startOfDay(new Date()).toISOString();
  const today = state.sales.filter((sale) => sale.createdAt >= todayStart);
  const seven = salesSince(7);
  const thirty = salesSince(30);

  return {
    revenueToday: salesTotal(today),
    revenue7d: salesTotal(seven),
    revenue30d: salesTotal(thirty),
    salesCountToday: today.length,
    salesCount7d: seven.length,
    salesCount30d: thirty.length,
    lowStockCount: stockAlerts().total,
    productCount: state.products.length,
    clientCount: state.clients.length,
  };
}

function salesSeries(url: URL) {
  const days = Number(url.searchParams.get('days') ?? 30);

  return Array.from({ length: days }, (_, index) => {
    const date = daysAgo(days - index - 1);
    const key = date.toISOString().slice(0, 10);
    const sales = state.sales.filter((sale) => sale.createdAt.slice(0, 10) === key);

    return {
      date: key,
      revenue: salesTotal(sales),
      salesCount: sales.length,
    };
  });
}

function topProducts(url: URL) {
  const days = Number(url.searchParams.get('days') ?? 30);
  const limit = Number(url.searchParams.get('limit') ?? 5);
  const totals = new Map<string, { unitsSold: number; revenue: number }>();

  for (const sale of salesSince(days)) {
    for (const item of sale.items) {
      const current = totals.get(item.productId) ?? { unitsSold: 0, revenue: 0 };
      current.unitsSold += item.qty;
      current.revenue += item.qty * Number(item.unitPrice);
      totals.set(item.productId, current);
    }
  }

  return [...totals.entries()]
    .map(([productId, total]) => {
      const product = state.products.find((item) => item.id === productId);
      return {
        productId,
        name: product?.name ?? productId,
        sku: product?.sku ?? productId,
        unitsSold: total.unitsSold,
        revenue: currency(total.revenue),
      };
    })
    .sort((left, right) => Number(right.revenue) - Number(left.revenue))
    .slice(0, limit);
}

function route(path: string) {
  return new URL(path, 'https://demo.local');
}

export async function demoRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = route(path);
  const method = (options.method ?? 'GET').toUpperCase();
  const parts = url.pathname.split('/').filter(Boolean);

  await Promise.resolve();

  if (url.pathname === '/auth/login' && method === 'POST') {
    const body = requireBody(options);
    const user = state.users.find((item) => item.email === body.email);
    if (!user || body.password !== 'demo1234') {
      throw new DemoRequestError(401, 'Invalid demo credentials.');
    }
    return { accessToken: `demo-token-${user.role}`, user } as T;
  }

  if (url.pathname === '/products' && method === 'GET') {
    return listProducts(url) as T;
  }

  for (const name of ['categories', 'clients', 'suppliers', 'products'] as CollectionName[]) {
    if (url.pathname === `/${name}` && method === 'GET') {
      return list(collection(name) as unknown as Record<string, unknown>[], url) as T;
    }
    if (url.pathname === `/${name}` && method === 'POST') {
      return createEntity(name, requireBody(options)) as T;
    }
    if (parts[0] === name && parts[1] && method === 'PATCH') {
      return updateEntity(name, parts[1], requireBody(options)) as T;
    }
    if (parts[0] === name && parts[1] && method === 'DELETE') {
      deleteEntity(name, parts[1]);
      return undefined as T;
    }
  }

  if (url.pathname === '/sales' && method === 'GET') {
    return listSales(url) as T;
  }
  if (url.pathname === '/sales' && method === 'POST') {
    return createSale(requireBody(options)) as T;
  }
  if (parts[0] === 'sales' && parts[1] && method === 'GET') {
    const sale = state.sales.find((item) => item.id === parts[1]);
    if (!sale) {
      throw new DemoRequestError(404, 'Sale not found.');
    }
    return sale as T;
  }

  if (url.pathname === '/stock/movements' && method === 'GET') {
    return listMovements(url) as T;
  }
  if (url.pathname === '/stock/alerts' && method === 'GET') {
    return stockAlerts() as T;
  }
  if (url.pathname === '/stock/adjustments' && method === 'POST') {
    return adjustStock(requireBody(options)) as T;
  }

  if (url.pathname === '/dashboard/summary' && method === 'GET') {
    return dashboardSummary() as T;
  }
  if (url.pathname === '/dashboard/sales-series' && method === 'GET') {
    return salesSeries(url) as T;
  }
  if (url.pathname === '/dashboard/top-products' && method === 'GET') {
    return topProducts(url) as T;
  }

  throw new DemoRequestError(404, `Demo endpoint not implemented: ${method} ${url.pathname}`);
}

function csvEscape(value: string | number | null) {
  const text = value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: Array<Array<string | number | null>>) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function reportBlob(content: string, filename: string) {
  return {
    blob: new Blob([content], { type: 'text/csv;charset=utf-8' }),
    filename,
  };
}

export async function demoDownload(path: string, fallbackFilename: string) {
  const url = route(path);
  const format = url.searchParams.get('format') ?? 'csv';

  await Promise.resolve();

  if (format !== 'csv') {
    throw new DemoRequestError(400, 'Demo reports are available as CSV.');
  }

  if (url.pathname === '/reports/sales') {
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const rows: Array<Array<string | number | null>> = [['date', 'sale_id', 'client', 'seller', 'sku', 'product', 'qty', 'unit_price', 'line_total']];

    state.sales
      .filter((sale) => (!from || sale.createdAt >= from) && (!to || sale.createdAt <= to))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .forEach((sale) => {
        const client = state.clients.find((item) => item.id === sale.clientId)?.name ?? 'Walk-in';
        const seller = state.users.find((item) => item.id === sale.sellerId)?.name ?? sale.sellerId;
        sale.items.forEach((item) => {
          const product = state.products.find((entry) => entry.id === item.productId);
          rows.push([
            sale.createdAt,
            sale.id,
            client,
            seller,
            product?.sku ?? item.productId,
            product?.name ?? item.productId,
            item.qty,
            item.unitPrice,
            currency(item.qty * Number(item.unitPrice)),
          ]);
        });
      });

    return reportBlob(csv(rows), fallbackFilename);
  }

  if (url.pathname === '/reports/stock') {
    const rows: Array<Array<string | number | null>> = [['sku', 'product', 'category', 'supplier', 'stock', 'min_stock', 'price', 'cost']];

    state.products
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .forEach((product) => {
        rows.push([
          product.sku,
          product.name,
          state.categories.find((category) => category.id === product.categoryId)?.name ?? product.categoryId,
          state.suppliers.find((supplier) => supplier.id === product.supplierId)?.name ?? product.supplierId,
          product.stock,
          product.minStock,
          product.price,
          product.cost,
        ]);
      });

    return reportBlob(csv(rows), fallbackFilename);
  }

  throw new DemoRequestError(404, `Demo report not implemented: ${url.pathname}`);
}
