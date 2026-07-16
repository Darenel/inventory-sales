import { SortDir } from '../lib/types';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortDir?: SortDir;
  onSort?: (sortBy: string, sortDir: SortDir) => void;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage = 'No records found.',
  sortBy,
  sortDir = 'asc',
  onSort,
  onRowClick,
}: DataTableProps<T>) {
  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || !onSort) {
      return;
    }

    onSort(column.key, sortBy === column.key && sortDir === 'asc' ? 'desc' : 'asc');
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {column.sortable ? (
                  <button className="sort-button" type="button" onClick={() => handleSort(column)}>
                    {column.header}
                    <span aria-hidden="true">{sortBy === column.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>Loading...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={onRowClick ? 'clickable-row' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
