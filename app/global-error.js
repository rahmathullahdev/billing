'use client';

export default function GlobalError({ error, retry }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: '100%',
            textAlign: 'center',
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: 44, color: '#e64051', marginBottom: 12 }}>⚠</div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Application error</h1>
          <p style={{ color: '#64748b', margin: '0 0 20px' }}>
            Something unexpected happened. Please reload the app.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: '#002142',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
