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
import { Client, ListResponse, SortDir } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, optionalValue, pageLimit, toErrorMessage } from './pageUtils';

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: ClientForm = { name: '', email: '', phone: '', address: '' };

export function ClientsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const clients = useQuery({
    queryKey: ['clients', { page, search, sortBy, sortDir }],
    queryFn: () => api<ListResponse<Client>>(`/clients${buildQuery({ page, limit: pageLimit, search, sortBy, sortDir })}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ClientForm) => {
      const body = {
        name: payload.name.trim(),
        email: optionalValue(payload.email),
        phone: optionalValue(payload.phone),
        address: optionalValue(payload.address),
      };
      return editing
        ? api<Client>(`/clients/${editing.id}`, { method: 'PATCH', body })
        : api<Client>('/clients', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (client: Client) => api<void>(`/clients/${client.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const columns: DataTableColumn<Client>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (client) => client.name },
    { key: 'email', header: t('common.email'), sortable: true, render: (client) => client.email ?? '-' },
    { key: 'phone', header: t('common.phone'), render: (client) => client.phone ?? '-' },
    { key: 'createdAt', header: t('common.created'), sortable: true, render: (client) => formatDate(client.createdAt) },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (client) => (
        <RoleGate allow={['admin', 'vendedor']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(client)}>{t('common.edit')}</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(client)}>{t('common.delete')}</button>
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

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
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

  function openDelete(client: Client) {
    setDeleteTarget(client);
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
          <p className="eyebrow">{t('module.sales')}</p>
          <h1>{t('page.clients.title')}</h1>
        </div>
        <RoleGate allow={['admin', 'vendedor']}>
          <button type="button" className="primary" onClick={openCreate}>{t('catalog.newClient')}</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t('search.clients')} />
        </div>
        <DataTable columns={columns} rows={clients.data?.data ?? []} getRowKey={(client) => client.id} loading={clients.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
        <Pagination page={page} limit={clients.data?.limit ?? pageLimit} total={clients.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? t('catalog.editClient') : t('catalog.newClient')} onClose={closeForm}>
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

      <ConfirmDialog open={Boolean(deleteTarget)} title={t('delete.clientMessage')} message={`${t('common.delete')} ${deleteTarget?.name ?? t('delete.clientFallback')}?`} loading={deleteMutation.isPending} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} />
    </section>
  );
}
