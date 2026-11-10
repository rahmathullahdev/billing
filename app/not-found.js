import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-message">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Link href="/dashboard" className="not-found-button">
            Back to Dashboard
          </Link>
          <Link
            href="/login"
            className="not-found-button"
            style={{ backgroundColor: '#e2e8f0', color: '#002142' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
