'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const currency = (value) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const toDateInput = (date) => date.toISOString().split('T')[0];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const downloadCsv = (rows, fileName) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '""';
          return `"${String(cell).replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');
  saveAs(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }), fileName);
};

const normalizeExpenseMap = (value) => {
  if (!value) return {};
  if (!Array.isArray(value)) return value;

  return value.reduce((acc, item) => {
    const name = item.name || item.type || item.expenseItem || item.item || item.title;
    if (name) acc[name] = Number(item.amount) || 0;
    return acc;
  }, {});
};

const normalizeCredits = (value) => {
  if (!value) return {};
  if (!Array.isArray(value)) return value;

  return value.reduce((acc, item) => {
    const name = item.customer || item.customerName || item.name;
    if (name) acc[name] = Number(item.amount) || 0;
    return acc;
  }, {});
};

const normalizeRecord = (row) => ({
  ...row,
  id: row.dailyExpenseId || row._id || row.id,
  expenses: normalizeExpenseMap(row.expenses || row.expensive),
  otherExpenses: row.otherExpenses || row.otherExpensive || [],
  advancePayments: row.advancePayments || row.advancePaid || [],
  checkPayments: row.checkPayments || row.checkPayment || [],
  cashDeposits: row.cashDeposits || row.cashDeposit || [],
  otherIncomes: row.otherIncomes || [],
  machineReadings: row.machineReadings || row.machineReading || [],
  credits: normalizeCredits(row.credits),
});

const hasValidArrayData = (arr, valField = 'amount') => {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.some((item) => {
    const val = Number.parseFloat(item[valField]);
    return (
      (!Number.isNaN(val) && val > 0) ||
      Boolean(item.type?.trim?.()) ||
      Boolean(item.reason?.trim?.()) ||
      Boolean(item.refNo?.trim?.()) ||
      Boolean(item.checkNo?.trim?.())
    );
  });
};

const hasValidObjectData = (obj) =>
  obj && typeof obj === 'object' && Object.values(obj).some((v) => Number.parseFloat(v) > 0);

const calculateRecordTotalExpense = (row) => {
  if (!row) return 0;
  let total = 0;
  Object.values(row.expenses || {}).forEach((v) => {
    total += Number.parseFloat(v) || 0;
  });
  [...(row.otherExpenses || []), ...(row.advancePayments || []), ...(row.checkPayments || [])].forEach((item) => {
    total += Number.parseFloat(item.amount) || 0;
  });
  return total;
};

const exportAllToExcel = (data, expenseKeys) => {
  const rows = [
    [
      'Date',
      'Branch',
      'Total Sales',
      'Cash In Hand',
      'Last Closed',
      'Shortage',
      ...expenseKeys.map((key) => `Expense: ${key}`),
      'Total Expenses',
      'Net Operating Cash',
    ],
  ];

  const totals = { sales: 0, cash: 0, lastClosed: 0, shortage: 0, expenses: 0 };
  const expenseTotals = {};

  data.forEach((row) => {
    let rowExpenseTotal = 0;
    const expenseCells = expenseKeys.map((key) => {
      const amount = Number(row.expenses?.[key]) || 0;
      expenseTotals[key] = (expenseTotals[key] || 0) + amount;
      rowExpenseTotal += amount;
      return amount.toFixed(2);
    });

    totals.sales += Number(row.totalSales) || 0;
    totals.cash += Number(row.cashInHand) || 0;
    totals.lastClosed += Number(row.lastClosed) || 0;
    totals.shortage += Number(row.shortage) || 0;
    totals.expenses += rowExpenseTotal;

    rows.push([
      formatDate(row.date),
      row.branch || '-',
      (Number(row.totalSales) || 0).toFixed(2),
      (Number(row.cashInHand) || 0).toFixed(2),
      (Number(row.lastClosed) || 0).toFixed(2),
      (Number(row.shortage) || 0).toFixed(2),
      ...expenseCells,
      rowExpenseTotal.toFixed(2),
      ((Number(row.totalSales) || 0) - rowExpenseTotal).toFixed(2),
    ]);
  });

  rows.push([
    'TOTALS',
    '-',
    totals.sales.toFixed(2),
    totals.cash.toFixed(2),
    totals.lastClosed.toFixed(2),
    totals.shortage.toFixed(2),
    ...expenseKeys.map((key) => (expenseTotals[key] || 0).toFixed(2)),
    totals.expenses.toFixed(2),
    (totals.sales - totals.expenses).toFixed(2),
  ]);

  downloadCsv(rows, `Daily_Expenses_Report_${toDateInput(new Date())}.csv`);
};

const exportSingleToExcel = (row) => {
  const rows = [
    ['SYNDICATE PRINTS - DAILY OPERATIONS EXPENSE LEDGER'],
    ['Branch', row.branch || '-'],
    ['Date', formatDate(row.date)],
    ['Total Daily Sales (Earned)', (Number(row.totalSales) || 0).toFixed(2)],
    ['Cash In Hand', (Number(row.cashInHand) || 0).toFixed(2)],
    ['Last Closed', (Number(row.lastClosed) || 0).toFixed(2)],
    ['Shortage', (Number(row.shortage) || 0).toFixed(2)],
    [],
  ];

  const addAmountSection = (title, headers, items) => {
    if (!items.length) return;
    rows.push([title], headers, ...items, []);
  };

  addAmountSection(
    'ITEMIZED OPERATING EXPENSES',
    ['Expense Item Name', 'Amount'],
    Object.entries(row.expenses || {})
      .filter(([, amount]) => (Number(amount) || 0) > 0)
      .map(([item, amount]) => [item, Number(amount).toFixed(2)])
  );
  addAmountSection(
    'OTHER AD-HOC EXPENSES',
    ['Purpose / Category', 'Amount'],
    (row.otherExpenses || []).filter((e) => Number(e.amount) > 0).map((e) => [e.type || 'Other Expense', Number(e.amount).toFixed(2)])
  );
  addAmountSection(
    'STAFF / VENDOR ADVANCE PAYMENTS',
    ['Beneficiary / Purpose', 'Amount'],
    (row.advancePayments || []).filter((e) => Number(e.amount) > 0).map((e) => [e.type || 'Advance', Number(e.amount).toFixed(2)])
  );
  addAmountSection(
    'CHEQUE PAYMENTS ISSUED',
    ['Cheque Number', 'Amount'],
    (row.checkPayments || []).filter((e) => Number(e.amount) > 0).map((e) => [e.checkNo || 'Cheque', Number(e.amount).toFixed(2)])
  );
  addAmountSection(
    'BANK CASH DEPOSITS',
    ['Deposit Ref / Sl No.', 'Amount'],
    (row.cashDeposits || []).filter((e) => Number(e.amount) > 0).map((e) => [e.refNo || 'Ref No.', Number(e.amount).toFixed(2)])
  );
  addAmountSection(
    'OTHER ANCILLARY INCOMES',
    ['Source / Reason', 'Amount'],
    (row.otherIncomes || []).filter((e) => Number(e.amount) > 0).map((e) => [e.reason || 'Ancillary Income', Number(e.amount).toFixed(2)])
  );

  downloadCsv(rows, `Daily_Ledger_${row.branch || 'Branch'}_${formatDate(row.date).replace(/\s|,/g, '_')}.csv`);
};

const exportSingleToPdf = (row) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;
  const primary = [0, 33, 66];
  const red = [230, 64, 81];

  doc.setFillColor(...primary);
  doc.rect(14, y, 182, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SYNDICATE PRINTS - DAILY EXPENSE LEDGER', 20, y + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Branch: ${row.branch || '-'}   |   Date: ${formatDate(row.date)}`, 20, y + 18);
  y += 32;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'FD');
  [
    ['TOTAL SALES', row.totalSales, 18, primary],
    ['CASH IN HAND', row.cashInHand, 78, [2, 132, 199]],
    ['TOTAL EXPENSES', calculateRecordTotalExpense(row), 138, red],
    ['LAST CLOSED', row.lastClosed, 18, [71, 85, 105], 22],
    ['SHORTAGE', row.shortage, 78, [217, 119, 6], 22],
  ].forEach(([label, value, x, color, offset = 0]) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, y + 7 + offset);
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(`INR ${(Number(value) || 0).toFixed(2)}`, x, y + 14 + offset);
  });
  y += 42;

  const addSection = (title, headers, body, color = red) => {
    if (!body.length) return;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  };

  addSection('Catalog Operating Expenses', ['Expense Item', 'Amount'], Object.entries(row.expenses || {}).filter(([, amount]) => Number(amount) > 0).map(([item, amount]) => [item, `INR ${Number(amount).toFixed(2)}`]));
  addSection('Other Ad-hoc Expenses', ['Purpose / Category', 'Amount'], (row.otherExpenses || []).filter((e) => Number(e.amount) > 0).map((e) => [e.type || 'Ad-hoc Expense', `INR ${Number(e.amount).toFixed(2)}`]));
  addSection('Staff / Vendor Advance Payments', ['Beneficiary', 'Amount'], (row.advancePayments || []).filter((e) => Number(e.amount) > 0).map((e) => [e.type || 'Advance Beneficiary', `INR ${Number(e.amount).toFixed(2)}`]));
  addSection('Cheque Payments Issued', ['Cheque Number', 'Amount'], (row.checkPayments || []).filter((e) => Number(e.amount) > 0).map((e) => [e.checkNo || 'N/A', `INR ${Number(e.amount).toFixed(2)}`]));
  addSection('Bank Cash Deposits', ['Deposit Ref / Sl No.', 'Amount'], (row.cashDeposits || []).filter((e) => Number(e.amount) > 0).map((e) => [e.refNo || 'N/A', `INR ${Number(e.amount).toFixed(2)}`]), primary);
  addSection('Other Ancillary Incomes', ['Income Source / Reason', 'Amount'], (row.otherIncomes || []).filter((e) => Number(e.amount) > 0).map((e) => [e.reason || 'Ancillary Income', `INR ${Number(e.amount).toFixed(2)}`]), [5, 150, 105]);
  addSection('Customer Credits Given', ['Customer Name', 'Amount'], Object.entries(row.credits || {}).filter(([, amount]) => Number(amount) > 0).map(([customer, amount]) => [customer, `INR ${Number(amount).toFixed(2)}`]), [2, 132, 199]);
  addSection('Machine Counter Meter Readings', ['Machine Name', 'Current', 'Old', 'Units Run'], (row.machineReadings || []).filter((m) => Number(m.currentReading) > 0 || Number(m.oldReading) > 0).map((m) => {
    const current = Number(m.currentReading) || 0;
    const old = Number(m.oldReading) || 0;
    return [m.machine || 'Machine', String(current), String(old), `+${Math.max(current - old, 0)}`];
  }), primary);

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Syndicate Prints Daily Ledger`, 14, 287);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 140, 287);
  }
  doc.save(`Daily_Ledger_${row.branch || 'Branch'}_${formatDate(row.date).replace(/\s|,/g, '_')}.pdf`);
};

export default function DailyExpenseReportPage() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeFilterPill, setActiveFilterPill] = useState('all');
  const [filters, setFilters] = useState({ startDate: '', endDate: '', branch: '' });

  const expenseKeys = useMemo(
    () =>
      Array.from(
        new Set(data.flatMap((row) => Object.keys(row.expenses || {})))
      ).sort(),
    [data]
  );

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, row) => {
          acc.totalSales += Number(row.totalSales) || 0;
          acc.cashInHand += Number(row.cashInHand) || 0;
          acc.lastClosed += Number(row.lastClosed) || 0;
          acc.shortage += Number(row.shortage) || 0;
          expenseKeys.forEach((key) => {
            const amount = Number(row.expenses?.[key]) || 0;
            acc.expenseTotals[key] = (acc.expenseTotals[key] || 0) + amount;
            acc.totalExpenses += amount;
          });
          return acc;
        },
        { totalSales: 0, cashInHand: 0, lastClosed: 0, shortage: 0, totalExpenses: 0, expenseTotals: {} }
      ),
    [data, expenseKeys]
  );

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch('/api/branches');
      const json = await response.json();
      setBranches(Array.isArray(json.data) ? json.data : json.data?.content || []);
    } catch (error) {
      toast.error('Failed to load operating branches');
    }
  }, []);

  const loadData = useCallback(async (nextFilters = { startDate: '', endDate: '', branch: '' }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '0', size: '1000' });
      if (nextFilters.startDate) params.set('startDate', nextFilters.startDate);
      if (nextFilters.endDate) params.set('endDate', nextFilters.endDate);
      if (nextFilters.branch) params.set('branch', nextFilters.branch);
      const response = await fetch(`/api/daily-expenses?${params.toString()}`);
      const json = await response.json();
      const rows = Array.isArray(json.data) ? json.data : json.data?.content || [];
      setData(rows.map(normalizeRecord));
    } catch (error) {
      toast.error('Failed to fetch daily expense ledgers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
    loadData();
  }, [loadBranches, loadData]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setActiveFilterPill('custom');
  };

  const handleQuickFilter = (type) => {
    setActiveFilterPill(type);
    const today = new Date();
    let startDate = '';
    let endDate = toDateInput(today);

    if (type === 'today') {
      startDate = endDate;
    } else if (type === 'last7') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      startDate = toDateInput(date);
    } else if (type === 'thisMonth') {
      startDate = toDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      endDate = '';
    }

    const nextFilters = { ...filters, startDate, endDate };
    setFilters(nextFilters);
    loadData(nextFilters);
  };

  const handleResetFilters = () => {
    const nextFilters = { startDate: '', endDate: '', branch: '' };
    setFilters(nextFilters);
    setActiveFilterPill('all');
    loadData(nextFilters);
  };

  if (selectedRecord) {
    const totalExpense = calculateRecordTotalExpense(selectedRecord);

    return (
      <div className="fullpage-expense-view fade-in">
        <div className="fullpage-view-header">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <button type="button" className="btn-back-link" onClick={() => setSelectedRecord(null)}>
              <i className="bi bi-arrow-left"></i> Back to All Ledgers
            </button>
            <div>
              <h3 className="mb-0 text-white fw-bold">Daily Operations Detailed Ledger</h3>
              <p className="mb-0 text-blue-200 small">
                Branch: <span className="fw-bold text-white me-3">{selectedRecord.branch || 'N/A'}</span>
                Ledger Date: <span className="fw-bold text-white">{formatDate(selectedRecord.date)}</span>
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button type="button" className="btn-banner-excel shadow-sm" onClick={() => exportSingleToExcel(selectedRecord)}>
              <i className="bi bi-file-earmark-excel-fill"></i> Download Excel
            </button>
            <button type="button" className="btn btn-danger px-3 py-2 fw-bold shadow-sm" onClick={() => exportSingleToPdf(selectedRecord)}>
              <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF
            </button>
          </div>
        </div>

        <div className="fp-summary-grid">
          {[
            ['Total Sales (Earned)', selectedRecord.totalSales, 'earned', 'blue', 'bi-graph-up-arrow', 'text-primary'],
            ['Cash In Hand', selectedRecord.cashInHand, 'cash', 'cyan', 'bi-wallet2', 'text-info'],
            ['Last Closed', selectedRecord.lastClosed, 'cash', 'blue', 'bi-door-closed-fill', 'text-secondary'],
            ['Shortage', selectedRecord.shortage, 'spent', 'red', 'bi-exclamation-triangle-fill', 'text-warning'],
            ['Total Daily Expenses', totalExpense, 'spent', 'red', 'bi-receipt-cutoff', 'text-danger'],
          ].map(([label, value, cardClass, iconClass, icon, textClass]) => (
            <div className={`fp-stat-card ${cardClass}`} key={label}>
              <div className={`fp-stat-icon ${iconClass}`}>
                <i className={`bi ${icon}`}></i>
              </div>
              <div>
                <div className="fp-stat-title">{label}</div>
                <div className={`fp-stat-value ${textClass}`}>{currency(value)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="fp-details-grid">
          {hasValidObjectData(selectedRecord.expenses) && (
            <DetailCard title="Catalog Operating Expenses" icon="bi-tags-fill" tone="text-danger" items={Object.entries(selectedRecord.expenses).filter(([, amount]) => Number(amount) > 0).map(([label, amount]) => [label, currency(amount), 'text-danger'])} />
          )}
          {hasValidArrayData(selectedRecord.otherExpenses) && (
            <DetailCard title="Other Ad-hoc Expenses" icon="bi-node-plus-fill" tone="text-danger" items={selectedRecord.otherExpenses.filter((item) => Number(item.amount) > 0).map((item) => [item.type || 'Ad-hoc Expense', currency(item.amount), 'text-danger'])} />
          )}
          {hasValidArrayData(selectedRecord.advancePayments) && (
            <DetailCard title="Staff / Vendor Advance Payments" icon="bi-cash-coin" tone="text-danger" items={selectedRecord.advancePayments.filter((item) => Number(item.amount) > 0).map((item) => [item.type || 'Advance Beneficiary', currency(item.amount), 'text-danger'])} />
          )}
          {hasValidArrayData(selectedRecord.checkPayments) && (
            <DetailCard title="Cheque Payments Issued" icon="bi-card-checklist" tone="text-danger" items={selectedRecord.checkPayments.filter((item) => Number(item.amount) > 0).map((item) => [`Cheque No: ${item.checkNo || 'N/A'}`, currency(item.amount), 'text-danger'])} />
          )}
          {hasValidArrayData(selectedRecord.cashDeposits) && (
            <DetailCard title="Bank Cash Deposits" icon="bi-bank2" tone="text-primary" items={selectedRecord.cashDeposits.filter((item) => Number(item.amount) > 0).map((item) => [`Ref / Sl No: ${item.refNo || 'N/A'}`, currency(item.amount), 'text-primary'])} />
          )}
          {hasValidArrayData(selectedRecord.otherIncomes) && (
            <DetailCard title="Other Ancillary Incomes" icon="bi-graph-up-arrow" tone="text-success" items={selectedRecord.otherIncomes.filter((item) => Number(item.amount) > 0).map((item) => [item.reason || 'Income Reason', currency(item.amount), 'text-success'])} />
          )}
          {hasValidObjectData(selectedRecord.credits) && (
            <DetailCard title="Customer Credits Given" icon="bi-person-lines-fill" tone="text-info" items={Object.entries(selectedRecord.credits).filter(([, amount]) => Number(amount) > 0).map(([label, amount]) => [label, currency(amount), 'text-info'])} />
          )}
        </div>

        {hasValidArrayData(selectedRecord.machineReadings, 'currentReading') && (
          <div className="fp-detail-card mb-4">
            <h5 className="fp-detail-card-title text-dark">
              <i className="bi bi-speedometer2 me-2 text-primary"></i> Machine Counter Meter Readings
            </h5>
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center mb-0">
                <thead className="bg-light text-dark fw-bold">
                  <tr>
                    <th>Machine Name</th>
                    <th>Current Reading</th>
                    <th>Old Reading</th>
                    <th>Meter Units Run</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.machineReadings.map((machine, index) => {
                    const current = Number(machine.currentReading) || 0;
                    const old = Number(machine.oldReading) || 0;
                    return (
                      <tr key={`${machine.machine || 'machine'}-${index}`}>
                        <td className="fw-bold">{machine.machine || 'Machine'}</td>
                        <td className="text-primary fw-bold">{current}</td>
                        <td className="text-muted">{old}</td>
                        <td className="fw-bold text-success">+{Math.max(current - old, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="daily-expense-container fade-in">
      <div className="daily-report-banner mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="banner-icon-badge-blue">
              <i className="bi bi-bar-chart-line-fill"></i>
            </div>
            <div>
              <h2 className="mb-1">Daily Operations Expense & Ledger Analytics</h2>
              <p className="mb-0">Track daily cash collections, sales revenue, itemized operational expenses & ledger settlements</p>
            </div>
          </div>
          <button className="btn-banner-excel shadow-sm" onClick={() => exportAllToExcel(data, expenseKeys)} disabled={data.length === 0}>
            <i className="bi bi-file-earmark-excel-fill fs-5"></i> Download All Excel
          </button>
        </div>
      </div>

      <div className="filter-card-blue mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill"></i> Filter & Search Ledgers
          </h6>
          <div className="quick-filter-pills">
            {[
              ['all', 'All Ledgers'],
              ['today', 'Today'],
              ['last7', 'Last 7 Days'],
              ['thisMonth', 'This Month'],
            ].map(([type, label]) => (
              <button key={type} className={`pill-filter-btn ${activeFilterPill === type ? 'active' : ''}`} onClick={() => handleQuickFilter(type)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-3 col-sm-6">
            <label className="filter-label"><i className="bi bi-calendar-event"></i> Start Date</label>
            <input type="date" className="form-control filter-input" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="filter-label"><i className="bi bi-calendar-check"></i> End Date</label>
            <input type="date" className="form-control filter-input" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="filter-label"><i className="bi bi-building"></i> Operating Branch</label>
            <select className="form-select filter-input" name="branch" value={filters.branch} onChange={handleFilterChange}>
              <option value="">All Operating Branches</option>
              {branches.map((branch) => (
                <option key={branch.branchId || branch._id || branch.name} value={branch.branchName || branch.name}>
                  {branch.branchName || branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="search-action-group">
              <button className="btn-search-royal" onClick={() => loadData(filters)} disabled={loading}>
                {loading ? <span><span className="spinner-border spinner-border-sm me-1"></span> Loading...</span> : <span><i className="bi bi-search me-1"></i> Search Ledgers</span>}
              </button>
              <button className="btn-reset-royal" onClick={handleResetFilters} title="Reset All Filters">
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card-container">
        <div className="table-responsive">
          <table className="table daily-ledger-table align-middle text-center mb-0">
            <thead>
              <tr>
                <th className="py-3">Date</th>
                <th className="py-3">Branch</th>
                <th className="py-3">Total Sales (Earned)</th>
                <th className="py-3">Cash In Hand</th>
                <th className="py-3">Last Closed</th>
                <th className="py-3">Shortage</th>
                {expenseKeys.map((key) => <th key={key} className="py-3 text-uppercase">{key}</th>)}
                <th className="py-3 text-center" style={{ minWidth: '220px' }}>Actions & Ledger Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7 + expenseKeys.length} className="text-center py-5">Fetching daily expense ledgers...</td></tr>
              ) : data.length > 0 ? (
                <>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-bold text-dark">{formatDate(row.date)}</td>
                      <td><span className="badge bg-light text-dark border px-2 py-1 fw-bold"><i className="bi bi-building me-1 text-primary"></i>{row.branch || '-'}</span></td>
                      <td className="text-primary fw-bold">{currency(row.totalSales)}</td>
                      <td className="text-info fw-bold">{currency(row.cashInHand)}</td>
                      <td className="text-secondary fw-bold">{currency(row.lastClosed)}</td>
                      <td className="text-warning fw-bold">{currency(row.shortage)}</td>
                      {expenseKeys.map((key) => {
                        const amount = Number(row.expenses?.[key]) || 0;
                        return <td key={key} className={`fw-semibold ${amount > 0 ? 'text-danger' : 'text-muted opacity-50'}`}>{currency(amount)}</td>;
                      })}
                      <td>
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                          <button type="button" className="btn-view-details" onClick={() => setSelectedRecord(row)} title="View Full Ledger Metrics">
                            <i className="bi bi-eye-fill"></i> View Details
                          </button>
                          <button type="button" className="btn-excel-row-redesigned" onClick={() => exportSingleToExcel(row)} title="Download Record in Excel">
                            <i className="bi bi-file-earmark-excel-fill"></i> Excel
                          </button>
                          <button type="button" className="btn-pdf-red-redesigned" onClick={() => exportSingleToPdf(row)} title="Download Single-day PDF Report">
                            <i className="bi bi-file-earmark-pdf-fill"></i> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="totals-row-blue">
                    <td colSpan="2" className="text-end text-uppercase fw-bold py-3">Ledger Summary Totals:</td>
                    <td className="text-primary py-3">{currency(totals.totalSales)}</td>
                    <td className="text-info py-3">{currency(totals.cashInHand)}</td>
                    <td className="text-secondary py-3">{currency(totals.lastClosed)}</td>
                    <td className="text-warning py-3">{currency(totals.shortage)}</td>
                    {expenseKeys.map((key) => <td key={key} className="text-danger py-3">{currency(totals.expenseTotals[key])}</td>)}
                    <td className="py-3">-</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={7 + expenseKeys.length} className="text-center py-5 text-muted">
                    <i className="bi bi-inbox text-secondary display-4 d-block mb-3"></i>
                    <h6 className="fw-bold text-dark">No Daily Expense Records Found</h6>
                    <p className="mb-0 text-muted small">Try selecting a different date range or operating branch filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, icon, tone, items }) {
  return (
    <div className="fp-detail-card">
      <h5 className={`fp-detail-card-title ${tone}`}>
        <i className={`bi ${icon} me-2`}></i> {title}
      </h5>
      {items.map(([label, value, valueClass]) => (
        <div key={`${title}-${label}`} className="fp-mini-item">
          <span className="fp-item-label">{label}</span>
          <span className={`fp-item-value ${valueClass}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
