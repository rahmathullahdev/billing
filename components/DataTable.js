'use client';
import EmptyState from './EmptyState';
import { TableSkeletonRows } from './Skeleton';

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, i) => row?.id ?? row?._id ?? i,
  loading = false,
  emptyIcon = 'bi-inbox',
  emptyTitle = 'No records found',
  emptyMessage = '',
  emptyAction = null,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  minWidth = '800px',
  className = '',
  skeletonRows = 5,
}) {
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
  const keys = rows.map((row, i) => rowKey(row, i));
  const allSelected = selectable && keys.length > 0 && keys.every((k) => selected.has(k));
  const someSelected = selectable && keys.some((k) => selected.has(k));
  const colSpan = columns.length + (selectable ? 1 : 0);

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(keys));
  };

  const toggleRow = (key) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  return (
    <div className="table-responsive border rounded-3 shadow-sm bg-white mb-3">
      <table className={`table app-table align-middle mb-0 ${className}`} style={{ minWidth }}>
        <thead>
          <tr>
            {selectable && (
              <th className="th-center" style={{ width: 44 }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} className={col.className || ''} style={col.style}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows rows={skeletonRows} columns={columns.length} selectable={selectable} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-0">
                <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} action={emptyAction} />
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const key = keys[i];
              return (
                <tr key={key} className={`table-row-hover ${selected.has(key) ? 'row-selected' : ''}`}>
                  {selectable && (
                    <td className="td-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                        aria-label={`Select row ${i + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.className || ''} style={col.style}>
                      {col.render ? col.render(row, i) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
