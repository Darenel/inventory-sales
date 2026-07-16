import {
  Category,
  Client,
  Product,
  Sale,
  SaleItem,
  StockMovement,
  Supplier,
} from '../lib/types';
import { AuthUser } from '../auth/storage';

export type DemoState = {
  users: AuthUser[];
  categories: Category[];
  suppliers: Supplier[];
  clients: Client[];
  products: Product[];
  sales: Sale[];
  stockMovements: StockMovement[];
};

const now = new Date();
const iso = (daysAgo: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(now.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const demoUsers: AuthUser[] = [
  { id: 'usr-admin', name: 'Ada Manager', email: 'admin@inventory.local', role: 'admin' },
  { id: 'usr-sales', name: 'Victor Sales', email: 'vendedor@inventory.local', role: 'vendedor' },
  { id: 'usr-stock', name: 'Alma Stock', email: 'almacen@inventory.local', role: 'almacen' },
];

const categories: Category[] = [
  { id: 'cat-tools', name: 'Hand Tools', createdAt: iso(120), updatedAt: iso(120) },
  { id: 'cat-power', name: 'Power Tools', createdAt: iso(120), updatedAt: iso(120) },
  { id: 'cat-fasteners', name: 'Fasteners', createdAt: iso(120), updatedAt: iso(120) },
  { id: 'cat-plumbing', name: 'Plumbing', createdAt: iso(120), updatedAt: iso(120) },
  { id: 'cat-electrical', name: 'Electrical', createdAt: iso(120), updatedAt: iso(120) },
  { id: 'cat-paint', name: 'Paint & Supplies', createdAt: iso(120), updatedAt: iso(120) },
];

const suppliers: Supplier[] = [
  { id: 'sup-apex', name: 'Apex Tool Supply', email: 'orders@apextool.example', phone: '555-0101', address: '1200 Commerce Ave', createdAt: iso(100), updatedAt: iso(100) },
  { id: 'sup-bright', name: 'BrightLine Electrical', email: 'sales@brightline.example', phone: '555-0134', address: '44 Circuit Rd', createdAt: iso(98), updatedAt: iso(98) },
  { id: 'sup-copper', name: 'Copper Creek Plumbing', email: 'desk@coppercreek.example', phone: '555-0198', address: '8 Valve Street', createdAt: iso(96), updatedAt: iso(96) },
  { id: 'sup-truecoat', name: 'TrueCoat Paints', email: 'support@truecoat.example', phone: '555-0150', address: '710 Primer Blvd', createdAt: iso(92), updatedAt: iso(92) },
  { id: 'sup-yard', name: 'Yard & Build Wholesale', email: 'hello@yardbuild.example', phone: '555-0177', address: '91 Builder Lane', createdAt: iso(89), updatedAt: iso(89) },
];

const clients: Client[] = [
  { id: 'cli-homepro', name: 'HomePro Repairs', email: 'billing@homepro.example', phone: '555-2101', address: '18 Oak Terrace', createdAt: iso(80), updatedAt: iso(80) },
  { id: 'cli-reno', name: 'RenoWorks Studio', email: 'ops@renoworks.example', phone: '555-2102', address: '302 Market St', createdAt: iso(76), updatedAt: iso(76) },
  { id: 'cli-marina', name: 'Marina Maintenance', email: 'service@marina.example', phone: '555-2103', address: '77 Harbor Way', createdAt: iso(70), updatedAt: iso(70) },
  { id: 'cli-green', name: 'Green Porch Builders', email: 'crew@greenporch.example', phone: '555-2104', address: '40 Pine Road', createdAt: iso(66), updatedAt: iso(66) },
  { id: 'cli-summit', name: 'Summit Property Care', email: 'admin@summitcare.example', phone: '555-2105', address: '905 Ridge Plaza', createdAt: iso(61), updatedAt: iso(61) },
  { id: 'cli-neighbor', name: 'Neighborhood HOA', email: 'board@neighborhoa.example', phone: '555-2106', address: '12 Maple Court', createdAt: iso(54), updatedAt: iso(54) },
  { id: 'cli-brick', name: 'Brick & Beam Co.', email: 'purchasing@brickbeam.example', phone: '555-2107', address: '6 Mason Ave', createdAt: iso(48), updatedAt: iso(48) },
  { id: 'cli-walkin', name: 'Walk-in Account', email: null, phone: null, address: null, createdAt: iso(40), updatedAt: iso(40) },
];

const productSeed: Array<Omit<Product, 'createdAt' | 'updatedAt'>> = [
  { id: 'prd-hammer', sku: 'HT-100', name: 'Claw hammer 16 oz', price: '14.99', cost: '8.10', stock: 44, minStock: 12, categoryId: 'cat-tools', supplierId: 'sup-apex' },
  { id: 'prd-screwdriver', sku: 'HT-110', name: 'Screwdriver set 8 pc', price: '19.50', cost: '10.25', stock: 28, minStock: 10, categoryId: 'cat-tools', supplierId: 'sup-apex' },
  { id: 'prd-wrench', sku: 'HT-120', name: 'Adjustable wrench 10 in', price: '18.75', cost: '9.80', stock: 7, minStock: 8, categoryId: 'cat-tools', supplierId: 'sup-apex' },
  { id: 'prd-pliers', sku: 'HT-130', name: 'Linesman pliers', price: '16.20', cost: '8.70', stock: 19, minStock: 8, categoryId: 'cat-tools', supplierId: 'sup-apex' },
  { id: 'prd-tape', sku: 'HT-140', name: 'Tape measure 25 ft', price: '11.30', cost: '5.40', stock: 6, minStock: 15, categoryId: 'cat-tools', supplierId: 'sup-yard' },
  { id: 'prd-drill', sku: 'PT-200', name: 'Cordless drill 20V', price: '89.99', cost: '58.00', stock: 15, minStock: 5, categoryId: 'cat-power', supplierId: 'sup-apex' },
  { id: 'prd-circular', sku: 'PT-210', name: 'Circular saw 7-1/4 in', price: '119.00', cost: '77.50', stock: 9, minStock: 4, categoryId: 'cat-power', supplierId: 'sup-apex' },
  { id: 'prd-sander', sku: 'PT-220', name: 'Orbital sander', price: '54.99', cost: '34.00', stock: 12, minStock: 5, categoryId: 'cat-power', supplierId: 'sup-yard' },
  { id: 'prd-bits', sku: 'PT-230', name: 'Titanium drill bit set', price: '24.99', cost: '12.90', stock: 31, minStock: 12, categoryId: 'cat-power', supplierId: 'sup-apex' },
  { id: 'prd-nails', sku: 'FS-300', name: 'Common nails 5 lb', price: '12.50', cost: '6.80', stock: 52, minStock: 20, categoryId: 'cat-fasteners', supplierId: 'sup-yard' },
  { id: 'prd-screws', sku: 'FS-310', name: 'Deck screws 3 in 5 lb', price: '28.75', cost: '16.20', stock: 11, minStock: 14, categoryId: 'cat-fasteners', supplierId: 'sup-yard' },
  { id: 'prd-anchors', sku: 'FS-320', name: 'Drywall anchors 100 ct', price: '9.40', cost: '4.30', stock: 38, minStock: 16, categoryId: 'cat-fasteners', supplierId: 'sup-yard' },
  { id: 'prd-bolts', sku: 'FS-330', name: 'Hex bolt assortment', price: '21.60', cost: '11.40', stock: 18, minStock: 8, categoryId: 'cat-fasteners', supplierId: 'sup-yard' },
  { id: 'prd-pvc', sku: 'PL-400', name: 'PVC pipe 1/2 in 10 ft', price: '6.75', cost: '3.20', stock: 62, minStock: 25, categoryId: 'cat-plumbing', supplierId: 'sup-copper' },
  { id: 'prd-coupling', sku: 'PL-410', name: 'Copper coupling 1/2 in', price: '2.95', cost: '1.10', stock: 85, minStock: 30, categoryId: 'cat-plumbing', supplierId: 'sup-copper' },
  { id: 'prd-faucet', sku: 'PL-420', name: 'Kitchen faucet chrome', price: '74.99', cost: '46.00', stock: 4, minStock: 5, categoryId: 'cat-plumbing', supplierId: 'sup-copper' },
  { id: 'prd-valve', sku: 'PL-430', name: 'Ball valve 3/4 in', price: '13.80', cost: '7.25', stock: 22, minStock: 10, categoryId: 'cat-plumbing', supplierId: 'sup-copper' },
  { id: 'prd-wire', sku: 'EL-500', name: 'Romex wire 12/2 50 ft', price: '48.50', cost: '31.00', stock: 17, minStock: 8, categoryId: 'cat-electrical', supplierId: 'sup-bright' },
  { id: 'prd-outlet', sku: 'EL-510', name: 'Duplex outlet 10 pack', price: '15.25', cost: '7.80', stock: 30, minStock: 12, categoryId: 'cat-electrical', supplierId: 'sup-bright' },
  { id: 'prd-breaker', sku: 'EL-520', name: '20 amp breaker', price: '18.40', cost: '10.60', stock: 5, minStock: 8, categoryId: 'cat-electrical', supplierId: 'sup-bright' },
  { id: 'prd-tape-el', sku: 'EL-530', name: 'Electrical tape 6 pack', price: '8.95', cost: '3.90', stock: 41, minStock: 15, categoryId: 'cat-electrical', supplierId: 'sup-bright' },
  { id: 'prd-paint', sku: 'PS-600', name: 'Interior paint satin 1 gal', price: '32.99', cost: '19.50', stock: 26, minStock: 10, categoryId: 'cat-paint', supplierId: 'sup-truecoat' },
  { id: 'prd-primer', sku: 'PS-610', name: 'Multi-surface primer 1 gal', price: '24.50', cost: '14.20', stock: 13, minStock: 8, categoryId: 'cat-paint', supplierId: 'sup-truecoat' },
  { id: 'prd-brush', sku: 'PS-620', name: 'Angled paint brush 2 in', price: '7.80', cost: '3.25', stock: 33, minStock: 14, categoryId: 'cat-paint', supplierId: 'sup-truecoat' },
  { id: 'prd-roller', sku: 'PS-630', name: 'Roller cover 3 pack', price: '10.95', cost: '5.30', stock: 9, minStock: 12, categoryId: 'cat-paint', supplierId: 'sup-truecoat' },
];

const products: Product[] = productSeed.map((product, index) => ({
  ...product,
  createdAt: iso(90 - (index % 15)),
  updatedAt: iso(index % 10),
}));

const salePlans: Array<{ daysAgo: number; clientId: string | null; sellerId: string; lines: Array<[string, number]> }> = [
  { daysAgo: 59, clientId: 'cli-homepro', sellerId: 'usr-sales', lines: [['prd-hammer', 2], ['prd-nails', 4], ['prd-tape', 1]] },
  { daysAgo: 57, clientId: 'cli-reno', sellerId: 'usr-sales', lines: [['prd-paint', 3], ['prd-brush', 4], ['prd-roller', 2]] },
  { daysAgo: 55, clientId: 'cli-marina', sellerId: 'usr-admin', lines: [['prd-pvc', 8], ['prd-valve', 3], ['prd-coupling', 10]] },
  { daysAgo: 54, clientId: null, sellerId: 'usr-sales', lines: [['prd-screwdriver', 1], ['prd-anchors', 2]] },
  { daysAgo: 52, clientId: 'cli-green', sellerId: 'usr-sales', lines: [['prd-drill', 1], ['prd-bits', 2], ['prd-screws', 2]] },
  { daysAgo: 50, clientId: 'cli-summit', sellerId: 'usr-admin', lines: [['prd-wire', 2], ['prd-outlet', 3], ['prd-tape-el', 4]] },
  { daysAgo: 48, clientId: 'cli-neighbor', sellerId: 'usr-sales', lines: [['prd-circular', 1], ['prd-bolts', 2]] },
  { daysAgo: 47, clientId: 'cli-brick', sellerId: 'usr-sales', lines: [['prd-nails', 6], ['prd-screws', 3], ['prd-tape', 2]] },
  { daysAgo: 45, clientId: 'cli-homepro', sellerId: 'usr-admin', lines: [['prd-faucet', 1], ['prd-valve', 2]] },
  { daysAgo: 43, clientId: null, sellerId: 'usr-sales', lines: [['prd-hammer', 1], ['prd-wrench', 1]] },
  { daysAgo: 41, clientId: 'cli-reno', sellerId: 'usr-sales', lines: [['prd-primer', 2], ['prd-paint', 4], ['prd-roller', 3]] },
  { daysAgo: 39, clientId: 'cli-marina', sellerId: 'usr-admin', lines: [['prd-pvc', 12], ['prd-coupling', 12]] },
  { daysAgo: 38, clientId: 'cli-green', sellerId: 'usr-sales', lines: [['prd-sander', 1], ['prd-brush', 3]] },
  { daysAgo: 36, clientId: 'cli-summit', sellerId: 'usr-sales', lines: [['prd-breaker', 2], ['prd-wire', 1]] },
  { daysAgo: 34, clientId: 'cli-neighbor', sellerId: 'usr-admin', lines: [['prd-outlet', 2], ['prd-tape-el', 2]] },
  { daysAgo: 33, clientId: 'cli-brick', sellerId: 'usr-sales', lines: [['prd-drill', 1], ['prd-bits', 1]] },
  { daysAgo: 31, clientId: null, sellerId: 'usr-sales', lines: [['prd-pliers', 1], ['prd-screwdriver', 1]] },
  { daysAgo: 30, clientId: 'cli-homepro', sellerId: 'usr-admin', lines: [['prd-anchors', 5], ['prd-bolts', 2]] },
  { daysAgo: 28, clientId: 'cli-reno', sellerId: 'usr-sales', lines: [['prd-paint', 2], ['prd-primer', 1], ['prd-brush', 2]] },
  { daysAgo: 27, clientId: 'cli-marina', sellerId: 'usr-sales', lines: [['prd-valve', 2], ['prd-coupling', 8]] },
  { daysAgo: 25, clientId: 'cli-green', sellerId: 'usr-admin', lines: [['prd-circular', 1], ['prd-nails', 3]] },
  { daysAgo: 24, clientId: 'cli-summit', sellerId: 'usr-sales', lines: [['prd-wire', 2], ['prd-breaker', 1]] },
  { daysAgo: 22, clientId: 'cli-neighbor', sellerId: 'usr-sales', lines: [['prd-tape', 2], ['prd-hammer', 2]] },
  { daysAgo: 21, clientId: 'cli-brick', sellerId: 'usr-admin', lines: [['prd-screws', 4], ['prd-drill', 1]] },
  { daysAgo: 19, clientId: null, sellerId: 'usr-sales', lines: [['prd-outlet', 1], ['prd-tape-el', 1]] },
  { daysAgo: 18, clientId: 'cli-homepro', sellerId: 'usr-sales', lines: [['prd-faucet', 1], ['prd-pvc', 4]] },
  { daysAgo: 16, clientId: 'cli-reno', sellerId: 'usr-admin', lines: [['prd-roller', 2], ['prd-brush', 2], ['prd-paint', 2]] },
  { daysAgo: 15, clientId: 'cli-marina', sellerId: 'usr-sales', lines: [['prd-coupling', 15], ['prd-valve', 1]] },
  { daysAgo: 13, clientId: 'cli-green', sellerId: 'usr-sales', lines: [['prd-sander', 1], ['prd-bits', 2]] },
  { daysAgo: 12, clientId: 'cli-summit', sellerId: 'usr-admin', lines: [['prd-breaker', 1], ['prd-outlet', 2]] },
  { daysAgo: 10, clientId: 'cli-neighbor', sellerId: 'usr-sales', lines: [['prd-primer', 2], ['prd-paint', 3]] },
  { daysAgo: 9, clientId: 'cli-brick', sellerId: 'usr-sales', lines: [['prd-screws', 4], ['prd-nails', 4]] },
  { daysAgo: 8, clientId: null, sellerId: 'usr-sales', lines: [['prd-tape', 1], ['prd-wrench', 1]] },
  { daysAgo: 6, clientId: 'cli-homepro', sellerId: 'usr-admin', lines: [['prd-drill', 1], ['prd-hammer', 1], ['prd-bits', 1]] },
  { daysAgo: 5, clientId: 'cli-reno', sellerId: 'usr-sales', lines: [['prd-roller', 2], ['prd-brush', 2]] },
  { daysAgo: 4, clientId: 'cli-marina', sellerId: 'usr-sales', lines: [['prd-pvc', 6], ['prd-coupling', 10]] },
  { daysAgo: 3, clientId: 'cli-green', sellerId: 'usr-admin', lines: [['prd-circular', 1], ['prd-bolts', 1]] },
  { daysAgo: 2, clientId: 'cli-summit', sellerId: 'usr-sales', lines: [['prd-wire', 1], ['prd-tape-el', 2]] },
  { daysAgo: 1, clientId: 'cli-neighbor', sellerId: 'usr-sales', lines: [['prd-paint', 2], ['prd-primer', 1]] },
  { daysAgo: 0, clientId: 'cli-brick', sellerId: 'usr-admin', lines: [['prd-screws', 2], ['prd-anchors', 2]] },
];

function makeSalesAndMovements() {
  const stockMovements: StockMovement[] = [];
  const sales: Sale[] = salePlans.map((plan, saleIndex) => {
    const saleId = `sal-${String(saleIndex + 1).padStart(3, '0')}`;
    const createdAt = iso(plan.daysAgo, 9 + (saleIndex % 8));
    const items: SaleItem[] = plan.lines.map(([productId, qty], lineIndex) => {
      const product = products.find((item) => item.id === productId);
      const unitPrice = product?.price ?? '0';

      stockMovements.push({
        id: `mov-sale-${String(saleIndex + 1).padStart(3, '0')}-${lineIndex + 1}`,
        productId,
        type: 'sale',
        qty: -qty,
        reason: `Sale ${saleId}`,
        userId: plan.sellerId,
        createdAt,
      });

      return {
        id: `sli-${String(saleIndex + 1).padStart(3, '0')}-${lineIndex + 1}`,
        saleId,
        productId,
        qty,
        unitPrice,
      };
    });

    return {
      id: saleId,
      sellerId: plan.sellerId,
      clientId: plan.clientId,
      total: items.reduce((sum, item) => sum + Number(item.unitPrice) * item.qty, 0).toFixed(2),
      createdAt,
      items,
    };
  });

  stockMovements.push(
    { id: 'mov-adj-001', productId: 'prd-tape', type: 'adjustment', qty: -3, reason: 'Cycle count correction', userId: 'usr-stock', createdAt: iso(11, 15) },
    { id: 'mov-adj-002', productId: 'prd-outlet', type: 'adjustment', qty: 6, reason: 'Shelf recount', userId: 'usr-stock', createdAt: iso(7, 11) },
    { id: 'mov-pur-001', productId: 'prd-paint', type: 'purchase', qty: 12, reason: 'Vendor restock', userId: 'usr-stock', createdAt: iso(14, 10) },
    { id: 'mov-pur-002', productId: 'prd-nails', type: 'purchase', qty: 20, reason: 'Vendor restock', userId: 'usr-stock', createdAt: iso(20, 10) },
  );

  return { sales, stockMovements };
}

const generated = makeSalesAndMovements();

export function createDemoState(): DemoState {
  return {
    users: demoUsers.map((user) => ({ ...user })),
    categories: categories.map((category) => ({ ...category })),
    suppliers: suppliers.map((supplier) => ({ ...supplier })),
    clients: clients.map((client) => ({ ...client })),
    products: products.map((product) => ({ ...product })),
    sales: generated.sales.map((sale) => ({ ...sale, items: sale.items.map((item) => ({ ...item })) })),
    stockMovements: generated.stockMovements.map((movement) => ({ ...movement })),
  };
}
