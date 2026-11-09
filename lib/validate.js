// Shared input validation / sanitization helpers for API routes.

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanString(value, { max = 500 } = {}) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, '').trim().slice(0, max);
}

export function isEmail(value) {
  if (typeof value !== 'string') return false;
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value) {
  if (typeof value !== 'string') return false;
  return /^[0-9+\-()\s]{6,20}$/.test(value.trim());
}

export function toNumber(value, { min = -Infinity, max = Infinity, fallback = 0 } = {}) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function toInt(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
  const n = typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function isStrongPassword(value) {
  if (typeof value !== 'string') return false;
  return value.length >= 8 && value.length <= 128;
}

export function validateUserInput(body, { requirePassword = false } = {}) {
  const username = cleanString(body?.username, { max: 80 });
  const email = cleanString(body?.email, { max: 254 }).toLowerCase();
  const role = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'].includes(body?.role)
    ? body.role
    : 'ROLE_USER';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username) return { error: 'Username is required' };
  if (!isEmail(email)) return { error: 'A valid email is required' };
  if (requirePassword && !isStrongPassword(password)) {
    return { error: 'Password must be between 8 and 128 characters' };
  }
  if (password && !isStrongPassword(password)) {
    return { error: 'Password must be between 8 and 128 characters' };
  }

  return {
    error: null,
    data: {
      username,
      email,
      role,
      password,
      isActive: body?.isActive !== false,
      branchName: cleanString(body?.branchName, { max: 120 }),
      branchId: cleanString(body?.branchId, { max: 120 }),
    },
  };
}

export function cleanDate(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return '';
  const d = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return trimmed;
}

export function cleanParticulars(input) {
  let arr = input;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 200).map((p) => {
    const qty = toNumber(p?.qty, { min: 0, max: 1e6, fallback: 1 });
    const price = toNumber(p?.price, { min: 0, max: 1e9, fallback: 0 });
    return {
      particularId: cleanString(p?.particularId || p?.id, { max: 80 }),
      name: cleanString(p?.name || p?.particularName, { max: 200 }),
      qty: qty > 0 ? qty : 1,
      price,
      total_price: Number((qty > 0 ? qty : 1) * price),
    };
  });
}

export function validateCustomerInput(body) {
  const name = cleanString(body?.name, { max: 160 });
  const email = cleanString(body?.email, { max: 254 }).toLowerCase();
  const phoneNumber = cleanString(body?.phoneNumber, { max: 20 });

  if (!name) return { error: 'Customer name is required' };
  if (email && !isEmail(email)) return { error: 'A valid email is required' };
  if (!phoneNumber || !isPhone(phoneNumber)) return { error: 'A valid phone number is required' };

  return {
    error: null,
    data: {
      name,
      email,
      phoneNumber,
      companyName: cleanString(body?.companyName, { max: 160 }),
      taxNumber: cleanString(body?.taxNumber, { max: 40 }),
      address: cleanString(body?.address, { max: 500 }),
      creditAmount: toNumber(body?.creditAmount, { min: 0, max: 1e12 }),
      isActive: body?.isActive !== false,
    },
  };
}
