import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import { cleanString, cleanDate, cleanParticulars, toNumber, toInt } from '@/lib/validate';

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
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const existing = await sanityClient.getDocument(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let particulars = cleanParticulars(body.particulars);

    // Enrich with the particular's name so bills render item names everywhere
    // (mirrors the old backend behavior).
    let particularsByName = {};
    const pids = particulars.map(p => p.particularId).filter(Boolean);
    if (pids.length > 0) {
      try {
        const docs = await sanityClient.fetch(
          `*[_type == "particular" && particularId in $ids]{ particularId, name }`,
          { ids: pids }
        );
        docs.forEach(d => { if (d.particularId) particularsByName[d.particularId] = cleanString(d.name, { max: 200 }); });
      } catch (e) { /* non-fatal */ }
    }

    particulars = particulars.map(p => ({
      ...p,
      name: p.name || particularsByName[p.particularId] || '',
    }));

    let totalPaid = toNumber(body.totalPaid, { min: 0, max: 1e12 });
    let total = toNumber(body.total, { min: 0, max: 1e12 });
    let creditAmount = toNumber(body.creditAmount, { min: 0, max: 1e12 });
    const normalized = normalizeTotals(total, totalPaid, creditAmount);
    totalPaid = normalized.totalPaid;

    const payment = cleanString(body.payment, { max: 40 }) || existing.payment || 'Cash';
    const billStatus = cleanString(body.billStatus, { max: 20 }) || computeBillStatus({
      payment,
      total,
      totalPaid,
      creditAmount,
    });

    const updated = await sanityClient.patch(id).set({
      billNumber: cleanString(body.billNumber, { max: 60 }) || existing.billNumber,
      date: cleanDate(body.date) || existing.date || toDateStr(new Date()),
      employee: cleanString(body.employee, { max: 120 }) || existing.employee || '',
      customerName: cleanString(body.customerName, { max: 160 }) || existing.customerName || '',
      customerEmail: body.customerEmail !== undefined ? cleanString(body.customerEmail, { max: 254 }).toLowerCase() : (existing.customerEmail || ''),
      customerMobileNo: body.customerMobileNo !== undefined ? cleanString(body.customerMobileNo, { max: 20 }) : (existing.customerMobileNo || ''),
      customerGstNo: body.customerGstNo !== undefined ? cleanString(body.customerGstNo, { max: 40 }) : (existing.customerGstNo || ''),
      payment,
      totalPaid,
      total: Number(total.toFixed(2)),
      creditAmount: Number(creditAmount.toFixed(2)),
      totalWithGst: body.totalWithGst !== undefined ? toNumber(body.totalWithGst, { min: 0, max: 1e12, fallback: total }) : (existing.totalWithGst || total),
      actualTotal: body.actualTotal !== undefined ? toNumber(body.actualTotal, { min: 0, max: 1e12, fallback: total }) : (existing.actualTotal || total),
      totalItems: toInt(body.totalItems, { min: 0, max: 100000, fallback: particulars.length }),
      billStatus,
      creditPaidAmount: body.creditPaidAmount !== undefined ? toNumber(body.creditPaidAmount, { min: 0, max: 1e12 }) : (existing.creditPaidAmount || 0),
      particularsJson: JSON.stringify(particulars),
      updatedAt: new Date().toISOString(),
    }).commit();

    return NextResponse.json({ data: toBillPayload(updated) });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}