import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Generate unique IDs for entities
export function generateId(prefix = '') {
  return prefix + nanoid(10);
}

// Standard API response helpers
export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Pagination helper for Sanity arrays
export function paginate(items, page = 0, size = 10) {
  const start = page * size;
  const end = start + size;
  return {
    content: items.slice(start, end),
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    number: page,
    size,
    first: page === 0,
    last: end >= items.length,
  };
}

// Format date to YYYY-MM-DD
export function toDateStr(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

// Simple ID generator without nanoid dependency
export function simpleId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
