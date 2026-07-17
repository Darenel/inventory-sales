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
import { Category, ListResponse, SortDir } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, pageLimit, toErrorMessage } from './pageUtils';

type FormState = {
  name: string;
};

const emptyForm: FormState = { name: '' };

export function CategoriesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = useQuery({
    queryKey: ['categories', { page, search, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<Category>>(
        `/categories${buildQuery({ page, limit: pageLimit, search, sortBy, sortDir })}`,
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: FormState) => {
      const body = { name: payload.name.trim() };
      return editing
        ? api<Category>(`/categories/${editing.id}`, { method: 'PATCH', body })
        : api<Category>('/categories', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => api<void>(`/categories/${category.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error, t('common.requestFailed'))),
  });

  const columns: DataTableColumn<Category>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (category) => category.name },
    { key: 'createdAt', header: t('common.created'), sortable: true, render: (category) => formatDate(category.createdAt) },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (category) => (
        <RoleGate allow={['admin', 'almacen']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(category)}>{t('common.edit')}</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(category)}>{t('common.delete')}</button>
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

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(false);
  }

  function openDelete(category: Category) {
    setDeleteTarget(category);
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
          <h1>{t('page.categories.title')}</h1>
        </div>
        <RoleGate allow={['admin', 'almacen']}>
          <button type="button" className="primary" onClick={openCreate}>{t('catalog.newCategory')}</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t('search.categories')} />
        </div>
        <DataTable
          columns={columns}
          rows={categories.data?.data ?? []}
          getRowKey={(category) => category.id}
          loading={categories.isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }}
        />
        <Pagination page={page} limit={categories.data?.limit ?? pageLimit} total={categories.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? t('catalog.editCategory') : t('catalog.newCategory')} onClose={closeForm}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <FormField label={t('common.name')} value={form.name} onChange={(event) => setForm({ name: event.target.value })} error={formError ?? undefined} required />
          </div>
          <footer className="modal-actions">
            <button type="button" className="ghost" onClick={closeForm}>{t('common.cancel')}</button>
            <button type="submit" className="primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? t('common.saving') : t('common.save')}</button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('delete.categoryMessage')}
        message={`${t('common.delete')} ${deleteTarget?.name ?? t('delete.categoryFallback')}?`}
        loading={deleteMutation.isPending}
        error={deleteError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </section>
  );
}
