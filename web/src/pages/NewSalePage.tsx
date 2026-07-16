import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleGate } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { SearchInput } from '../components/SearchInput';
import { api } from '../lib/api';
import { Client, ListResponse, Product, Sale } from '../lib/types';
import { formatCurrency, formatDate } from '../utils/format';
import { buildQuery, toErrorMessage } from './pageUtils';

type CartLine = {
  product: Product;
  qty: number;
};

export function NewSalePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);

  const products = useQuery({
    queryKey: ['products', 'sale-picker', search],
    queryFn: () => api<ListResponse<Product>>(`/products${buildQuery({ limit: 10, search, sortBy: 'name', sortDir: 'asc' })}`),
  });

  const clients = useQuery({
    queryKey: ['clients', 'options'],
    queryFn: () => api<ListResponse<Client>>('/clients?limit=100&sortBy=name&sortDir=asc'),
  });

  const clientNames = useMemo(
    () => new Map((clients.data?.data ?? []).map((client) => [client.id, client.name])),
    [clients.data?.data],
  );

  const total = cart.reduce((sum, line) => sum + Number(line.product.price) * line.qty, 0);

  const createSale = useMutation({
    mutationFn: () =>
      api<Sale>('/sales', {
        method: 'POST',
        body: {
          clientId: clientId || undefined,
          items: cart.map((line) => ({ productId: line.product.id, qty: line.qty })),
        },
      }),
    onSuccess: async (sale) => {
      setCreatedSale(sale);
      setCart([]);
      setClientId('');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
      ]);
    },
    onError: (caught) => setError(toErrorMessage(caught)),
  });

  const productColumns: DataTableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', render: (product) => product.sku },
    { key: 'name', header: 'Name', render: (product) => product.name },
    { key: 'price', header: 'Price', render: (product) => formatCurrency(product.price) },
    { key: 'stock', header: 'Stock', render: (product) => product.stock },
    {
      key: 'actions',
      header: '',
      render: (product) => (
        <button type="button" className="ghost" disabled={product.stock <= 0} onClick={() => addProduct(product)}>
          Add
        </button>
      ),
    },
  ];

  function addProduct(product: Product) {
    setCreatedSale(null);
    setError(null);
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, qty: Math.min(line.qty + 1, product.stock) } : line,
        );
      }
      return [...current, { product, qty: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    setCart((current) =>
      current.map((line) =>
        line.product.id === productId
          ? { ...line, qty: Math.max(1, Math.min(qty || 1, line.product.stock)) }
          : line,
      ),
    );
  }

  function removeLine(productId: string) {
    setCart((current) => current.filter((line) => line.product.id !== productId));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Add at least one product.');
      return;
    }

    createSale.mutate();
  }

  return (
    <RoleGate allow={['admin', 'vendedor']}>
      <section className="module-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Sales</p>
            <h1>New sale</h1>
          </div>
          <Link className="button ghost" to="/sales">Back to sales</Link>
        </header>

        {createdSale ? (
          <div className="panel success-panel">
            <h2>Sale created</h2>
            <p>
              Sale {createdSale.id.slice(0, 8)} was created on {formatDate(createdSale.createdAt)} for {formatCurrency(createdSale.total)}.
            </p>
          </div>
        ) : null}

        <div className="sale-layout">
          <div className="panel module-panel">
            <div className="toolbar">
              <SearchInput value={search} onChange={setSearch} placeholder="Search products" />
            </div>
            <DataTable columns={productColumns} rows={products.data?.data ?? []} getRowKey={(product) => product.id} loading={products.isLoading} />
          </div>

          <form className="panel module-panel cart-panel" onSubmit={handleSubmit}>
            <FormField label="Client" as="select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Walk-in</option>
              {(clients.data?.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </FormField>

            <div className="cart-lines">
              {cart.length === 0 ? <p className="muted-text">No products added.</p> : null}
              {cart.map((line) => (
                <div className="cart-line" key={line.product.id}>
                  <div>
                    <strong>{line.product.sku}</strong>
                    <span>{line.product.name}</span>
                    <small>{formatCurrency(line.product.price)} each</small>
                  </div>
                  <input type="number" min="1" max={line.product.stock} value={line.qty} onChange={(event) => setQty(line.product.id, Number(event.target.value))} aria-label={`Quantity for ${line.product.name}`} />
                  <strong>{formatCurrency(Number(line.product.price) * line.qty)}</strong>
                  <button type="button" className="ghost danger-text" onClick={() => removeLine(line.product.id)}>Remove</button>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {error ? <div className="error-box">{error}</div> : null}
            {clientId ? <p className="muted-text">Client: {clientNames.get(clientId)}</p> : null}

            <button type="submit" className="primary" disabled={createSale.isPending}>
              {createSale.isPending ? 'Creating...' : 'Create sale'}
            </button>
          </form>
        </div>
      </section>
    </RoleGate>
  );
}
