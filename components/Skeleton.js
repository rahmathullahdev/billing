export function Skeleton({ width = '100%', height = 14, radius = 6, className = '', style = {} }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ display: 'inline-block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '65%' : '100%'}
          height={12}
          style={{ marginBottom: i === lines - 1 ? 0 : 8 }}
        />
      ))}
    </div>
  );
}

export function TableSkeletonRows({ rows = 5, columns = 6, selectable = false }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="skeleton-row">
      {selectable && (
        <td className="td-center">
          <Skeleton width={16} height={16} radius={4} />
        </td>
      )}
      {Array.from({ length: columns }).map((__, c) => (
        <td key={c} className={c === 0 ? 'td-center' : 'td-left'}>
          <Skeleton width={c === 0 ? 24 : c % 2 === 0 ? '85%' : '60%'} height={12} />
        </td>
      ))}
    </tr>
  ));
}

export default Skeleton;
