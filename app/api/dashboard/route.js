import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function getDateRange(filter, startDate, endDate) {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  switch (filter) {
    case 'today': return { start: today, end: today };
    case 'yesterday': { const yd = new Date(Date.now() - 86400000).toISOString().split('T')[0]; return { start: yd, end: yd }; }
    case 'last_7_days': return { start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], end: today };
    case 'last_30_days': return { start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], end: today };
    case 'this_month': { const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; return { start: ms, end: today }; }
    case 'this_year': return { start: `${d.getFullYear()}-01-01`, end: today };
    case 'custom': return { start: startDate || today, end: endDate || today };
    default: return { start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], end: today };
  }
}

// GET /api/dashboard?filter=today&startDate=...&endDate=...&paymentType=...
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'last_30_days';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const paymentType = searchParams.get('paymentType') || '';

  try {
    const { start, end } = getDateRange(filter, startDate, endDate);

    // Fetch bills in range
    let query = `*[_type == "bill" && date >= "${start}" && date <= "${end}"`;
    if (paymentType) query += ` && payment == "${paymentType}"`;
    query += `] | order(createdAt desc)`;

    const bills = await sanityClient.fetch(query);

    // Calculate stats
    const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
    const totalBills = bills.length;
    const paidBills = bills.filter(b => b.billStatus === 'PAID').length;
    const creditBills = bills.filter(b => b.billStatus === 'CREDIT').length;
    const totalCredit = bills.reduce((s, b) => s + (b.creditAmount || 0), 0);
    const totalPaid = bills.reduce((s, b) => s + (b.totalPaid || 0), 0);

    // Payment breakdown
    const paymentBreakdown = bills.reduce((acc, b) => {
      const mode = (b.payment || 'Cash').toUpperCase();
      acc[mode] = (acc[mode] || 0) + (b.totalPaid || 0);
      return acc;
    }, {});

    // Top employee
    const empRevenue = bills.reduce((acc, b) => {
      if (b.employee) acc[b.employee] = (acc[b.employee] || 0) + (b.total || 0);
      return acc;
    }, {});
    const topEmployee = Object.entries(empRevenue).sort((a, b) => b[1] - a[1])[0] || null;

    // Recent orders formatted
    const recentOrders = bills.slice(0, 50).map(b => ({
      orderId: b._id,
      billNumber: b.billNumber,
      customerName: b.customerName,
      phoneNumber: b.customerMobileNo,
      username: b.employee,
      grandTotal: b.total,
      paymentMethod: b.payment,
      paymentDetails: { status: b.billStatus },
      createdAt: b.createdAt,
      items: b.particularsJson ? JSON.parse(b.particularsJson) : [],
    }));

    // Today stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = await sanityClient.fetch(
      `*[_type == "bill" && date == "${todayStr}"]{ total, totalPaid, billStatus }`
    );
    const todayRevenue = todayBills.reduce((s, b) => s + (b.total || 0), 0);
    const todayCount = todayBills.length;

    // Total customers
    const totalCustomers = await sanityClient.fetch(`count(*[_type == "customer" && isActive == true])`);

    return NextResponse.json({
      data: {
        totalRevenue,
        totalBills,
        paidBills,
        creditBills,
        totalCredit,
        totalPaid,
        paymentBreakdown,
        topEmployee: topEmployee ? { username: topEmployee[0], revenue: topEmployee[1] } : null,
        recentOrders,
        todayRevenue,
        todayCount,
        totalCustomers,
        dateRange: { start, end, filter },
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
