import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
  const m = new Date(d);
  m.setDate(m.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = parseInt(searchParams.get('size') || '15', 10);
  const dateFilter = searchParams.get('dateFilter') || 'all';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const employeeFilter = searchParams.get('employeeName') || searchParams.get('employee') || '';

  try {
    const bills = await sanityClient.fetch(`*[_type == "bill"]{
      _id,
      employee,
      total,
      totalPaid,
      creditAmount,
      payment,
      date,
      createdAt
    }`);

    const now = new Date();
    const todayStr = toDateStr(now);

    const filteredBills = (bills || []).filter(bill => {
      const bDate = bill.date || (bill.createdAt ? toDateStr(new Date(bill.createdAt)) : '');

      if (employeeFilter && String(bill.employee || '').toLowerCase() !== employeeFilter.toLowerCase()) {
        return false;
      }

      if (dateFilter === 'today') {
        if (bDate !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        const yd = new Date(now);
        yd.setDate(yd.getDate() - 1);
        if (bDate !== toDateStr(yd)) return false;
      } else if (dateFilter === 'this_week') {
        const monday = toDateStr(startOfWeek(now));
        if (bDate < monday || bDate > todayStr) return false;
      } else if (dateFilter === 'last_week') {
        const monday = startOfWeek(now);
        const lastMonday = new Date(monday);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const lmStr = toDateStr(lastMonday);
        const mStr = toDateStr(monday);
        if (bDate < lmStr || bDate >= mStr) return false;
      } else if (dateFilter === 'this_month') {
        const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
        if (bDate < monthStart) return false;
      } else if (dateFilter === 'last_month') {
        const lastMonthStart = toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const thisMonthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
        if (bDate < lastMonthStart || bDate >= thisMonthStart) return false;
      } else if (dateFilter === 'this_year') {
        const yearStart = toDateStr(new Date(now.getFullYear(), 0, 1));
        if (bDate < yearStart) return false;
      } else if (dateFilter === 'custom_range' || (startDate && endDate)) {
        if (startDate && bDate < startDate) return false;
        if (endDate && bDate > endDate) return false;
      }

      return true;
    });

    const empMap = {};

    filteredBills.forEach(bill => {
      const name = (bill.employee || 'Unknown').trim();
      if (!empMap[name]) {
        empMap[name] = {
          employeeName: name,
          totalBillsCount: 0,
          totalAmount: 0,
          creditOrderCount: 0,
          creditAmount: 0,
        };
      }

      empMap[name].totalBillsCount += 1;
      empMap[name].totalAmount += Number(bill.total) || 0;

      const isCredit = String(bill.payment || '').toUpperCase() === 'CREDIT' || Number(bill.creditAmount) > 0;
      if (isCredit) {
        empMap[name].creditOrderCount += 1;
        empMap[name].creditAmount += Number(bill.creditAmount) || 0;
      }
    });

    const allEmployees = Object.values(empMap).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    const totalElements = allEmployees.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const startIdx = page * size;
    const paginatedContent = allEmployees.slice(startIdx, startIdx + size);

    const responsePayload = {
      content: paginatedContent,
      totalPages,
      totalElements,
      number: page,
      size,
      data: {
        content: paginatedContent,
        totalPages,
        totalElements,
        number: page,
        size,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('Error fetching employee wise data:', err);
    return NextResponse.json({ error: 'Failed to fetch employee wise data' }, { status: 500 });
  }
}
