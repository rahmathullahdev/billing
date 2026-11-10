'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandPalette({ items = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [item.label, item.group, item.keywords].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]');
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const run = (item) => {
    if (!item) return;
    setOpen(false);
    if (item.href) router.push(item.href);
    else item.action?.();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[activeIndex]);
    }
  };

  return (
    <>
      <button
        type="button"
        className="command-fab"
        onClick={() => setOpen(true)}
        title="Open command palette (Ctrl+K)"
        aria-label="Open command palette"
      >
        <i className="bi bi-search" aria-hidden="true"></i>
        <span className="command-fab-label">Search</span>
        <kbd className="command-fab-kbd">Ctrl K</kbd>
      </button>

      {open && (
        <div className="command-overlay" onClick={() => setOpen(false)}>
          <div
            className="command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="command-search-row">
              <i className="bi bi-search command-search-icon" aria-hidden="true"></i>
              <input
                ref={inputRef}
                type="text"
                className="command-input"
                placeholder="Search pages and actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-label="Search commands"
              />
              <kbd className="command-esc">Esc</kbd>
            </div>

            <div className="command-results" ref={listRef}>
              {results.length === 0 ? (
                <div className="command-empty">
                  <i className="bi bi-search" aria-hidden="true"></i>
                  <p>No results for “{query}”</p>
                </div>
              ) : (
                results.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.href || item.label}-${index}`}
                    className={`command-item ${index === activeIndex ? 'is-active' : ''}`}
                    data-active={index === activeIndex ? 'true' : 'false'}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => run(item)}
                  >
                    <span className="command-item-icon">
                      <i className={`bi ${item.icon || 'bi-arrow-right-short'}`} aria-hidden="true"></i>
                    </span>
                    <span className="command-item-body">
                      <span className="command-item-label">{item.label}</span>
                      {item.group ? <span className="command-item-group">{item.group}</span> : null}
                    </span>
                    <i className="bi bi-arrow-return-left command-item-enter" aria-hidden="true"></i>
                  </button>
                ))
              )}
            </div>

            <div className="command-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
              <span><kbd>↵</kbd> open</span>
              <span><kbd>Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
