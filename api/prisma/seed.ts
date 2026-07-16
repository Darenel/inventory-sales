import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12);

  await prisma.user.createMany({
    data: [
      { name: 'Darenel Admin', email: 'admin@inventory.local', passwordHash, role: Role.admin },
      { name: 'Marina Sales', email: 'vendedor@inventory.local', passwordHash, role: Role.vendedor },
      { name: 'Oscar Warehouse', email: 'almacen@inventory.local', passwordHash, role: Role.almacen },
    ],
    skipDuplicates: true,
  });

  const categoryNames = ['Hand Tools', 'Power Tools', 'Fasteners', 'Paint & Supplies', 'Plumbing', 'Electrical'];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const suppliers = await Promise.all(
    [
      ['Northstar Hardware Supply', 'orders@northstarhardware.com', '(555) 014-2201', '1840 Ridgeway Industrial Park'],
      ['Cobalt Tool Distributors', 'sales@cobalttoolco.com', '(555) 017-8840', '72 Market Depot Road'],
      ['BrightLine Electrical Wholesale', 'accounts@brightline-elec.com', '(555) 018-4105', '510 Copper Avenue'],
      ['GreenValve Plumbing Co.', 'service@greenvalveplumbing.com', '(555) 016-9033', '39 Basin Street'],
      ['Summit Paint & Finish', 'hello@summitfinish.com', '(555) 015-3772', '221 Primer Lane'],
    ].map(([name, email, phone, address]) =>
      prisma.supplier.upsert({
        where: { email },
        update: { name, phone, address },
        create: { name, email, phone, address },
      }),
    ),
  );

  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
  const supplierByName = new Map(suppliers.map((supplier) => [supplier.name, supplier.id]));

  const products = [
    ['HW-0001', '16 oz Fiberglass Claw Hammer', 'Hand Tools', 'Northstar Hardware Supply', 18.99, 10.75, 42, 8],
    ['HW-0002', '10 in Groove Joint Pliers', 'Hand Tools', 'Northstar Hardware Supply', 14.5, 7.9, 35, 6],
    ['HW-0003', '25 ft Magnetic Tape Measure', 'Hand Tools', 'Cobalt Tool Distributors', 11.75, 5.85, 58, 12],
    ['HW-0004', 'Heavy Duty Utility Knife', 'Hand Tools', 'Cobalt Tool Distributors', 7.25, 3.1, 64, 15],
    ['HW-0005', '9 Piece Hex Key Set SAE', 'Hand Tools', 'Northstar Hardware Supply', 9.4, 4.6, 27, 7],
    ['HW-0006', '20V Cordless Drill Driver Kit', 'Power Tools', 'Cobalt Tool Distributors', 89.99, 57.5, 18, 4],
    ['HW-0007', '7-1/4 in Circular Saw', 'Power Tools', 'Cobalt Tool Distributors', 74.95, 48.2, 12, 3],
    ['HW-0008', '5 in Random Orbit Sander', 'Power Tools', 'Cobalt Tool Distributors', 49.5, 31.25, 16, 4],
    ['HW-0009', 'Angle Grinder 4-1/2 in 7 Amp', 'Power Tools', 'Northstar Hardware Supply', 44.9, 28.8, 14, 4],
    ['HW-0010', 'Impact Driver Bit Set 32 Piece', 'Power Tools', 'Cobalt Tool Distributors', 16.95, 8.4, 31, 8],
    ['HW-0011', 'Wood Screws #8 x 1-1/4 in 100 ct', 'Fasteners', 'Northstar Hardware Supply', 6.8, 2.9, 120, 25],
    ['HW-0012', 'Galvanized Nails 2 in 1 lb Box', 'Fasteners', 'Northstar Hardware Supply', 5.6, 2.35, 86, 20],
    ['HW-0013', 'Drywall Anchors with Screws 50 ct', 'Fasteners', 'Northstar Hardware Supply', 8.25, 3.7, 73, 18],
    ['HW-0014', 'Zinc Hex Bolts 3/8 x 2 in 25 ct', 'Fasteners', 'Cobalt Tool Distributors', 10.95, 5.2, 44, 10],
    ['HW-0015', 'Interior Latex Paint Eggshell White 1 gal', 'Paint & Supplies', 'Summit Paint & Finish', 27.99, 16.8, 24, 6],
    ['HW-0016', 'Angled Paint Brush 2-1/2 in', 'Paint & Supplies', 'Summit Paint & Finish', 8.95, 3.95, 39, 10],
    ['HW-0017', 'Microfiber Paint Roller Cover 3 Pack', 'Paint & Supplies', 'Summit Paint & Finish', 12.5, 6.1, 33, 8],
    ['HW-0018', 'Blue Painter Tape 1.88 in x 60 yd', 'Paint & Supplies', 'Summit Paint & Finish', 7.95, 3.6, 52, 12],
    ['HW-0019', 'PVC Ball Valve 1/2 in', 'Plumbing', 'GreenValve Plumbing Co.', 5.75, 2.15, 48, 12],
    ['HW-0020', 'Braided Faucet Connector 20 in', 'Plumbing', 'GreenValve Plumbing Co.', 9.8, 4.45, 40, 10],
    ['HW-0021', 'Adjustable Sink Wrench', 'Plumbing', 'GreenValve Plumbing Co.', 19.95, 10.9, 11, 3],
    ['HW-0022', 'PTFE Thread Seal Tape 2 Pack', 'Plumbing', 'GreenValve Plumbing Co.', 3.95, 1.25, 95, 20],
    ['HW-0023', 'Duplex Wall Outlet 15 Amp White', 'Electrical', 'BrightLine Electrical Wholesale', 2.85, 1.05, 140, 30],
    ['HW-0024', 'Single Pole Light Switch 15 Amp', 'Electrical', 'BrightLine Electrical Wholesale', 3.1, 1.2, 118, 25],
    ['HW-0025', 'Outdoor Extension Cord 50 ft 14/3', 'Electrical', 'BrightLine Electrical Wholesale', 34.95, 21.4, 22, 6],
  ];

  await Promise.all(
    products.map(([sku, name, categoryName, supplierName, price, cost, stock, minStock]) =>
      prisma.product.upsert({
        where: { sku: String(sku) },
        update: {
          name: String(name),
          price: Number(price),
          cost: Number(cost),
          stock: Number(stock),
          minStock: Number(minStock),
          categoryId: categoryByName.get(String(categoryName))!,
          supplierId: supplierByName.get(String(supplierName))!,
        },
        create: {
          sku: String(sku),
          name: String(name),
          price: Number(price),
          cost: Number(cost),
          stock: Number(stock),
          minStock: Number(minStock),
          categoryId: categoryByName.get(String(categoryName))!,
          supplierId: supplierByName.get(String(supplierName))!,
        },
      }),
    ),
  );

  await Promise.all(
    [
      ['Riverside Property Services', 'purchasing@riversideps.com', '(555) 011-4820', '405 Oak Terrace'],
      ['Hendrix Home Repair', 'office@hendrixrepair.com', '(555) 011-7734', '18 Millbrook Court'],
      ['Maya Torres', 'maya.torres@example.com', '(555) 012-3319', '92 Cedar Lane'],
      ['Blue Ridge Builders', 'orders@blueridgebuilders.com', '(555) 013-6202', '300 Foundation Way'],
      ['Parker & Sons Maintenance', 'desk@parkersons.com', '(555) 013-0198', '67 Palmer Street'],
      ['Elena Brooks', 'elena.brooks@example.com', '(555) 014-0088', '24 Willow Bend'],
      ['Keystone Rental Homes', 'repairs@keystonerentals.com', '(555) 015-8120', '1436 West Canal Road'],
      ['Mateo Jimenez', 'mateo.jimenez@example.com', '(555) 016-2147', '9 Garden Square'],
    ].map(([name, email, phone, address]) =>
      prisma.client.upsert({
        where: { email },
        update: { name, phone, address },
        create: { name, email, phone, address },
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
