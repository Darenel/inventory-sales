import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleGate } from '../auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { SearchInput } from '../components/SearchInput';
import { useI18n } from '../i18n/I18nContext';
import { api } from '../lib/api';
import { Category, ListResponse, Product, SortDir, Supplier } from '../lib/types';
import { formatCurrency } from '../utils/format';
import { buildQuery, pageLimit, toErrorMessage } from './pageUtils';

type ProductForm = {
  sku: string;
  name: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  categoryId: string;
  supplierId: string;
};

const emptyForm: ProductForm = {
  sku: '',
  name: '',
  price: '0',
  cost: '0',
  stock: '0',
  minStock: '0',
  categoryId: '',
  supplierId: '',
};

export function ProductsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ['products', { page, search, categoryId, lowStock, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<Product>>(
        `/products${buildQuery({ page, limit: pageLimit, search, categoryId, lowStock: lowStock || undefined, sortBy, sortDir })}`,
      ),
  });

  const categories = useQuery({
    queryKey: ['categories', 'options'],
    queryFn: () => api<ListResponse<Category>>('/categories?limit=100&sortBy=name&sortDir=asc'),
  });

  const suppliers = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => api<ListResponse<Supplier>>('/suppliers?limit=100&sortBy=name&sortDir=asc'),
  });

  const categoryNames = useMemo(
    () => new Map((categories.data?.data ?? []).map((category) => [category.id, category.name])),
    [categories.data?.data],
  );
  const supplierNames = useMemo(
    () => new Map((suppliers.data?.data ?? []).map((supplier) => [supplier.id, supplier.name])),
    [suppliers.data?.data],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: ProductForm) => {
      const body = {
        sku: payload.sku.trim(),
        name: payload.name.trim(),
        price: Number(payload.price),
        cost: Number(payload.cost),
        stock: Number(payload.stock),
        minStock: Number(payload.minStock),
        categoryId: payload.categoryId,
        supplierId: payload.supplierId,
      };
      return editing
        ? api<Product>(`/products/${editing.id}`, { method: 'PATCH', body })
        : api<Product>('/products', { method: 'POST', body });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
      ]);
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (product: Product) => api<void>(`/products/${product.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
      ]);
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const columns: DataTableColumn<Product>[] = [
    { key: 'sku', header: t('common.sku'), sortable: true, render: (product) => product.sku },
    { key: 'name', header: t('common.name'), sortable: true, render: (product) => product.name },
    { key: 'category', header: t('common.category'), render: (product) => categoryNames.get(product.categoryId) ?? product.categoryId },
    { key: 'price', header: t('common.price'), sortable: true, render: (product) => formatCurrency(product.price) },
    {
      key: 'stock',
      header: t('common.stock'),
      sortable: true,
      render: (product) => (
        <span className={product.stock <= product.minStock ? 'badge badge-coral' : 'badge'}>
          {product.stock} / {product.minStock}
        </span>
      ),
    },
    { key: 'supplier', header: t('common.supplier'), render: (product) => supplierNames.get(product.supplierId) ?? product.supplierId },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (product) => (
        <RoleGate allow={['admin', 'almacen']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(product)}>{t('common.edit')}</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(product)}>{t('common.delete')}</button>
          </div>
        </RoleGate>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories.data?.data[0]?.id ?? '',
      supplierId: suppliers.data?.data[0]?.id ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      cost: product.cost,
      stock: String(product.stock),
      minStock: String(product.minStock),
      categoryId: product.categoryId,
      supplierId: product.supplierId,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(false);
  }

  function openDelete(product: Product) {
    setDeleteTarget(product);
    setDeleteError(null);
  }

  function setField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    if (!form.sku.trim()) {
      return t('validation.skuRequired');
    }
    if (!form.name.trim()) {
      return t('validation.nameRequired');
    }
    if (!form.categoryId) {
      return t('validation.categoryRequired');
    }
    if (!form.supplierId) {
      return t('validation.supplierRequired');
    }

    const numberFields: Array<keyof ProductForm> = ['price', 'cost', 'stock', 'minStock'];
    for (const field of numberFields) {
      const value = Number(form[field]);
      if (!Number.isFinite(value) || value < 0) {
        return t('validation.numbersNonNegative');
      }
    }

    if (!Number.isInteger(Number(form.stock)) || !Number.isInteger(Number(form.minStock))) {
      return t('validation.stockWholeNumbers');
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();
    setFormError(validationError);

    if (!validationError) {
      saveMutation.mutate(form);
    }
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('page.catalog')}</p>
          <h1>{t('page.products.title')}</h1>
        </div>
        <RoleGate allow={['admin', 'almacen']}>
          <button type="button" className="primary" onClick={openCreate}>{t('catalog.newProduct')}</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t('search.products')} />
          <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} aria-label={t('common.filterByCategory')}>
            <option value="">{t('common.allCategories')}</option>
            {(categories.data?.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <label className="inline-check">
            <input type="checkbox" checked={lowStock} onChange={(event) => { setLowStock(event.target.checked); setPage(1); }} />
            {t('catalog.lowStock')}
          </label>
        </div>
        <DataTable columns={columns} rows={products.data?.data ?? []} getRowKey={(product) => product.id} loading={products.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
        <Pagination page={page} limit={products.data?.limit ?? pageLimit} total={products.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? t('catalog.editProduct') : t('catalog.newProduct')} onClose={closeForm} size="wide">
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid form-grid-2">
            <FormField label={t('common.sku')} value={form.sku} onChange={(event) => setField('sku', event.target.value)} required />
            <FormField label={t('common.name')} value={form.name} onChange={(event) => setField('name', event.target.value)} required />
            <FormField label={t('common.price')} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setField('price', event.target.value)} required />
            <FormField label={t('common.cost')} type="number" min="0" step="0.01" value={form.cost} onChange={(event) => setField('cost', event.target.value)} required />
            <FormField label={t('common.stock')} type="number" min="0" step="1" value={form.stock} onChange={(event) => setField('stock', event.target.value)} required />
            <FormField label={t('catalog.minimumStock')} type="number" min="0" step="1" value={form.minStock} onChange={(event) => setField('minStock', event.target.value)} required />
            <FormField label={t('common.category')} as="select" value={form.categoryId} onChange={(event) => setField('categoryId', event.target.value)} required>
              <option value="">{t('common.selectCategory')}</option>
              {(categories.data?.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </FormField>
            <FormField label={t('common.supplier')} as="select" value={form.supplierId} onChange={(event) => setField('supplierId', event.target.value)} required>
              <option value="">{t('common.selectSupplier')}</option>
              {(suppliers.data?.data ?? []).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </FormField>
            {formError ? <div className="error-box full-span">{formError}</div> : null}
          </div>
          <footer className="modal-actions">
            <button type="button" className="ghost" onClick={closeForm}>{t('common.cancel')}</button>
            <button type="submit" className="primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? t('common.saving') : t('common.save')}</button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title={t('delete.productMessage')} message={`${t('common.delete')} ${deleteTarget?.name ?? t('delete.productFallback')}?`} loading={deleteMutation.isPending} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} />
    </section>
  );
}
