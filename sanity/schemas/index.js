export const userSchema = {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    { name: 'username', title: 'Username', type: 'string', validation: Rule => Rule.required() },
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required() },
    { name: 'password', title: 'Password (Hashed)', type: 'string', validation: Rule => Rule.required() },
    { name: 'role', title: 'Role', type: 'string', options: { list: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'] }, validation: Rule => Rule.required() },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
    { name: 'branchName', title: 'Branch Name', type: 'string' },
    { name: 'branchId', title: 'Branch ID', type: 'string' },
  ],
};

export const customerSchema = {
  name: 'customer',
  title: 'Customer',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'phoneNumber', title: 'Phone Number', type: 'string', validation: Rule => Rule.required() },
    { name: 'companyName', title: 'Company Name', type: 'string' },
    { name: 'taxNumber', title: 'Tax Number / GST', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const branchSchema = {
  name: 'branch',
  title: 'Branch',
  type: 'document',
  fields: [
    { name: 'branchId', title: 'Branch ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'address', title: 'Address', type: 'string' },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const employeeSchema = {
  name: 'employee',
  title: 'Employee',
  type: 'document',
  fields: [
    { name: 'employeeId', title: 'Employee ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'designation', title: 'Designation', type: 'string' },
    { name: 'branchName', title: 'Branch Name', type: 'string' },
    { name: 'branchId', title: 'Branch ID', type: 'string' },
    { name: 'salary', title: 'Salary', type: 'number' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const itemSchema = {
  name: 'item',
  title: 'Item',
  type: 'document',
  fields: [
    { name: 'itemId', title: 'Item ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'price', title: 'Price (Front)', type: 'number', validation: Rule => Rule.required() },
    { name: 'priceBack', title: 'Price (Back)', type: 'number' },
    { name: 'description', title: 'Description', type: 'string' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const categorySchema = {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    { name: 'categoryId', title: 'Category ID', type: 'string' },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const machineCategorySchema = {
  name: 'machineCategory',
  title: 'Machine Category',
  type: 'document',
  fields: [
    { name: 'categoryId', title: 'Category ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const machineSchema = {
  name: 'machine',
  title: 'Machine',
  type: 'document',
  fields: [
    { name: 'machineId', title: 'Machine ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'machineCategory', title: 'Machine Category', type: 'string' },
    { name: 'categoryId', title: 'Category ID', type: 'string' },
    { name: 'reading', title: 'Reading', type: 'string' },
    { name: 'serialNumber', title: 'Serial Number', type: 'string' },
    { name: 'mobile', title: 'Mobile', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'tonerRequestMobile', title: 'Toner Request Mobile', type: 'string' },
    { name: 'tonerRequestEmail', title: 'Toner Request Email', type: 'string' },
    { name: 'branchName', title: 'Branch Name', type: 'string' },
    { name: 'branchId', title: 'Branch ID', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const paperCategorySchema = {
  name: 'paperCategory',
  title: 'Paper Category',
  type: 'document',
  fields: [
    { name: 'categoryId', title: 'Category ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const paperGroupSchema = {
  name: 'paperGroup',
  title: 'Paper Group',
  type: 'document',
  fields: [
    { name: 'groupId', title: 'Group ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'paperCategory', title: 'Paper Category', type: 'string' },
    { name: 'paperCategoryId', title: 'Paper Category ID', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const paperSchema = {
  name: 'paper',
  title: 'Paper',
  type: 'document',
  fields: [
    { name: 'paperId', title: 'Paper ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'paperCategory', title: 'Paper Category', type: 'string', validation: Rule => Rule.required() },
    { name: 'paperCategoryId', title: 'Paper Category ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'paperGroup', title: 'Paper Group', type: 'string', validation: Rule => Rule.required() },
    { name: 'paperGroupId', title: 'Paper Group ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'readingCount', title: 'Reading Count', type: 'number', initialValue: 0 },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const particularSchema = {
  name: 'particular',
  title: 'Particular',
  type: 'document',
  fields: [
    { name: 'particularId', title: 'Particular ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'price', title: 'Price (Front)', type: 'number', validation: Rule => Rule.required() },
    { name: 'priceBack', title: 'Price (Back)', type: 'number' },
    { name: 'commisionRate', title: 'Commission Rate', type: 'number' },
    { name: 'machineCategory', title: 'Machine Category', type: 'string' },
    { name: 'machineCategoryId', title: 'Machine Category ID', type: 'string' },
    { name: 'paper', title: 'Paper', type: 'string' },
    { name: 'paperId', title: 'Paper ID', type: 'string' },
    { name: 'paperGroup', title: 'Paper Group', type: 'string' },
    { name: 'paperGroupId', title: 'Paper Group ID', type: 'string' },
    { name: 'taxNumber', title: 'Tax Number / HSN', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const expenseItemSchema = {
  name: 'expenseItem',
  title: 'Expense Item',
  type: 'document',
  fields: [
    { name: 'expenseItemId', title: 'Expense Item ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'type', title: 'Type', type: 'string' },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const billSchema = {
  name: 'bill',
  title: 'Bill',
  type: 'document',
  fields: [
    { name: 'billNumber', title: 'Bill Number', type: 'string', validation: Rule => Rule.required() },
    { name: 'date', title: 'Date', type: 'date', validation: Rule => Rule.required() },
    { name: 'employee', title: 'Employee', type: 'string' },
    { name: 'customerName', title: 'Customer Name', type: 'string' },
    { name: 'customerEmail', title: 'Customer Email', type: 'string' },
    { name: 'customerMobileNo', title: 'Customer Mobile No', type: 'string' },
    { name: 'customerGstNo', title: 'Customer GST No', type: 'string' },
    { name: 'payment', title: 'Payment Method', type: 'string' },
    { name: 'totalPaid', title: 'Total Paid', type: 'number' },
    { name: 'total', title: 'Total', type: 'number' },
    { name: 'creditAmount', title: 'Credit Amount', type: 'number' },
    { name: 'totalWithGst', title: 'Total With GST', type: 'number' },
    { name: 'actualTotal', title: 'Actual Total', type: 'number' },
    { name: 'totalItems', title: 'Total Items', type: 'number' },
    { name: 'billStatus', title: 'Bill Status', type: 'string' },
    { name: 'creditPaidAmount', title: 'Credit Paid Amount', type: 'number' },
    { name: 'particularsJson', title: 'Particulars (JSON)', type: 'text' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
    { name: 'updatedAt', title: 'Updated At', type: 'datetime' },
  ],
};

export const orderItemSchema = {
  name: 'orderItem',
  title: 'Order Item',
  type: 'object',
  fields: [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'quantity', title: 'Quantity', type: 'number' },
    { name: 'price', title: 'Unit Price', type: 'number' },
    { name: 'total', title: 'Total', type: 'number' },
    { name: 'particularId', title: 'Particular ID', type: 'string' },
    { name: 'type', title: 'Type', type: 'string' },
  ],
};

export const orderSchema = {
  name: 'order',
  title: 'Order (GST)',
  type: 'document',
  fields: [
    { name: 'orderId', title: 'Order ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'invoiceNumber', title: 'Invoice Number', type: 'string' },
    { name: 'invoiceDate', title: 'Invoice Date', type: 'datetime' },
    { name: 'username', title: 'Username / Employee', type: 'string' },
    { name: 'customerName', title: 'Customer Name', type: 'string' },
    { name: 'phoneNumber', title: 'Phone Number', type: 'string' },
    { name: 'gstin', title: 'GSTIN', type: 'string' },
    { name: 'subtotal', title: 'Subtotal', type: 'number' },
    { name: 'tax', title: 'Tax', type: 'number' },
    { name: 'grandTotal', title: 'Grand Total', type: 'number' },
    { name: 'creditType', title: 'Credit Type', type: 'string' },
    { name: 'paidAmount', title: 'Paid Amount', type: 'number' },
    { name: 'pendingAmount', title: 'Pending Amount', type: 'number' },
    { name: 'paymentMethod', title: 'Payment Method', type: 'string' },
    { name: 'paymentStatus', title: 'Payment Status', type: 'string' },
    { name: 'items', title: 'Order Items', type: 'array', of: [{ type: 'orderItem' }] },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const dailyExpenseSchema = {
  name: 'dailyExpense',
  title: 'Daily Expense',
  type: 'document',
  fields: [
    { name: 'dailyExpenseId', title: 'Daily Expense ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'date', title: 'Date', type: 'date', validation: Rule => Rule.required() },
    { name: 'branch', title: 'Branch', type: 'string' },
    { name: 'cashInHand', title: 'Cash In Hand', type: 'number' },
    { name: 'lastClosed', title: 'Last Closed', type: 'number' },
    { name: 'shortage', title: 'Shortage', type: 'number' },
    { name: 'imageUrl', title: 'Image URL', type: 'string' },
    { name: 'totalCash', title: 'Total Cash', type: 'number' },
    { name: 'expensiveJson', title: 'Expenses (JSON)', type: 'text' },
    { name: 'otherExpensiveJson', title: 'Other Expenses (JSON)', type: 'text' },
    { name: 'advancePaidJson', title: 'Advance Paid (JSON)', type: 'text' },
    { name: 'checkPaymentJson', title: 'Check Payment (JSON)', type: 'text' },
    { name: 'cashDepositJson', title: 'Cash Deposit (JSON)', type: 'text' },
    { name: 'otherIncomesJson', title: 'Other Incomes (JSON)', type: 'text' },
    { name: 'machineReadingJson', title: 'Machine Reading (JSON)', type: 'text' },
    { name: 'creditsJson', title: 'Credits (JSON)', type: 'text' },
    { name: 'totalSales', title: 'Total Sales', type: 'number' },
    { name: 'paidSales', title: 'Paid Sales', type: 'number' },
    { name: 'creditSales', title: 'Credit Sales', type: 'number' },
    { name: 'totalCustomer', title: 'Total Customer', type: 'number' },
    { name: 'cashInHandExpected', title: 'Cash In Hand Expected', type: 'number' },
    { name: 'paidCredits', title: 'Paid Credits', type: 'number' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const monthlyExpenseSchema = {
  name: 'monthlyExpense',
  title: 'Monthly Expense',
  type: 'document',
  fields: [
    { name: 'monthlyExpenseId', title: 'Monthly Expense ID', type: 'string', validation: Rule => Rule.required() },
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'amount', title: 'Amount', type: 'number', validation: Rule => Rule.required() },
    { name: 'month', title: 'Month', type: 'number' },
    { name: 'year', title: 'Year', type: 'number' },
    { name: 'branch', title: 'Branch', type: 'string' },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
};

export const pageAccessSchema = {
  name: 'pageAccess',
  title: 'Page Access',
  type: 'document',
  fields: [
    { name: 'page', title: 'Page Identifier', type: 'string', validation: Rule => Rule.required() },
    { name: 'admin', title: 'Admin Access', type: 'boolean', initialValue: true },
    { name: 'manager', title: 'Manager Access', type: 'boolean', initialValue: false },
    { name: 'employee', title: 'Employee Access', type: 'boolean', initialValue: false },
    { name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true },
  ],
};

export const gstInvoiceSequenceSchema = {
  name: 'gstInvoiceSequence',
  title: 'GST Invoice Sequence',
  type: 'document',
  fields: [
    { name: 'prefix', title: 'Prefix', type: 'string', initialValue: 'INV' },
    { name: 'currentNumber', title: 'Current Number', type: 'number', initialValue: 0 },
    { name: 'financialYear', title: 'Financial Year', type: 'string' },
  ],
};

// Combined schemas export
export const schemaTypes = [
  userSchema,
  customerSchema,
  branchSchema,
  employeeSchema,
  itemSchema,
  categorySchema,
  machineCategorySchema,
  machineSchema,
  paperCategorySchema,
  paperGroupSchema,
  paperSchema,
  particularSchema,
  expenseItemSchema,
  billSchema,
  orderItemSchema,
  orderSchema,
  dailyExpenseSchema,
  monthlyExpenseSchema,
  pageAccessSchema,
  gstInvoiceSequenceSchema,
];
