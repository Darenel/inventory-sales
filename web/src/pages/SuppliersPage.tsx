import { FormEvent, useState } from 'react';
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
import { ListResponse, SortDir, Supplier } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, optionalValue, pageLimit, toErrorMessage } from './pageUtils';

type SupplierForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: SupplierForm = { name: '', email: '', phone: '', address: '' };

export function SuppliersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const suppliers = useQuery({
    queryKey: ['suppliers', { page, search, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<Supplier>>(`/suppliers${buildQuery({ page, limit: pageLimit, search, sortBy, sortDir })}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SupplierForm) => {
      const body = {
        name: payload.name.trim(),
        email: optionalValue(payload.email),
        phone: optionalValue(payload.phone),
        address: optionalValue(payload.address),
      };
      return editing
        ? api<Supplier>(`/suppliers/${editing.id}`, { method: 'PATCH', body })
        : api<Supplier>('/suppliers', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (supplier: Supplier) => api<void>(`/suppliers/${supplier.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (supplier) => supplier.name },
    { key: 'email', header: t('common.email'), sortable: true, render: (supplier) => supplier.email ?? '-' },
    { key: 'phone', header: t('common.phone'), render: (supplier) => supplier.phone ?? '-' },
    { key: 'createdAt', header: t('common.created'), sortable: true, render: (supplier) => formatDate(supplier.createdAt) },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (supplier) => (
        <RoleGate allow={['admin', 'almacen']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(supplier)}>{t('common.edit')}</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(supplier)}>{t('common.delete')}</button>
          </div>
        </RoleGate>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
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

  function openDelete(supplier: Supplier) {
    setDeleteTarget(supplier);
    setDeleteError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError(t('validation.nameRequired'));
      return;
    }

    saveMutation.mutate(form);
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('page.catalog')}</p>
          <h1>{t('page.suppliers.title')}</h1>
        </div>
        <RoleGate allow={['admin', 'almacen']}>
          <button type="button" className="primary" onClick={openCreate}>{t('catalog.newSupplier')}</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t('search.suppliers')} />
        </div>
        <DataTable columns={columns} rows={suppliers.data?.data ?? []} getRowKey={(supplier) => supplier.id} loading={suppliers.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
        <Pagination page={page} limit={suppliers.data?.limit ?? pageLimit} total={suppliers.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? t('catalog.editSupplier') : t('catalog.newSupplier')} onClose={closeForm}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <FormField label={t('common.name')} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <FormField label={t('common.email')} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <FormField label={t('common.phone')} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <FormField label={t('common.address')} as="textarea" rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            {formError ? <div className="error-box">{formError}</div> : null}
          </div>
          <footer className="modal-actions">
            <button type="button" className="ghost" onClick={closeForm}>{t('common.cancel')}</button>
            <button type="submit" className="primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? t('common.saving') : t('common.save')}</button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title={t('delete.supplierMessage')} message={`${t('common.delete')} ${deleteTarget?.name ?? t('delete.supplierFallback')}?`} loading={deleteMutation.isPending} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} />
    </section>
  );
}
