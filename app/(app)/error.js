'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-state-container">
      <div className="error-state-card">
        <div className="error-state-icon">
          <i className="bi bi-exclamation-octagon-fill" aria-hidden="true"></i>
        </div>
        <h2>Something went wrong</h2>
        <p>We couldn&apos;t load this page. Your data is safe — try again or head back to the dashboard.</p>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <button type="button" className="btn btn-primary fw-semibold" onClick={() => retry()}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-outline-secondary fw-semibold">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
