import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday 00:00 of the current week (Monday = 0)
function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
  const m = new Date(d);
  m.setDate(m.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

// Sunday 00:00 of the current week
function endOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
  const e = new Date(d);
  e.setDate(e.getDate() + (6 - day));
  e.setHours(0, 0, 0, 0);
  return e;
}

function round2(n) {
  return Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
}

// Mirrors the old backend DateFilterService.getDateRange() presented via
// GET /dashboard/bills-dashboard.
function getDateRange(filter, startDate, endDate) {
  const now = new Date();
  const f = (filter || 'today').toLowerCase();
  let start;
  let end;

  if (f === 'yesterday') {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    end = new Date(start);
  } else if (f === 'this_week') {
    start = startOfWeek(now);
    end = endOfWeek(now);
  } else if (f === 'last_week') {
    const thisMonday = startOfWeek(now);
    start = new Date(thisMonday);
    start.setDate(start.getDate() - 7);
    end = new Date(thisMonday);
    end.setDate(end.getDate() - 1);
  } else if (f === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (f === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (f === 'this_year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  } else if (f === 'custom_range' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // today (and default)
    start = now;
    end = now;
  }

  return { start: toDateStr(start), end: toDateStr(end) };
}

// GET /api/analytics?filter=today|yesterday|this_week|last_week|this_month|last_month|this_year|custom_range&startDate=&endDate=
// Mirrors old backend GET /dashboard/bills-dashboard response shape:
// { data: { kpi, last7DaysSales[], customerWiseData[], employeeWiseData[], paymentWiseData{} } }
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today';
    const startDateParam = searchParams.get('startDate') || '';
    const endDateParam = searchParams.get('endDate') || '';

    const { start, end } = getDateRange(filter, startDateParam, endDateParam);

    const bills = await sanityClient.fetch(
      `*[_type == "bill" && date >= $start && date <= $end]`,
      { start, end }
    );

    const statusOf = (b) => String(b.billStatus || '').toUpperCase();

    // KPIs (mirror DashboardController.getBillsDashboard)
    const kpi = {
      todayOrderCount: bills.length,
      todayCreditOrderCount: bills.filter(b => statusOf(b) === 'CREDIT').length,
      totalAmount: round2(bills.reduce((s, b) => s + (Number(b.total) || 0), 0)),
      paidAmount: round2(bills.reduce((s, b) => s + (Number(b.totalPaid) || 0), 0)),
      creditAmount: round2(bills.reduce((s, b) => s + (Number(b.creditAmount) || 0), 0)),
      completedOrders: bills.filter(b => statusOf(b) === 'PAID').length,
    };

    // Customer-wise sales (GROUP BY customerName, fallback 'Unknown')
    const customerMap = {};
    bills.forEach(b => {
      const key = b.customerName || 'Unknown';
      customerMap[key] = (customerMap[key] || 0) + (Number(b.total) || 0);
    });
    const customerWiseData = Object.keys(customerMap)
      .map(customer => ({ customer, totalAmount: round2(customerMap[customer]) }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Employee-wise sales (GROUP BY employee, fallback 'Unknown')
    const employeeMap = {};
    bills.forEach(b => {
      const key = b.employee || 'Unknown';
      employeeMap[key] = (employeeMap[key] || 0) + (Number(b.total) || 0);
    });
    const employeeWiseData = Object.keys(employeeMap)
      .map(employeeName => ({ employeeName, totalAmount: round2(employeeMap[employeeName]) }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Payment-wise sales (GROUP BY UPPER(payment), fallback 'UNKNOWN', SUM totalPaid)
    const paymentWiseData = {};
    bills.forEach(b => {
      const key = b.payment ? String(b.payment).toUpperCase() : 'UNKNOWN';
      paymentWiseData[key] = round2((paymentWiseData[key] || 0) + (Number(b.totalPaid) || 0));
    });

    // Rolling last 7 days (today-6 .. today) - independent of the active filter
    const todayLd = new Date();
    const last7Start = new Date(todayLd);
    last7Start.setDate(last7Start.getDate() - 6);
    const dateMap = {};
    bills.forEach(b => {
      if (b.date) dateMap[b.date] = (dateMap[b.date] || 0) + (Number(b.total) || 0);
    });
    const last7DaysSales = [];
    const cursor = new Date(last7Start);
    for (let i = 0; i < 7; i++) {
      const ds = toDateStr(cursor);
      last7DaysSales.push({
        date: ds,
        day: cursor.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
        amount: round2(dateMap[ds] || 0),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return NextResponse.json({
      data: { kpi, last7DaysSales, customerWiseData, employeeWiseData, paymentWiseData },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}