import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = parseInt(searchParams.get('size') || '15', 10);

  try {
    const bills = await sanityClient.fetch(`*[_type == "bill"]{
      _id,
      customerName,
      total,
      totalPaid,
      creditAmount,
      payment
    }`);

    const customerMap = {};

    (bills || []).forEach(bill => {
      const name = (bill.customerName || 'Unknown').trim();
      if (!customerMap[name]) {
        customerMap[name] = {
          customerName: name,
          totalBillsCount: 0,
          totalBuyAmount: 0,
          creditBalanceAmount: 0,
        };
      }

      customerMap[name].totalBillsCount += 1;
      customerMap[name].totalBuyAmount += Number(bill.total) || 0;

      const isCredit = String(bill.payment || '').toUpperCase() === 'CREDIT' || Number(bill.creditAmount) > 0;
      if (isCredit) {
        customerMap[name].creditBalanceAmount += Number(bill.creditAmount) || 0;
      }
    });

    const allCustomers = Object.values(customerMap).sort((a, b) => a.customerName.localeCompare(b.customerName));
    const totalElements = allCustomers.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const startIdx = page * size;
    const paginatedContent = allCustomers.slice(startIdx, startIdx + size);

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
    console.error('Error fetching customer wise data:', err);
    return NextResponse.json({ error: 'Failed to fetch customer wise data' }, { status: 500 });
  }
}
