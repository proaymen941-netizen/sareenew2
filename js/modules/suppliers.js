// Suppliers Module - Enhanced Version
async function loadSuppliers() {
    const contentArea = document.getElementById('content-area');
    const suppliers = await db.getAll('suppliers');
    const invoices = await db.getAll('purchase_invoices');
    const payments = await db.getAll('supplier_payments');

    const totalPurchases = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalDue = totalPurchases - totalPayments;

    contentArea.innerHTML = `
        <h2 class="mb-3">🚚 إدارة الموردين والمشتريات</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">إجمالي المشتريات</div>
                <div class="stat-value">${formatCurrency(totalPurchases)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--success);">
                <div class="stat-label">إجمالي المدفوعات</div>
                <div class="stat-value" style="color: var(--success);">${formatCurrency(totalPayments)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--error);">
                <div class="stat-label">المديونيات</div>
                <div class="stat-value" style="color: var(--error);">${formatCurrency(totalDue)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--info);">
                <div class="stat-label">عدد الموردين</div>
                <div class="stat-value" style="color: var(--info);">${suppliers.length}</div>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showSuppliersList()">الموردين</button>
            <button class="btn btn-secondary" onclick="showPurchaseInvoices()">فواتير الشراء</button>
            <button class="btn btn-success" onclick="showSupplierPayments()">المدفوعات</button>
        </div>

        <div id="suppliersContent"></div>
    `;

    showSuppliersList();
}

async function showSuppliersList() {
    const suppliers = await db.getAll('suppliers');
    const content = document.getElementById('suppliersContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">قائمة الموردين</h3>
                <button class="btn btn-primary" onclick="showAddSupplierForm()">➕ إضافة مورد</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>كود</th>
                            <th>اسم المورد</th>
                            <th>نوع المنتجات</th>
                            <th>رقم الهاتف</th>
                            <th>البريد</th>
                            <th>التقييم</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.length === 0 ? '<tr><td colspan="7" class="text-center">لا يوجد موردين</td></tr>' :
                          suppliers.map(sup => `
                            <tr>
                                <td>${sup.id}</td>
                                <td>${sup.name}</td>
                                <td>${sup.product_type}</td>
                                <td>${sup.phone}</td>
                                <td>${sup.email || '-'}</td>
                                <td>⭐ ${sup.rating || 0}/5</td>
                                <td>
                                    <button class="btn-icon" onclick="editSupplier(${sup.id})" title="تعديل">✏️</button>
                                    <button class="btn-icon" onclick="viewSupplierAccount(${sup.id})" title="كشف حساب">📊</button>
                                    <button class="btn-icon" onclick="deleteSupplier(${sup.id})" title="حذف">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddSupplierForm() {
    const formHTML = `
        <form id="supplierForm" onsubmit="saveSupplier(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم المورد *</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">نوع المنتجات *</label>
                    <input type="text" name="product_type" class="form-input" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف *</label>
                    <input type="tel" name="phone" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">البريد الإلكتروني</label>
                    <input type="email" name="email" class="form-input">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">العنوان</label>
                <textarea name="address" class="form-textarea" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">التقييم (1-5)</label>
                <input type="number" name="rating" class="form-input" min="1" max="5" value="5">
            </div>
        </form>
    `;

    showModal('إضافة مورد جديد', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("supplierForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveSupplier(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const supplier = {
        name: formData.get('name'),
        product_type: formData.get('product_type'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        rating: parseInt(formData.get('rating')) || 5
    };

    await db.add('suppliers', supplier);
    showToast('تم إضافة المورد بنجاح', 'success');
    closeModal();
    loadSuppliers();
}

async function editSupplier(id) {
    const sup = await db.getById('suppliers', id);
    
    const formHTML = `
        <form id="editSupplierForm" onsubmit="updateSupplier(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم المورد *</label>
                    <input type="text" name="name" class="form-input" value="${sup.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">نوع المنتجات *</label>
                    <input type="text" name="product_type" class="form-input" value="${sup.product_type}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف *</label>
                    <input type="tel" name="phone" class="form-input" value="${sup.phone}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">البريد الإلكتروني</label>
                    <input type="email" name="email" class="form-input" value="${sup.email || ''}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">العنوان</label>
                <textarea name="address" class="form-textarea" rows="2">${sup.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">التقييم (1-5)</label>
                <input type="number" name="rating" class="form-input" min="1" max="5" value="${sup.rating || 5}">
            </div>
        </form>
    `;

    showModal('تعديل المورد', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("editSupplierForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function updateSupplier(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const supplier = {
        id: id,
        name: formData.get('name'),
        product_type: formData.get('product_type'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        rating: parseInt(formData.get('rating')) || 5
    };

    await db.update('suppliers', supplier);
    showToast('تم تحديث المورد بنجاح', 'success');
    closeModal();
    loadSuppliers();
}

async function deleteSupplier(id) {
    if (await confirm('هل أنت متأكد من حذف هذا المورد؟')) {
        await db.delete('suppliers', id);
        showToast('تم حذف المورد بنجاح', 'success');
        loadSuppliers();
    }
}

// فواتير الشراء
async function showPurchaseInvoices() {
    const invoices = await db.getAll('purchase_invoices');
    const content = document.getElementById('suppliersContent');

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">فواتير الشراء</h3>
                <button class="btn btn-secondary" onclick="showPurchaseInvoiceForm()">➕ إضافة فاتورة</button>
            </div>

            <div class="stat-card" style="margin-bottom: 1.5rem;">
                <div class="stat-label">إجمالي الفواتير</div>
                <div class="stat-value">${formatCurrency(totalAmount)}</div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>المورد</th>
                            <th>عدد الأصناف</th>
                            <th>الإجمالي</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد فواتير</td></tr>' :
                          invoices.reverse().map(inv => `
                            <tr>
                                <td>${inv.invoice_number}</td>
                                <td>${formatDate(inv.date)}</td>
                                <td>${inv.supplier_name}</td>
                                <td>${inv.items ? (typeof inv.items === 'string' ? (() => { try { return JSON.parse(inv.items).length; } catch(e) { return 0; } })() : inv.items.length) : 0}</td>
                                <td>${formatCurrency(inv.total_amount)}</td>
                                <td>
                                    <button class="btn-icon" onclick="viewInvoiceDetails(${inv.id})" title="عرض">👁️</button>
                                    <button class="btn-icon" onclick="deleteInvoice(${inv.id})" title="حذف">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showPurchaseInvoiceForm() {
    const suppliers = await db.getAll('suppliers');
    const items = await db.getAll('inventory_items');
    
    const formHTML = `
        <form id="invoiceForm" onsubmit="savePurchaseInvoice(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">رقم الفاتورة *</label>
                    <input type="text" name="invoice_number" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">التاريخ *</label>
                    <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">المورد *</label>
                <select name="supplier_id" class="form-select" required>
                    <option value="">اختر مورد</option>
                    ${suppliers.map(sup => `
                        <option value="${sup.id}" data-name="${sup.name}">${sup.name}</option>
                    `).join('')}
                </select>
            </div>

            <div id="invoiceItems">
                <h4>أصناف الفاتورة:</h4>
                <div class="invoice-item-row">
                    <select name="item_id[]" class="form-select" required>
                        <option value="">اختر صنف</option>
                        ${items.map(item => `
                            <option value="${item.id}" data-name="${item.name}" data-unit="${item.unit}">${item.name}</option>
                        `).join('')}
                    </select>
                    <input type="number" name="quantity[]" class="form-input" placeholder="الكمية" step="0.01" required>
                    <input type="number" name="unit_price[]" class="form-input" placeholder="سعر الوحدة" step="0.01" required>
                    <button type="button" class="btn btn-danger" onclick="this.parentElement.remove(); calculateInvoiceTotal()">-</button>
                </div>
            </div>
            <button type="button" class="btn btn-secondary mt-2" onclick="addInvoiceItemRow()">+ إضافة صنف</button>

            <div class="stat-card mt-2">
                <div class="stat-label">الإجمالي</div>
                <div class="stat-value" id="invoiceTotal">0.00 ر.س</div>
            </div>
        </form>
    `;

    showModal('إضافة فاتورة شراء', formHTML, [
        { text: 'حفظ', class: 'btn-secondary', onclick: 'document.getElementById("invoiceForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

function addInvoiceItemRow() {
    const items = window.inventoryItemsCache || [];
    const container = document.getElementById('invoiceItems');
    const row = document.createElement('div');
    row.className = 'invoice-item-row';
    row.innerHTML = `
        <select name="item_id[]" class="form-select" required onchange="calculateInvoiceTotal()">
            <option value="">اختر صنف</option>
            ${items.map(item => `
                <option value="${item.id}" data-name="${item.name}" data-unit="${item.unit}">${item.name}</option>
            `).join('')}
        </select>
        <input type="number" name="quantity[]" class="form-input" placeholder="الكمية" step="0.01" required onchange="calculateInvoiceTotal()">
        <input type="number" name="unit_price[]" class="form-input" placeholder="سعر الوحدة" step="0.01" required onchange="calculateInvoiceTotal()">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove(); calculateInvoiceTotal()">-</button>
    `;
    container.appendChild(row);
}

function calculateInvoiceTotal() {
    const quantities = Array.from(document.querySelectorAll('input[name="quantity[]"]'));
    const prices = Array.from(document.querySelectorAll('input[name="unit_price[]"]'));
    
    let total = 0;
    quantities.forEach((qtyInput, index) => {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(prices[index].value) || 0;
        total += qty * price;
    });

    document.getElementById('invoiceTotal').textContent = formatCurrency(total);
}

async function savePurchaseInvoice(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Cache items for addInvoiceItemRow
    window.inventoryItemsCache = await db.getAll('inventory_items');
    
    const select = document.querySelector('select[name="supplier_id"]');
    const supplierName = select.selectedOptions[0].dataset.name;

    const itemIds = formData.getAll('item_id[]');
    const quantities = formData.getAll('quantity[]');
    const prices = formData.getAll('unit_price[]');

    const invoiceItems = [];
    let totalAmount = 0;

    for (let i = 0; i < itemIds.length; i++) {
        const itemId = parseInt(itemIds[i]);
        const qty = parseFloat(quantities[i]);
        const price = parseFloat(prices[i]);
        const item = await db.getById('inventory_items', itemId);
        
        invoiceItems.push({
            item_id: itemId,
            item_name: item.name,
            unit: item.unit,
            quantity: qty,
            unit_price: price,
            total: qty * price
        });

        totalAmount += qty * price;

        // تحديث المخزون
        item.quantity += qty;
        item.purchase_price = price; // تحديث سعر الشراء
        await db.update('inventory_items', item);

        // تسجيل حركة المخزون
        await db.add('inventory_movements', {
            date: formData.get('date'),
            item_id: itemId,
            item_name: item.name,
            unit: item.unit,
            type: 'in',
            quantity: qty,
            price: price,
            total_cost: qty * price,
            notes: `فاتورة شراء ${formData.get('invoice_number')}`
        });
    }

    const invoice = {
        invoice_number: formData.get('invoice_number'),
        date: formData.get('date'),
        supplier_id: parseInt(formData.get('supplier_id')),
        supplier_name: supplierName,
        items: JSON.stringify(invoiceItems),
        total_amount: totalAmount
    };

    await db.add('purchase_invoices', invoice);
    showToast('تم إضافة الفاتورة بنجاح', 'success');
    closeModal();
    showPurchaseInvoices();
}

async function viewInvoiceDetails(id) {
    const invoice = await db.getById('purchase_invoices', id);
    let items = [];
    try {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    } catch (error) {
        console.error('Error parsing invoice items:', error);
        items = [];
    }
    
    const detailsHTML = `
        <div class="invoice-details">
            <div class="stats-grid mb-2">
                <div class="stat-card">
                    <div class="stat-label">رقم الفاتورة</div>
                    <div class="stat-value">${invoice.invoice_number}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">التاريخ</div>
                    <div class="stat-value">${formatDate(invoice.date)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">المورد</div>
                    <div class="stat-value">${invoice.supplier_name}</div>
                </div>
            </div>

            <h4>الأصناف:</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.item_name}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${formatCurrency(item.unit_price)}</td>
                                <td>${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>الإجمالي:</strong></td>
                            <td><strong>${formatCurrency(invoice.total_amount)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;

    showModal('تفاصيل الفاتورة', detailsHTML);
}

async function deleteInvoice(id) {
    if (await confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        await db.delete('purchase_invoices', id);
        showToast('تم حذف الفاتورة', 'success');
        showPurchaseInvoices();
    }
}

// المدفوعات للموردين
async function showSupplierPayments() {
    const payments = await db.getAll('supplier_payments');
    const content = document.getElementById('suppliersContent');

    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">مدفوعات الموردين</h3>
                <button class="btn btn-success" onclick="showPaymentForm()">➕ إضافة دفعة</button>
            </div>

            <div class="stat-card" style="margin-bottom: 1.5rem;">
                <div class="stat-label">إجمالي المدفوعات</div>
                <div class="stat-value">${formatCurrency(totalPayments)}</div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>المورد</th>
                            <th>المبلغ</th>
                            <th>طريقة الدفع</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.length === 0 ? '<tr><td colspan="5" class="text-center">لا توجد مدفوعات</td></tr>' :
                          payments.reverse().map(pay => `
                            <tr>
                                <td>${formatDate(pay.date)}</td>
                                <td>${pay.supplier_name}</td>
                                <td class="text-success">${formatCurrency(pay.amount)}</td>
                                <td><span class="badge">${pay.payment_method}</span></td>
                                <td>${pay.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showPaymentForm() {
    const suppliers = await db.getAll('suppliers');
    
    const formHTML = `
        <form id="paymentForm" onsubmit="saveSupplierPayment(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">المورد *</label>
                    <select name="supplier_id" class="form-select" required>
                        <option value="">اختر مورد</option>
                        ${suppliers.map(sup => `
                            <option value="${sup.id}" data-name="${sup.name}">${sup.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">التاريخ *</label>
                    <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">المبلغ *</label>
                    <input type="number" name="amount" class="form-input" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">طريقة الدفع *</label>
                    <select name="payment_method" class="form-select" required>
                        <option value="نقداً">نقداً</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="شيك">شيك</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea name="notes" class="form-textarea" rows="2"></textarea>
            </div>
        </form>
    `;

    showModal('إضافة دفعة', formHTML, [
        { text: 'حفظ', class: 'btn-success', onclick: 'document.getElementById("paymentForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveSupplierPayment(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const select = document.querySelector('select[name="supplier_id"]');
    const supplierName = select.selectedOptions[0].dataset.name;

    const payment = {
        supplier_id: parseInt(formData.get('supplier_id')),
        supplier_name: supplierName,
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        payment_method: formData.get('payment_method'),
        notes: formData.get('notes')
    };

    await db.add('supplier_payments', payment);
    showToast('تم إضافة الدفعة بنجاح', 'success');
    closeModal();
    showSupplierPayments();
}

// كشف حساب المورد
async function viewSupplierAccount(id) {
    const supplier = await db.getById('suppliers', id);
    const invoices = await db.getByIndex('purchase_invoices', 'supplier_id', id);
    const payments = await db.getByIndex('supplier_payments', 'supplier_id', id);

    const totalPurchases = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const balance = totalPurchases - totalPayments;

    const accountHTML = `
        <div class="stats-grid mb-2">
            <div class="stat-card">
                <div class="stat-label">إجمالي المشتريات</div>
                <div class="stat-value">${formatCurrency(totalPurchases)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">إجمالي المدفوعات</div>
                <div class="stat-value text-success">${formatCurrency(totalPayments)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">الرصيد المستحق</div>
                <div class="stat-value ${balance > 0 ? 'text-error' : 'text-success'}">${formatCurrency(balance)}</div>
            </div>
        </div>

        <h4>الفواتير:</h4>
        <div class="table-container mb-2">
            <table>
                <thead>
                    <tr><th>التاريخ</th><th>رقم الفاتورة</th><th>المبلغ</th></tr>
                </thead>
                <tbody>
                    ${invoices.slice(-10).reverse().map(inv => `
                        <tr>
                            <td>${formatDate(inv.date)}</td>
                            <td>${inv.invoice_number}</td>
                            <td>${formatCurrency(inv.total_amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <h4>المدفوعات:</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th></tr>
                </thead>
                <tbody>
                    ${payments.slice(-10).reverse().map(pay => `
                        <tr>
                            <td>${formatDate(pay.date)}</td>
                            <td class="text-success">${formatCurrency(pay.amount)}</td>
                            <td>${pay.payment_method}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    showModal(`كشف حساب: ${supplier.name}`, accountHTML);
}
