import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function round2(n) {
  return Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
}

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

// PUT /api/bills/credit-bills/[id]/status
// Body: { billStatus, paidAmount, creditAmount, creditPaidAmount, totalPaid, payment }
// Mirrors the old backend BillServiceImpl.updateCreditBillStatus exactly
// (only creditAmount, creditPaidAmount, totalPaid, billStatus and payment are updated).
export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    let doc = await sanityClient.getDocument(id);
    if (!doc || String(doc._id) !== String(id) || doc._type !== 'bill') {
      const found = await sanityClient.fetch(`*[_type == "bill" && _id == $id][0]`, { id });
      doc = found || null;
    }
    if (!doc) {
      return NextResponse.json({ error: `Bill with ID ${id} not found` }, { status: 404 });
    }

    const total = Number(doc.total) || 0;
    const currentCreditAmount = Number(doc.creditAmount) || 0;
    const currentCreditPaidAmount = Number(doc.creditPaidAmount) || 0;
    let currentTotalPaid = Number(doc.totalPaid) || 0;

    if (currentCreditAmount > 0 && (currentTotalPaid + currentCreditAmount > total + 0.01
      || Math.abs(currentTotalPaid - total) < 0.01)) {
      currentTotalPaid = Math.max(0, total - currentCreditAmount);
    }

    const requestedStatus = body.billStatus !== null && body.billStatus !== undefined
      ? String(body.billStatus).trim()
      : null;
    const reqCreditAmount = body.creditAmount !== null && body.creditAmount !== undefined
      ? Number(body.creditAmount) : null;
    const reqCreditPaidAmount = body.creditPaidAmount !== null && body.creditPaidAmount !== undefined
      ? Number(body.creditPaidAmount) : null;
    const reqPaidAmount = body.paidAmount !== null && body.paidAmount !== undefined
      ? Number(body.paidAmount) : null;
    const reqTotalPaid = body.totalPaid !== null && body.totalPaid !== undefined
      ? Number(body.totalPaid) : null;
    const reqPayment = body.payment !== null && body.payment !== undefined
      ? String(body.payment).trim() : null;

    // Calculate additional payment made in this operation
    let additionalPayment = 0;
    if (reqPaidAmount !== null && reqPaidAmount > 0) {
      additionalPayment = reqPaidAmount;
    } else if ((requestedStatus || '').toUpperCase() === 'PAID'
      && reqPaidAmount === null && reqCreditPaidAmount === null && reqCreditAmount === null) {
      additionalPayment = currentCreditAmount;
    } else if (reqCreditPaidAmount !== null && reqCreditPaidAmount > currentCreditPaidAmount) {
      additionalPayment = reqCreditPaidAmount - currentCreditPaidAmount;
    }

    const newCreditPaidAmount = currentCreditPaidAmount + additionalPayment;
    let newTotalPaid = reqTotalPaid !== null ? reqTotalPaid : (currentTotalPaid + additionalPayment);
    let newCreditAmount;
    if (reqCreditAmount !== null) {
      newCreditAmount = Math.max(0, reqCreditAmount);
    } else {
      newCreditAmount = Math.max(0, currentCreditAmount - additionalPayment);
    }

    let finalStatus = 'CREDIT';
    if (requestedStatus) {
      finalStatus = requestedStatus.toUpperCase();
    }

    if (newCreditAmount <= 0 || newTotalPaid >= total || (requestedStatus || '').toUpperCase() === 'PAID') {
      finalStatus = 'PAID';
      newCreditAmount = 0;
      if (newTotalPaid < total) {
        newTotalPaid = total;
      }
    }

    const patch = {
      creditAmount: round2(newCreditAmount),
      creditPaidAmount: round2(newCreditPaidAmount),
      totalPaid: round2(newTotalPaid),
      billStatus: finalStatus,
      updatedAt: new Date().toISOString(),
    };
    if (reqPayment) {
      patch.payment = reqPayment;
    }

    const updated = await sanityClient.patch(id).set(patch).commit();
    return NextResponse.json({ data: { ...updated, id: updated._id, particulars: parseParticulars(updated) } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}