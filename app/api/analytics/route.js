import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/analytics?filter=month&startDate=...&endDate=...
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'month';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  try {
    const today = new Date();
    let start, end;
    if (filter === 'week') { start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]; end = today.toISOString().split('T')[0]; }
    else if (filter === 'month') { start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`; end = today.toISOString().split('T')[0]; }
    else if (filter === 'year') { start = `${today.getFullYear()}-01-01`; end = today.toISOString().split('T')[0]; }
    else if (startDate && endDate) { start = startDate; end = endDate; }
    else { start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`; end = today.toISOString().split('T')[0]; }

    const bills = await sanityClient.fetch(`*[_type == "bill" && date >= "${start}" && date <= "${end}"] | order(date asc)`);

    // Daily revenue chart data
    const dailyMap = {};
    bills.forEach(b => {
      const d = b.date;
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, count: 0 };
      dailyMap[d].revenue += b.total || 0;
      dailyMap[d].count += 1;
    });
    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Payment mode breakdown
    const paymentMap = {};
    bills.forEach(b => {
      const mode = b.payment || 'Cash';
      paymentMap[mode] = (paymentMap[mode] || 0) + (b.total || 0);
    });
    const paymentData = Object.entries(paymentMap).map(([mode, amount]) => ({ mode, amount }));

    // Employee performance
    const empMap = {};
    bills.forEach(b => {
      if (b.employee) {
        if (!empMap[b.employee]) empMap[b.employee] = { name: b.employee, revenue: 0, bills: 0 };
        empMap[b.employee].revenue += b.total || 0;
        empMap[b.employee].bills += 1;
      }
    });
    const employeeData = Object.values(empMap).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      data: {
        totalRevenue: bills.reduce((s, b) => s + (b.total || 0), 0),
        totalBills: bills.length,
        dailyData,
        paymentData,
        employeeData,
        dateRange: { start, end, filter },
      }
    });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
