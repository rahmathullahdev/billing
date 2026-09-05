import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function parseParticulars(bill) {
  if (Array.isArray(bill.particulars)) return bill.particulars;
  if (bill.particularsJson) {
    try {
      const parsed = JSON.parse(bill.particularsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function computeBillStatus({ payment, total, totalPaid, creditAmount }) {
  const tot = parseFloat(total) || 0;
  const paid = parseFloat(totalPaid) || 0;
  const credit = parseFloat(creditAmount) || 0;
  if (String(payment || '').trim().toUpperCase() === 'CREDIT') return 'CREDIT';
  if (Math.abs(tot - paid) <= 1 && paid > 0) return 'PAID';
  if (credit > 0) return 'CREDIT';
  return 'PENDING';
}

function normalizeTotals(total, totalPaid, creditAmount) {
  let tot = parseFloat(total) || 0;
  let paid = parseFloat(totalPaid) || 0;
  let credit = parseFloat(creditAmount) || 0;
  if (credit > 0 && (paid + credit > tot + 0.01 || Math.abs(paid - tot) < 0.01)) {
    paid = Math.max(0, Number((tot - credit).toFixed(2)));
  }
  return { total: tot, totalPaid: paid, creditAmount: credit };
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toBillPayload(parsed) {
  return { ...parsed, id: parsed._id, particulars: parseParticulars(parsed) };
}

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    const bill = await sanityClient.getDocument(id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: toBillPayload(bill) });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await sanityClient.getDocument(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let particulars = body.particulars || [];
    if (typeof particulars === 'string') {
      try {
        particulars = JSON.parse(particulars);
      } catch (e) {
        particulars = [];
      }
    }
    if (!Array.isArray(particulars)) particulars = [];

    // Enrich with the particular's name so bills render item names everywhere
    // (mirrors the old backend behavior).
    let particularsByName = {};
    const pids = particulars.map(p => String(p.particularId || p.id || '')).filter(Boolean);
    if (pids.length > 0) {
      try {
        const docs = await sanityClient.fetch(
          `*[_type == "particular" && particularId in $ids]{ particularId, name }`,
          { ids: pids }
        );
        docs.forEach(d => { if (d.particularId) particularsByName[d.particularId] = d.name || ''; });
      } catch (e) { /* non-fatal */ }
    }

    particulars = particulars.map(p => ({
      particularId: p.particularId || p.id || '',
      name: p.name || p.particularName || particularsByName[p.particularId] || particularsByName[p.id] || '',
      qty: Number(p.qty) || 1,
      price: Number(p.price) || 0,
      total_price: Number((Number(p.qty) || 1) * (Number(p.price) || 0)),
    }));

    let totalPaid = parseFloat(body.totalPaid) || 0;
    let total = parseFloat(body.total) || 0;
    let creditAmount = parseFloat(body.creditAmount) || 0;
    const normalized = normalizeTotals(total, totalPaid, creditAmount);
    totalPaid = normalized.totalPaid;

    const billStatus = body.billStatus || computeBillStatus({
      payment: body.payment,
      total,
      totalPaid,
      creditAmount,
    });

    const updated = await sanityClient.patch(id).set({
      billNumber: body.billNumber || existing.billNumber,
      date: body.date || existing.date || toDateStr(new Date()),
      employee: body.employee || existing.employee || '',
      customerName: body.customerName || existing.customerName || '',
      customerEmail: body.customerEmail !== undefined ? body.customerEmail : (existing.customerEmail || ''),
      customerMobileNo: body.customerMobileNo !== undefined ? body.customerMobileNo : (existing.customerMobileNo || ''),
      customerGstNo: body.customerGstNo !== undefined ? body.customerGstNo : (existing.customerGstNo || ''),
      payment: body.payment || existing.payment || 'Cash',
      totalPaid,
      total: Number(total.toFixed(2)),
      creditAmount: Number(creditAmount.toFixed(2)),
      totalWithGst: body.totalWithGst !== undefined ? parseFloat(body.totalWithGst) : (existing.totalWithGst || total),
      actualTotal: body.actualTotal !== undefined ? parseFloat(body.actualTotal) : (existing.actualTotal || total),
      totalItems: parseInt(body.totalItems) || particulars.length,
      billStatus,
      creditPaidAmount: body.creditPaidAmount !== undefined ? parseFloat(body.creditPaidAmount) || 0 : (existing.creditPaidAmount || 0),
      particularsJson: JSON.stringify(particulars),
      updatedAt: new Date().toISOString(),
    }).commit();

    return NextResponse.json({ data: toBillPayload(updated) });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}