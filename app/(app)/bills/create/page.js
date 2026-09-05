'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';
import { useApp } from '@/context/AppContext';

export default function CreateBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  const { auth } = useApp();

  const [printBill, setPrintBill] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingType, setSavingType] = useState(null);
  const [billNumber, setBillNumber] = useState('');

  // Employees & Customers
  const [employeeNames, setEmployeeNames] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({
    customerName: '',
    customerGstNo: '',
    customerMobileNo: '',
    customerEmail: ''
  });

  // Credit modal check
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);
  const [isCheckingCredit, setIsCheckingCredit] = useState(false);

  const getEmptyParticularRow = () => ({
    id: Date.now().toString() + Math.random().toString(),
    particularId: '',
    particularName: '',
    type: 'Single Side',
    qty: 1,
    basePrice: 0,
    priceBack: 0,
    individualPrice: 0,
    totalPrice: 0,
    isFilled: false
  });

  const [particularsList, setParticularsList] = useState(() =>
    Array(5).fill(null).map(() => getEmptyParticularRow())
  );

  const [paymentType, setPaymentType] = useState('Cash');
  const [enableCredit, setEnableCredit] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [priceDiscount, setPriceDiscount] = useState('');
  const [tdsAmount, setTdsAmount] = useState('');

  const [allParticulars, setAllParticulars] = useState([]);
  const [activeParticularDropdownRowId, setActiveParticularDropdownRowId] = useState(null);

  const [totals, setTotals] = useState({
    totalItems: 0,
    totalBillsWithoutGst: 0,
    gstPercentage: 0,
    gstAmount: 0,
    discount: 0,
    tdsAmount: 0,
    totalPaidCredits: 0,
    totalCredits: 0,
    totalToPay: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, [editId]);

  const fetchNextBillNumber = async () => {
    try {
      const res = await fetch('/api/bills/next-bill-number');
      const data = await res.json();
      if (data.nextBillNumber) {
        setBillNumber(data.nextBillNumber);
      } else if (data.data) {
        setBillNumber(data.data.nextBillNumber || data.data);
      }
    } catch (e) {
      console.error('Error fetching next bill number', e);
    }
  };

  const fetchInitialData = async () => {
    try {
      fetch('/api/customers')
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.data || []);
          setCustomers(list);
        })
        .catch(err => setCustomers([]));

      fetch('/api/employees')
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.data || []);
          setEmployeeNames(list);
        })
        .catch(err => setEmployeeNames([]));

      fetch('/api/particulars')
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : (d.data || []);
          setAllParticulars(list);
        })
        .catch(err => setAllParticulars([]));

      if (!isEditMode) {
        fetchNextBillNumber();
        if (auth?.username) {
          setSelectedEmployee(auth.username);
          setEmployeeSearch(auth.username);
        }
      } else {
        const res = await fetch(`/api/bills/${editId}`);
        const bill = await res.json();
        if (bill) {
          setBillNumber(bill.billNumber);
          setSelectedEmployee(bill.employee || '');
          setEmployeeSearch(bill.employee || '');
          setCustomerSearch(bill.customerName || '');
          setSelectedCustomer({
            customerName: bill.customerName || '',
            customerGstNo: bill.customerGstNo || '',
            customerMobileNo: bill.customerMobileNo || '',
            customerEmail: bill.customerEmail || ''
          });
          setPaymentType(bill.payment || 'Cash');
          setAmountPaid(bill.totalPaid || '');
          setEnableCredit((bill.creditAmount || 0) > 0);

          let parsed = [];
          try {
            parsed = typeof bill.particulars === 'string' ? JSON.parse(bill.particulars) : bill.particulars;
          } catch (e) {}

          const newList = (parsed || []).map(p => ({
            id: Date.now().toString() + Math.random().toString(),
            particularId: p.particularId || p.name || '',
            particularName: (p.name || p.particularId || '').toUpperCase(),
            type: 'Single Side',
            qty: p.qty || 1,
            basePrice: p.price || 0,
            priceBack: p.price || 0,
            individualPrice: p.price || 0,
            totalPrice: (p.qty || 1) * (p.price || 0),
            isFilled: true
          }));

          while (newList.length < 5) newList.push(getEmptyParticularRow());
          setParticularsList(newList);
        }
      }
    } catch (e) {
      toast.error('Failed to load initial data');
    }
  };

  const handleEmployeeSelect = (emp) => {
    const fullName = typeof emp === 'object' ? (emp.fullName || emp.name || '') : String(emp);
    setSelectedEmployee(fullName);
    setEmployeeSearch(fullName);
  };

  const handleCustomerSelect = (customer) => {
    setCustomerSearch(customer.name);
    setSelectedCustomer({
      customerName: customer.name,
      customerGstNo: customer.taxNumber || customer.gstin || customer.customerGstNo || customer.gstNo || '',
      customerMobileNo: customer.phoneNumber || customer.customerMobileNo || customer.mobileNo || '',
      customerEmail: customer.email || customer.customerEmail || ''
    });

    if (customer.name) {
      setIsCheckingCredit(true);
      fetch(`/api/bills/check-credit?customerName=${encodeURIComponent(customer.name)}`)
        .then(r => r.json())
        .then(res => {
          if (res) {
            setCreditInfo(res);
            if (res.iscustomerHasCredit) {
              setShowCreditModal(true);
            }
          }
        })
        .catch(err => console.error('Credit check error', err))
        .finally(() => setIsCheckingCredit(false));
    }
  };

  const selectParticularForItem = (rowId, data) => {
    if (!data) return;
    const pId = data.particularId || data.id || '';
    const displayName = String(data.particularName || data.name || pId).toUpperCase();

    const safeList = Array.isArray(particularsList) ? particularsList : [];
    const isDuplicate = safeList.some(p => p.id !== rowId && p.isFilled && (String(p.particularId || '').trim().toLowerCase() === String(pId).trim().toLowerCase() || String(p.particularName || '').toLowerCase() === displayName.toLowerCase()));

    if (isDuplicate) {
      toast.error('This particular is already added to the bill.');
      return;
    }

    setParticularsList(prevList => {
      let newList = (prevList || []).map(p => {
        if (p.id === rowId) {
          return {
            ...p,
            particularId: pId,
            particularName: displayName,
            type: 'Single Side',
            qty: 1,
            basePrice: data.price || data.basePrice || 0,
            priceBack: data.priceBack || data.price || 0,
            individualPrice: data.price || data.basePrice || 0,
            totalPrice: data.price || data.basePrice || 0,
            isFilled: true
          };
        }
        return p;
      });

      const emptyCount = newList.filter(p => !p.isFilled).length;
      if (emptyCount < 2) {
        newList.push(getEmptyParticularRow());
      }
      return newList;
    });
    setActiveParticularDropdownRowId(null);
  };

  const handleParticularAdd = (e, id) => {
    const item = particularsList.find(p => p.id === id);
    if (e.key === 'Enter') {
      if (item && item.particularId && item.particularId.trim() !== '') {
        e.preventDefault();
        e.stopPropagation();
        const searchId = item.particularId.trim().toLowerCase();
        const safeAll = Array.isArray(allParticulars) ? allParticulars : [];
        const matched = safeAll.find(p =>
          String(p.particularId || '').toLowerCase() === searchId ||
          String(p.particularName || p.name || '').toLowerCase() === searchId
        );
        if (matched) {
          selectParticularForItem(id, matched);
        } else {
          toast.error('Particular not found');
        }
      }
    }
  };

  const updateParticularRow = (id, field, value) => {
    setParticularsList(prevList =>
      (prevList || []).map(item => {
        if (item.id === id) {
          let updatedItem = { ...item, [field]: value };
          if (field === 'type') {
            updatedItem.individualPrice = value === 'Single Side' ? updatedItem.basePrice : updatedItem.priceBack;
            updatedItem.totalPrice = updatedItem.qty * updatedItem.individualPrice;
          }
          if (field === 'qty' || field === 'individualPrice') {
            updatedItem.totalPrice = updatedItem.qty * updatedItem.individualPrice;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeParticular = (id) => {
    setParticularsList(prevList => {
      let newList = (prevList || []).filter(item => item.id !== id);
      while (newList.length < 5 || newList.filter(p => !p.isFilled).length < 2) {
        newList.push(getEmptyParticularRow());
      }
      return newList;
    });
  };

  useEffect(() => {
    let itemsCount = 0;
    let subtotalWithoutGst = 0;

    (particularsList || []).forEach(item => {
      if (item.isFilled) {
        itemsCount += 1;
        subtotalWithoutGst += Number(item.totalPrice) || 0;
      }
    });

    const disc = Number(priceDiscount) || 0;
    const tds = Number(tdsAmount) || 0;
    const netSubtotal = Math.max(0, subtotalWithoutGst - disc - tds);
    const gstAmt = (netSubtotal * totals.gstPercentage) / 100;
    const finalToPay = netSubtotal + gstAmt;
    const displayTotalPaid = enableCredit ? (Number(amountPaid) || 0) : finalToPay;

    setTotals(prev => ({
      ...prev,
      totalItems: itemsCount,
      totalBillsWithoutGst: subtotalWithoutGst,
      gstAmount: gstAmt,
      discount: disc,
      tdsAmount: tds,
      totalPaidCredits: displayTotalPaid,
      totalCredits: enableCredit ? Math.max(0, finalToPay - (Number(amountPaid) || 0)) : 0,
      totalToPay: finalToPay
    }));
  }, [particularsList, totals.gstPercentage, priceDiscount, tdsAmount, amountPaid, enableCredit]);

  const getFormattedBillNumberWithGst = (gstPct) => {
    let num = billNumber || '';
    const cleanNum = String(num).replace(/-E$/i, '');
    return gstPct === 0 ? `${cleanNum}-E` : cleanNum;
  };

  const getFormattedBillNumber = () => {
    return getFormattedBillNumberWithGst(totals.gstPercentage);
  };

  const handleSave = async (printAfter = false, overrideGstPercent = null) => {
    if (isSaving) return;

    const empName = (selectedEmployee || employeeSearch || '').trim();
    if (!empName) {
      toast.error('Please select or enter an Employee Name.');
      return;
    }

    const custName = (selectedCustomer.customerName || customerSearch || '').trim();
    if (!custName) {
      toast.error('Please select or enter a Customer Name.');
      return;
    }

    const filledItems = particularsList.filter(p => p.isFilled);
    if (filledItems.length === 0) {
      toast.error('Please add or select at least one particular item.');
      return;
    }

    setIsSaving(true);
    setSavingType(printAfter ? 'print' : 'save');

    const activeGstPct = overrideGstPercent !== null ? overrideGstPercent : totals.gstPercentage;
    const subtotalWithoutGst = filledItems.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
    const disc = Number(priceDiscount) || 0;
    const tds = Number(tdsAmount) || 0;
    const netSubtotal = Math.max(0, subtotalWithoutGst - disc - tds);
    const gstAmt = activeGstPct > 0 ? (netSubtotal * activeGstPct) / 100 : 0;
    const finalTotalToPay = Number((netSubtotal + gstAmt).toFixed(2));
    const billNoToUse = getFormattedBillNumberWithGst(activeGstPct);

    const calculatedTotalPaid = enableCredit
      ? (amountPaid !== '' && amountPaid !== null ? Number(Number(amountPaid).toFixed(2)) : 0)
      : finalTotalToPay;

    const payload = {
      billNumber: billNoToUse,
      employee: empName,
      customerName: custName,
      customerEmail: selectedCustomer.customerEmail || '',
      customerMobileNo: selectedCustomer.customerMobileNo || '',
      customerGstNo: activeGstPct > 0 ? (selectedCustomer.customerGstNo || '') : '',
      payment: paymentType.toUpperCase(),
      totalPaid: calculatedTotalPaid,
      total: finalTotalToPay,
      creditAmount: enableCredit ? Number((finalTotalToPay - calculatedTotalPaid).toFixed(2)) : 0,
      actualTotal: Number(subtotalWithoutGst.toFixed(2)),
      totalWithGst: Number(finalTotalToPay.toFixed(2)),
      totalItems: filledItems.length,
      discount: Number(disc.toFixed(2)),
      tdsAmount: Number(tds.toFixed(2)),
      creditPaidAmount: enableCredit ? calculatedTotalPaid : 0,
      particulars: JSON.stringify(filledItems.map(p => ({
        particularId: p.particularId,
        name: p.particularName,
        qty: p.qty,
        price: Number(Number(p.individualPrice).toFixed(2))
      })))
    };

    try {
      const url = isEditMode ? `/api/bills/${editId}` : '/api/bills';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok) {
        toast.success(`Bill ${isEditMode ? 'updated' : 'saved'} successfully (${activeGstPct}% GST)!`);
        if (printAfter) {
          setPrintBill({
            invoiceNumber: billNoToUse,
            orderId: resData.id || editId,
            createdAt: new Date().toISOString(),
            username: empName,
            customerName: custName,
            grandTotal: finalTotalToPay,
            paidAmount: calculatedTotalPaid,
            tax: gstAmt,
            items: filledItems.map(p => ({ name: p.particularName, quantity: p.qty, price: p.individualPrice })),
            creditType: enableCredit ? 'CREDIT' : 'CASH',
            pendingAmount: enableCredit ? (finalTotalToPay - calculatedTotalPaid) : 0,
            taxPercent: activeGstPct,
            subtotal: subtotalWithoutGst,
            gstin: selectedCustomer.customerGstNo
          });
        }
        if (!isEditMode) {
          setSelectedEmployee('');
          setEmployeeSearch('');
          setCustomerSearch('');
          setSelectedCustomer({ customerName: '', customerGstNo: '', customerMobileNo: '', customerEmail: '' });
          setParticularsList(Array(5).fill(null).map(() => getEmptyParticularRow()));
          setPaymentType('Cash');
          setEnableCredit(false);
          setAmountPaid('');
          setPriceDiscount('');
          setTdsAmount('');
          setShowExtra(false);
          fetchNextBillNumber();
        }
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'save'} bill`);
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'save'} bill`);
    } finally {
      setIsSaving(false);
      setSavingType(null);
    }
  };

  const safeEmployeeNames = Array.isArray(employeeNames) ? employeeNames : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeAllParticulars = Array.isArray(allParticulars) ? allParticulars : [];

  const filteredEmployees = safeEmployeeNames.filter(emp => {
    const fullName = typeof emp === 'object' ? (emp.fullName || emp.name || '') : String(emp);
    return fullName.toLowerCase().includes(employeeSearch.toLowerCase());
  });

  const filteredCustomers = safeCustomers.filter(c =>
    (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (c.phoneNumber && c.phoneNumber.includes(customerSearch))
  );

  return (
    <div className="create-bill-container fade-in">
      <div className="page-header">
        <h2 style={{ color: '#002142', fontWeight: 700 }}>{isEditMode ? 'Edit Bill' : 'Create Bill'}</h2>
      </div>

      <div className="bill-card">
        {/* Row 1: Bill No, Employee, Customer Search */}
        <div className="bill-row row-1">
          <div className="form-group">
            <label>BILL NUMBER</label>
            <input type="text" value={getFormattedBillNumber()} disabled className="form-control disabled-input bill-number-text" />
          </div>
          <div className="form-group customer-search-wrapper">
            <label>EMPLOYEE NAME</label>
            <input
              type="text"
              placeholder="Search employee..."
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setSelectedEmployee(e.target.value);
                setShowEmployeeDropdown(true);
              }}
              onFocus={() => { if (employeeSearch) setShowEmployeeDropdown(true); }}
              onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
              className="form-control"
            />
            {showEmployeeDropdown && (
              <ul className="customer-dropdown-list">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, idx) => (
                    <li key={idx} onMouseDown={(e) => { e.preventDefault(); handleEmployeeSelect(emp); setShowEmployeeDropdown(false); }}>
                      <span className="fw-bold">{typeof emp === 'object' ? (emp.fullName || emp.name) : emp}</span>
                    </li>
                  ))
                ) : (
                  <li className="no-results">No employees found</li>
                )}
              </ul>
            )}
          </div>
          <div className="form-group customer-search-wrapper">
            <label>CUSTOMER NAME</label>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(prev => ({ ...prev, customerName: e.target.value }));
                setShowCustomerDropdown(true);
              }}
              onFocus={() => { if (customerSearch) setShowCustomerDropdown(true); }}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              className="form-control"
            />
            {showCustomerDropdown && (
              <ul className="customer-dropdown-list">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, idx) => (
                    <li key={idx} onMouseDown={(e) => { e.preventDefault(); handleCustomerSelect(c); setShowCustomerDropdown(false); }}>
                      <span className="fw-bold">{c.name}</span> - {c.phoneNumber || 'No Mobile'}
                    </li>
                  ))
                ) : (
                  <li className="no-results">No customers found</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Row 2: Customer Details */}
        <div className="bill-row row-2">
          <div className="form-group">
            <label>CUSTOMER NAME</label>
            <input type="text" value={selectedCustomer.customerName} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, customerName: e.target.value })} className="form-control" />
          </div>
          {totals.gstPercentage > 0 && (
            <div className="form-group">
              <label>GST NO</label>
              <input type="text" value={selectedCustomer.customerGstNo} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, customerGstNo: e.target.value })} className="form-control" placeholder="Enter GSTIN" />
            </div>
          )}
          <div className="form-group">
            <label>MOBILE NUMBER</label>
            <input type="text" value={selectedCustomer.customerMobileNo} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, customerMobileNo: e.target.value })} className="form-control" />
          </div>
          <div className="form-group">
            <label>EMAIL</label>
            <input type="email" value={selectedCustomer.customerEmail} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, customerEmail: e.target.value })} className="form-control" />
          </div>
        </div>

        {/* Row 3: Particulars and Summary */}
        <div className="bill-row row-3">
          {/* Left Side: Particulars Table (60%) */}
          <div className="particulars-section">
            <div className="table-responsive">
              <table className="particulars-table">
                <thead>
                  <tr>
                    <th>PARTICULARS</th>
                    <th>TYPE</th>
                    <th>QTY</th>
                    <th>INDIVIDUAL PRICE</th>
                    <th>TOTAL PRICE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {particularsList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {!item.isFilled ? (
                          <div className="particular-search-wrapper" style={{ position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Type Item ID or Name..."
                              value={item.particularId}
                              onChange={(e) => {
                                updateParticularRow(item.id, 'particularId', e.target.value);
                                setActiveParticularDropdownRowId(item.id);
                              }}
                              onFocus={() => setActiveParticularDropdownRowId(item.id)}
                              onBlur={() => setTimeout(() => setActiveParticularDropdownRowId(null), 200)}
                              onKeyDown={(e) => handleParticularAdd(e, item.id)}
                              className="form-control particular-add-input"
                            />
                            {activeParticularDropdownRowId === item.id && item.particularId && item.particularId.trim() !== '' && (
                              <ul
                                className="customer-dropdown-list particular-dropdown-list"
                                style={{
                                  position: 'absolute',
                                  top: '100%', left: 0, right: 0,
                                  zIndex: 1000, maxHeight: '200px', overflowY: 'auto',
                                  background: '#fff', border: '1px solid #ccc',
                                  borderRadius: '4px', listStyle: 'none', padding: 0, margin: 0,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                              >
                                {safeAllParticulars
                                  .filter(p =>
                                    String(p.particularId || '').toLowerCase().includes(item.particularId.trim().toLowerCase()) ||
                                    String(p.particularName || p.name || '').toLowerCase().includes(item.particularId.trim().toLowerCase())
                                  )
                                  .slice(0, 10)
                                  .map((p, idx) => (
                                    <li
                                      key={idx}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectParticularForItem(item.id, p);
                                      }}
                                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                    >
                                      <span className="fw-bold" style={{ color: '#002142' }}>{p.particularId}</span> - {(p.particularName || p.name || '').toUpperCase()} (₹{p.price || 0})
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <span className="fw-bold">{item.particularName}</span>
                        )}
                      </td>
                      <td>
                        {item.isFilled ? (
                          <select
                            value={item.type}
                            onChange={(e) => updateParticularRow(item.id, 'type', e.target.value)}
                            className="form-select type-select"
                          >
                            <option value="Single Side">Single Side</option>
                            <option value="Back to Back">Back to Back</option>
                          </select>
                        ) : '-'}
                      </td>
                      <td>
                        {item.isFilled ? (
                          <div className="qty-control">
                            <button onClick={() => updateParticularRow(item.id, 'qty', Math.max(1, item.qty - 1))}>-</button>
                            <span>{item.qty}</span>
                            <button onClick={() => updateParticularRow(item.id, 'qty', item.qty + 1)}>+</button>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        {item.isFilled ? (
                          <input
                            type="number"
                            value={item.individualPrice}
                            onChange={(e) => updateParticularRow(item.id, 'individualPrice', Number(e.target.value))}
                            className="form-control price-input"
                          />
                        ) : '-'}
                      </td>
                      <td className={item.isFilled ? "fw-bold" : ""}>
                        {item.isFilled ? `₹${item.totalPrice.toFixed(2)}` : '-'}
                      </td>
                      <td>
                        {item.isFilled ? (
                          <button className="btn btn-danger btn-sm" onClick={() => removeParticular(item.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Payment Summary (40%) */}
          <div className="summary-section">
            <h5 className="summary-title">PAYMENT SUMMARY</h5>
            <div className="summary-details">
              <div className="summary-item">
                <span>Total Items:</span>
                <span className="fw-bold">{totals.totalItems}</span>
              </div>
              <div className="summary-item">
                <span>Total Paid:</span>
                <span className="fw-bold">₹{(totals.totalPaidCredits || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span>Total Credits:</span>
                <span className="fw-bold">₹{totals.totalCredits.toFixed(2)}</span>
              </div>

              <hr className="my-1 text-muted" />

              <div className="summary-item text-danger fw-bold">
                <span>Total Bill:</span>
                <span>₹{totals.totalBillsWithoutGst.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span>GST (SGST + CGST):</span>
                <div className="gst-input-wrapper">
                  <input
                    type="number"
                    value={totals.gstPercentage}
                    onChange={(e) => setTotals({ ...totals, gstPercentage: Number(e.target.value) })}
                    className="form-control gst-input"
                  />
                  <span>%</span>
                  <span className="fw-bold ms-2">₹{totals.gstAmount.toFixed(2)}</span>
                </div>
              </div>

              <hr className="my-1 text-muted" />

              {totals.discount > 0 && (
                <div className="summary-item text-success fw-bold">
                  <span>Discount:</span>
                  <span>-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-item">
                <span>Total To Pay:</span>
                <span className="fw-bold">₹{totals.totalToPay.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 d-flex align-items-center justify-content-end gap-3">
              <span className="fs-4 fw-bold" style={{ color: '#6b7280' }}>TOTAL</span>
              <div className="fs-4 fw-bold text-dark" style={{ backgroundColor: '#fffde7', border: '1px solid #90caf9', padding: '5px 15px', minWidth: '150px', textAlign: 'right' }}>
                {totals.totalToPay.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Payment Details */}
        <div className="bill-row row-4 payment-row">
          <div className="payment-type-group">
            <label className="fw-bold me-2">Payment:</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="form-select payment-select"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="payment-paid-box ms-4">
            <span className="fw-bold me-2 text-nowrap">Total Paid:</span>
            <input
              type="number"
              value={enableCredit ? amountPaid : totals.totalToPay > 0 ? totals.totalToPay.toFixed(2) : ''}
              disabled={!enableCredit}
              onChange={(e) => setAmountPaid(e.target.value)}
              className={`form-control paid-input ${!enableCredit ? 'bg-light text-muted fw-bold' : ''}`}
              placeholder={enableCredit ? "Down Payment (₹0)" : `Full (₹${totals.totalToPay.toFixed(2)})`}
            />
          </div>

          <div className="credit-checkbox-group ms-4">
            <input
              type="checkbox"
              id="enableCredit"
              checked={enableCredit}
              onChange={(e) => setEnableCredit(e.target.checked)}
              className="form-check-input"
            />
            <label htmlFor="enableCredit" className="form-check-label ms-2 fw-bold text-danger">Enable Credit</label>
          </div>

          {enableCredit && (
            <div className="payment-total-box ms-4">
              <span className="fw-bold">Total Bill:</span>
              <span className="fw-bold ms-2">₹{totals.totalToPay.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="bill-actions d-flex justify-content-between align-items-start mt-4">
          <div className="extra-actions-container">
            <button className="btn btn-outline-secondary px-4" onClick={() => setShowExtra(!showExtra)}>Extra</button>
            {showExtra && (
              <div className="extra-fields-card mt-3 p-3 bg-light border rounded d-flex align-items-center gap-4">
                <div className="form-group d-flex align-items-center m-0">
                  <label className="me-2 fw-bold text-nowrap">Price Discount</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '150px' }}
                    value={priceDiscount}
                    onChange={e => setPriceDiscount(e.target.value)}
                    placeholder="Amount"
                  />
                </div>
                <div className="form-group d-flex align-items-center m-0">
                  <label className="me-2 fw-bold text-nowrap">Tds Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '150px' }}
                    value={tdsAmount}
                    onChange={e => setTdsAmount(e.target.value)}
                    placeholder="Amount"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="save-actions d-flex align-items-center gap-2">
            <button
              className="btn btn-primary px-4 me-2"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              style={{ backgroundColor: '#002142', borderColor: '#002142' }}
            >
              {isSaving && savingType === 'save' ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
            </button>
            <button
              className="btn btn-secondary px-4"
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              {isSaving && savingType === 'print' ? (isEditMode ? 'Updating & Printing...' : 'Saving & Printing...') : (isEditMode ? 'Update and Print' : 'Save and Print')}
            </button>
          </div>
        </div>
      </div>

      {printBill && (
        <ReceiptPopup
          orderDetails={printBill}
          onClose={() => setPrintBill(null)}
        />
      )}

      {/* Customer Credit Notice Modal */}
      {(showCreditModal || isCheckingCredit) && (
        <div className="credit-modal-overlay">
          <div className="credit-modal-card">
            <button
              type="button"
              className="credit-modal-close-btn"
              onClick={() => setShowCreditModal(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {isCheckingCredit ? (
              <div className="credit-modal-body text-center py-5">
                <div className="credit-spinner mb-3 mx-auto"></div>
                <h5 className="fw-bold mt-3">Checking Credit Status...</h5>
              </div>
            ) : creditInfo ? (
              <div className="credit-modal-body text-center">
                <div className="credit-icon-badge badge-danger">
                  <i className="bi bi-exclamation-lg"></i>
                </div>
                <h4 className="credit-modal-heading">Customer Credit Notice</h4>
                <p className="credit-modal-subtext">
                  Customer <span className="customer-highlight">{customerSearch}</span> has pending credit orders.
                </p>
                <div className="credit-kpi-grid">
                  <div className="credit-kpi-card kpi-balance">
                    <span className="kpi-label">Balance Due</span>
                    <span className="kpi-value text-danger">₹{Math.abs(Number(creditInfo.balanceToPay || 0)).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  className="credit-btn-primary mt-4"
                  onClick={() => setShowCreditModal(false)}
                >
                  Continue to Bill Creation
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
