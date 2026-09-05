import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// Master list of every route identifier the app navigation checks.
// Admin always has access; these defaults are the "factory" policy.
const DEFAULT_RULES = [
  { page: 'DASHBOARD', admin: true, manager: true, employee: true },
  { page: 'EXPLORE', admin: true, manager: true, employee: true },
  { page: 'BILLS_CREATE', admin: true, manager: true, employee: true },
  { page: 'BILLS_EDIT', admin: true, manager: true, employee: false },
  { page: 'BILLS_ALL', admin: true, manager: true, employee: true },
  { page: 'BILLS_TODAY', admin: true, manager: true, employee: true },
  { page: 'ORDERS', admin: true, manager: true, employee: false },
  { page: 'CREDITS', admin: true, manager: true, employee: false },
  { page: 'CATEGORY', admin: true, manager: true, employee: false },
  { page: 'USERS', admin: true, manager: false, employee: false },
  { page: 'BRANCHES', admin: true, manager: false, employee: false },
  { page: 'CUSTOMERS', admin: true, manager: true, employee: false },
  { page: 'CUSTOMER_VIEW', admin: true, manager: true, employee: true },
  { page: 'ITEMS', admin: true, manager: true, employee: false },
  { page: 'MACHINE_CATEGORY', admin: true, manager: true, employee: false },
  { page: 'MACHINE', admin: true, manager: true, employee: false },
  { page: 'PAPER_CATEGORY', admin: true, manager: true, employee: false },
  { page: 'PAPER_GROUP', admin: true, manager: true, employee: false },
  { page: 'PAPER', admin: true, manager: true, employee: false },
  { page: 'PARTICULARS', admin: true, manager: true, employee: false },
  { page: 'EMPLOYEES', admin: true, manager: false, employee: false },
  { page: 'EMPLOYEE_VIEW', admin: true, manager: true, employee: true },
  { page: 'EXPENSE_ITEM', admin: true, manager: true, employee: false },
  { page: 'DAILY_EXPENSES', admin: true, manager: true, employee: false },
  { page: 'MONTHLY_EXPENSE', admin: true, manager: true, employee: false },
  { page: 'REPORTS_DAILY_EXPENSE', admin: true, manager: true, employee: false },
  { page: 'MANAGE_PAGE_ACCESS', admin: true, manager: false, employee: false },
  { page: 'ANALYTICS', admin: true, manager: true, employee: false },
  { page: 'SETTINGS', admin: true, manager: true, employee: false },
];

async function upsertRule(rule) {
  const existing = await sanityClient.fetch(
    `*[_type == "pageAccess" && page == $page && isActive == true][0]`,
    { page: rule.page }
  );
  if (existing) {
    return sanityClient.patch(existing._id).set({
      admin: rule.admin !== false,
      manager: !!rule.manager,
      employee: !!rule.employee,
      isActive: true,
    }).commit();
  }
  return sanityClient.create({
    _type: 'pageAccess',
    page: rule.page,
    admin: rule.admin !== false,
    manager: !!rule.manager,
    employee: !!rule.employee,
    isActive: true,
  });
}

async function seedDefaultsIfEmpty() {
  const rules = await sanityClient.fetch(`*[_type == "pageAccess" && isActive == true]`);
  if (rules && rules.length > 0) return rules;
  const created = [];
  for (const rule of DEFAULT_RULES) {
    created.push(await upsertRule(rule));
  }
  return created;
}

// GET /api/page-access  — bare array of active rules (consumed by AppContext for nav gating)
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const rules = await seedDefaultsIfEmpty();
    return NextResponse.json(rules);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/page-access  — admin only; create-or-patch one rule or a bulk { rules: [...] }
export async function POST(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const rules = Array.isArray(body.rules) ? body.rules : (Array.isArray(body) ? body : [body]);
    const results = [];
    for (const rule of rules) {
      if (!rule || !rule.page) continue;
      results.push(await upsertRule(rule));
    }
    return NextResponse.json(results, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/page-access  — admin only; bulk update array of { id, admin, manager, employee }
export async function PUT(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const updates = await Promise.all(
      body.map((rule) => sanityClient.patch(rule.id).set({
        admin: rule.admin !== false,
        manager: !!rule.manager,
        employee: !!rule.employee,
        isActive: rule.isActive !== false,
      }).commit())
    );
    return NextResponse.json(updates);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}