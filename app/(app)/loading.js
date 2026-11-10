import { Skeleton } from '@/components/Skeleton';

export default function AppLoading() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading page">
      <div className="page-skeleton-header">
        <Skeleton width={44} height={44} radius={12} />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="62%" height={12} />
        </div>
      </div>

      <div className="page-skeleton-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="page-skeleton-card">
            <Skeleton width="50%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={26} />
          </div>
        ))}
      </div>

      <div className="page-skeleton-table">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="page-skeleton-row">
            <Skeleton width="8%" height={12} />
            <Skeleton width="30%" height={12} />
            <Skeleton width="20%" height={12} />
            <Skeleton width="16%" height={12} />
            <Skeleton width="12%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}
