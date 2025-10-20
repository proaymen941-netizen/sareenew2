// Inventory Module - Enhanced Version
async function loadInventory() {
    const contentArea = document.getElementById('content-area');
    const items = await db.getAll('inventory_items');
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0);
    const totalSellValue = items.reduce((sum, item) => sum + (item.quantity * item.sell_price), 0);
    const expectedProfit = totalSellValue - totalValue;

    contentArea.innerHTML = `
        <h2 class="mb-3">📦 إدارة المخزون المتقدم</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">تكلفة المخزون</div>
                <div class="stat-value">${formatCurrency(totalValue)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--success);">
                <div class="stat-label">قيمة المبيعات المتوقعة</div>
                <div class="stat-value" style="color: var(--success);">${formatCurrency(totalSellValue)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--info);">
                <div class="stat-label">الربح المتوقع</div>
                <div class="stat-value" style="color: var(--info);">${formatCurrency(expectedProfit)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--warning);">
                <div class="stat-label">عدد الأصناف</div>
                <div class="stat-value" style="color: var(--warning);">${items.length}</div>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showInventoryItems()">الأصناف</button>
            <button class="btn btn-secondary" onclick="showInventoryMovements()">حركة المخزون</button>
            <button class="btn btn-success" onclick="showStockAudit()">جرد المخزون</button>
            <button class="btn btn-warning" onclick="showWasteRecords()">الهدر والفاقد</button>
        </div>

        <div id="inventoryContent"></div>
    `;

    showInventoryItems();
}

async function showInventoryItems() {
    const items = await db.getAll('inventory_items');
    const content = document.getElementById('inventoryContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">قائمة الأصناف</h3>
                <button class="btn btn-primary" onclick="showAddItemForm()">➕ إضافة صنف</button>
            </div>

            <div style="margin-bottom: 1rem;">
                <input type="text" id="searchInventory" class="form-input" placeholder="بحث..." 
                    oninput="searchInventoryItems(this.value)">
            </div>

            <div class="table-container">
                <table id="inventoryTable">
                    <thead>
                        <tr>
                            <th>كود</th>
                            <th>الصنف</th>
                            <th>الفئة</th>
                            <th>الكمية</th>
                            <th>الحد الأدنى</th>
                            <th>سعر الشراء</th>
                            <th>سعر البيع</th>
                            <th>هامش الربح</th>
                            <th>الصلاحية</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderInventoryRows(items)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderInventoryRows(items) {
    if (items.length === 0) {
        return '<tr><td colspan="10" class="text-center">لا توجد أصناف</td></tr>';
    }

    return items.map(item => {
        const profitMargin = calculateProfitMargin(item.purchase_price, item.sell_price);
        const daysUntilExpiry = (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
        const expiryClass = daysUntilExpiry < 7 ? 'text-error' : '';
        const lowStock = item.quantity < (item.min_quantity || 10);

        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td class="${lowStock ? 'text-warning' : ''}">${item.quantity} ${item.unit}</td>
                <td>${item.min_quantity || 10}</td>
                <td>${formatCurrency(item.purchase_price)}</td>
                <td>${formatCurrency(item.sell_price)}</td>
                <td class="${profitMargin > 0 ? 'text-success' : 'text-error'}">${profitMargin}%</td>
                <td class="${expiryClass}">${formatDate(item.expiry_date)}</td>
                <td>
                    <button class="btn-icon" onclick="showMovementForm(${item.id})" title="حركة">📝</button>
                    <button class="btn-icon" onclick="editItem(${item.id})" title="تعديل">✏️</button>
                    <button class="btn-icon" onclick="deleteItem(${item.id})" title="حذف">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function searchInventoryItems(query) {
    db.getAll('inventory_items').then(items => {
        const filtered = items.filter(item => {
            const searchTerm = query.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchTerm) ||
                (item.category && item.category.toLowerCase().includes(searchTerm)) ||
                item.id.toString().includes(searchTerm)
            );
        });
        document.querySelector('#inventoryTable tbody').innerHTML = renderInventoryRows(filtered);
    });
}

function showAddItemForm() {
    const formHTML = `
        <form id="itemForm" onsubmit="saveItem(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم الصنف *</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الفئة *</label>
                    <select name="category" class="form-select" required>
                        <option value="">اختر الفئة</option>
                        <option value="لحوم">لحوم</option>
                        <option value="خضروات">خضروات</option>
                        <option value="فواكه">فواكه</option>
                        <option value="حبوب">حبوب</option>
                        <option value="منتجات ألبان">منتجات ألبان</option>
                        <option value="مشروبات">مشروبات</option>
                        <option value="أخرى">أخرى</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الكمية *</label>
                    <input type="number" name="quantity" class="form-input" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الوحدة *</label>
                    <input type="text" name="unit" class="form-input" required placeholder="كيلو، صندوق...">
                </div>
                <div class="form-group">
                    <label class="form-label">الحد الأدنى</label>
                    <input type="number" name="min_quantity" class="form-input" value="10" min="0">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">تاريخ انتهاء الصلاحية *</label>
                <input type="date" name="expiry_date" class="form-input" required>
            </div>
        </form>
    `;

    showModal('إضافة صنف جديد', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("itemForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveItem(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const item = {
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: parseFloat(formData.get('quantity')),
        unit: formData.get('unit'),
        min_quantity: parseFloat(formData.get('min_quantity')) || 10,
        purchase_price: 0,
        sell_price: 0,
        expiry_date: formData.get('expiry_date')
    };

    await db.add('inventory_items', item);
    showToast('تم إضافة الصنف بنجاح', 'success');
    closeModal();
    loadInventory();
}

async function editItem(id) {
    const item = await db.getById('inventory_items', id);
    
    const formHTML = `
        <form id="editItemForm" onsubmit="updateItem(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم الصنف *</label>
                    <input type="text" name="name" class="form-input" value="${item.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الفئة *</label>
                    <select name="category" class="form-select" required>
                        <option value="لحوم" ${item.category === 'لحوم' ? 'selected' : ''}>لحوم</option>
                        <option value="خضروات" ${item.category === 'خضروات' ? 'selected' : ''}>خضروات</option>
                        <option value="فواكه" ${item.category === 'فواكه' ? 'selected' : ''}>فواكه</option>
                        <option value="حبوب" ${item.category === 'حبوب' ? 'selected' : ''}>حبوب</option>
                        <option value="منتجات ألبان" ${item.category === 'منتجات ألبان' ? 'selected' : ''}>منتجات ألبان</option>
                        <option value="مشروبات" ${item.category === 'مشروبات' ? 'selected' : ''}>مشروبات</option>
                        <option value="أخرى" ${item.category === 'أخرى' ? 'selected' : ''}>أخرى</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الكمية *</label>
                    <input type="number" name="quantity" class="form-input" value="${item.quantity}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الوحدة *</label>
                    <input type="text" name="unit" class="form-input" value="${item.unit}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الحد الأدنى</label>
                    <input type="number" name="min_quantity" class="form-input" value="${item.min_quantity || 10}" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">سعر الشراء *</label>
                    <input type="number" name="purchase_price" class="form-input" value="${item.purchase_price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">سعر البيع *</label>
                    <input type="number" name="sell_price" class="form-input" value="${item.sell_price}" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">تاريخ انتهاء الصلاحية *</label>
                <input type="date" name="expiry_date" class="form-input" value="${item.expiry_date?.split('T')[0]}" required>
            </div>
        </form>
    `;

    showModal('تعديل الصنف', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("editItemForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function updateItem(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const item = {
        id: id,
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: parseFloat(formData.get('quantity')),
        unit: formData.get('unit'),
        min_quantity: parseFloat(formData.get('min_quantity')) || 10,
        purchase_price: parseFloat(formData.get('purchase_price')),
        sell_price: parseFloat(formData.get('sell_price')),
        expiry_date: formData.get('expiry_date')
    };

    await db.update('inventory_items', item);
    showToast('تم تحديث الصنف بنجاح', 'success');
    closeModal();
    loadInventory();
}

async function deleteItem(id) {
    if (await confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
        await db.delete('inventory_items', id);
        showToast('تم حذف الصنف بنجاح', 'success');
        loadInventory();
    }
}

// حركة المخزون
async function showInventoryMovements() {
    const movements = await db.getAll('inventory_movements');
    const content = document.getElementById('inventoryContent');

    const totalIn = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.total_cost, 0);
    const totalOut = movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.total_cost, 0);

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">حركة المخزون</h3>
                <button class="btn btn-primary" onclick="showMovementSelectItem()">➕ إضافة حركة</button>
            </div>

            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 1.5rem;">
                <div class="stat-card" style="border-color: var(--success);">
                    <div class="stat-label">إجمالي الوارد</div>
                    <div class="stat-value" style="color: var(--success);">${formatCurrency(totalIn)}</div>
                </div>
                <div class="stat-card" style="border-color: var(--error);">
                    <div class="stat-label">إجمالي الصادر</div>
                    <div class="stat-value" style="color: var(--error);">${formatCurrency(totalOut)}</div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الصنف</th>
                            <th>النوع</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>التكلفة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movements.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد حركات</td></tr>' :
                          movements.reverse().map(m => `
                            <tr>
                                <td>${formatDate(m.date)}</td>
                                <td>${m.item_name}</td>
                                <td><span class="badge ${m.type === 'in' ? 'text-success' : 'text-error'}">${m.type === 'in' ? 'وارد' : 'صادر'}</span></td>
                                <td>${m.quantity} ${m.unit}</td>
                                <td>${formatCurrency(m.price)}</td>
                                <td class="${m.type === 'in' ? 'text-success' : 'text-error'}">${formatCurrency(m.total_cost)}</td>
                                <td>${m.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showMovementSelectItem() {
    const items = await db.getAll('inventory_items');
    
    const formHTML = `
        <div class="form-group">
            <label class="form-label">اختر الصنف</label>
            <select id="movementItemSelect" class="form-select">
                <option value="">اختر صنف</option>
                ${items.map(item => `
                    <option value="${item.id}">${item.name} (${item.quantity} ${item.unit})</option>
                `).join('')}
            </select>
        </div>
        <button class="btn btn-primary mt-2" onclick="proceedToMovementForm()">التالي</button>
    `;

    showModal('اختيار الصنف', formHTML);
}

async function proceedToMovementForm() {
    const itemId = document.getElementById('movementItemSelect').value;
    if (!itemId) {
        showToast('الرجاء اختيار صنف', 'warning');
        return;
    }
    await showMovementForm(parseInt(itemId));
}

async function showMovementForm(itemId) {
    const item = await db.getById('inventory_items', itemId);
    
    const formHTML = `
        <form id="movementForm" onsubmit="saveMovement(event, ${itemId})">
            <div class="alert alert-info">
                الصنف: <strong>${item.name}</strong> | الكمية الحالية: <strong>${item.quantity} ${item.unit}</strong>
            </div>
            
            <div class="form-group">
                <label class="form-label">نوع الحركة *</label>
                <select name="type" class="form-select" required onchange="updateMovementType(this.value)">
                    <option value="in">وارد (إضافة للمخزون)</option>
                    <option value="out">صادر (خصم من المخزون)</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الكمية *</label>
                    <input type="number" name="quantity" class="form-input" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">السعر/الوحدة *</label>
                    <input type="number" name="price" id="movementPrice" class="form-input" step="0.01" min="0" value="${item.purchase_price}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea name="notes" class="form-textarea" rows="2"></textarea>
            </div>
            
            <div id="movementTotal" class="stat-card mt-2">
                <div class="stat-label">التكلفة الإجمالية</div>
                <div class="stat-value">0.00 ر.س</div>
            </div>
        </form>
    `;

    showModal('حركة المخزون', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("movementForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);

    // Calculate total on input
    document.querySelectorAll('input[name="quantity"], input[name="price"]').forEach(input => {
        input.addEventListener('input', () => {
            const qty = parseFloat(document.querySelector('input[name="quantity"]').value) || 0;
            const price = parseFloat(document.querySelector('input[name="price"]').value) || 0;
            const total = qty * price;
            document.querySelector('#movementTotal .stat-value').textContent = formatCurrency(total);
        });
    });
}

function updateMovementType(type) {
    const item = document.querySelector('.alert strong').textContent;
    if (type === 'out') {
        showToast('تأكد من الكمية المتاحة قبل الخصم', 'warning');
    }
}

async function saveMovement(event, itemId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const item = await db.getById('inventory_items', itemId);
    
    const type = formData.get('type');
    const quantity = parseFloat(formData.get('quantity'));
    const price = parseFloat(formData.get('price'));

    // التحقق من الكمية المتاحة
    if (type === 'out' && quantity > item.quantity) {
        showToast('الكمية المطلوبة أكبر من المتاح', 'error');
        return;
    }

    const movement = {
        date: new Date().toISOString(),
        item_id: itemId,
        item_name: item.name,
        unit: item.unit,
        type: type,
        quantity: quantity,
        price: price,
        total_cost: quantity * price,
        notes: formData.get('notes')
    };

    // تحديث الكمية
    item.quantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity;
    await db.update('inventory_items', item);
    await db.add('inventory_movements', movement);

    showToast('تم تسجيل الحركة بنجاح', 'success');
    closeModal();
    showInventoryMovements();
}

// جرد المخزون
async function showStockAudit() {
    const audits = await db.getAll('stock_audits');
    const content = document.getElementById('inventoryContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">جرد المخزون</h3>
                <button class="btn btn-primary" onclick="startStockAudit()">🔍 بدء جرد جديد</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>عدد الأصناف</th>
                            <th>الفرق (كمية)</th>
                            <th>الفرق (قيمة)</th>
                            <th>نسبة الدقة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${audits.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد عمليات جرد</td></tr>' :
                          audits.reverse().map(audit => {
                            const accuracy = audit.total_difference === 0 ? 100 : ((audit.total_system_qty - Math.abs(audit.total_difference)) / audit.total_system_qty * 100).toFixed(2);
                            return `
                            <tr>
                                <td>${formatDate(audit.date)}</td>
                                <td>${audit.items_count}</td>
                                <td class="${audit.total_difference >= 0 ? 'text-success' : 'text-error'}">${audit.total_difference}</td>
                                <td class="${audit.total_value_diff >= 0 ? 'text-success' : 'text-error'}">${formatCurrency(Math.abs(audit.total_value_diff))}</td>
                                <td>${accuracy}%</td>
                                <td><button class="btn-icon" onclick="viewAuditDetails(${audit.id})">👁️</button></td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function startStockAudit() {
    const items = await db.getAll('inventory_items');
    
    const formHTML = `
        <form id="auditForm" onsubmit="saveStockAudit(event)">
            <div class="alert alert-info">
                سيتم جرد جميع الأصناف (${items.length} صنف). أدخل الكميات الفعلية.
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>كمية النظام</th>
                            <th>الكمية الفعلية</th>
                            <th>الفرق</th>
                        </tr>
                    </thead>
                    <tbody id="auditTableBody">
                        ${items.map((item, index) => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>
                                    <input type="number" class="form-input" data-item-id="${item.id}" 
                                        data-system-qty="${item.quantity}" data-price="${item.purchase_price}"
                                        step="0.01" min="0" value="${item.quantity}" 
                                        onchange="calculateAuditDiff(this)" style="width: 100px;">
                                </td>
                                <td class="diff-${item.id}">0</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="stats-grid mt-2">
                <div class="stat-card">
                    <div class="stat-label">إجمالي الفرق (كمية)</div>
                    <div class="stat-value" id="totalDiffQty">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">إجمالي الفرق (قيمة)</div>
                    <div class="stat-value" id="totalDiffValue">0.00 ر.س</div>
                </div>
            </div>
        </form>
    `;

    showModal('جرد المخزون', formHTML, [
        { text: 'حفظ الجرد', class: 'btn-primary', onclick: 'document.getElementById("auditForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

function calculateAuditDiff(input) {
    const systemQty = parseFloat(input.dataset.systemQty);
    const actualQty = parseFloat(input.value) || 0;
    const diff = actualQty - systemQty;
    
    const diffCell = document.querySelector(`.diff-${input.dataset.itemId}`);
    diffCell.textContent = diff;
    diffCell.className = diff >= 0 ? 'text-success' : 'text-error';

    // حساب الإجمالي
    let totalDiff = 0;
    let totalValueDiff = 0;
    document.querySelectorAll('#auditTableBody input').forEach(inp => {
        const sysQty = parseFloat(inp.dataset.systemQty);
        const actQty = parseFloat(inp.value) || 0;
        const price = parseFloat(inp.dataset.price);
        const d = actQty - sysQty;
        totalDiff += d;
        totalValueDiff += (d * price);
    });

    document.getElementById('totalDiffQty').textContent = totalDiff;
    document.getElementById('totalDiffQty').className = 'stat-value ' + (totalDiff >= 0 ? 'text-success' : 'text-error');
    document.getElementById('totalDiffValue').textContent = formatCurrency(Math.abs(totalValueDiff));
    document.getElementById('totalDiffValue').className = 'stat-value ' + (totalValueDiff >= 0 ? 'text-success' : 'text-error');
}

async function saveStockAudit(event) {
    event.preventDefault();
    const inputs = document.querySelectorAll('#auditTableBody input');
    
    const auditItems = [];
    let totalSystemQty = 0;
    let totalActualQty = 0;
    let totalDifference = 0;
    let totalValueDiff = 0;

    for (const input of inputs) {
        const itemId = parseInt(input.dataset.itemId);
        const systemQty = parseFloat(input.dataset.systemQty);
        const actualQty = parseFloat(input.value) || 0;
        const price = parseFloat(input.dataset.price);
        const diff = actualQty - systemQty;

        auditItems.push({
            item_id: itemId,
            system_qty: systemQty,
            actual_qty: actualQty,
            difference: diff,
            value_diff: diff * price
        });

        totalSystemQty += systemQty;
        totalActualQty += actualQty;
        totalDifference += diff;
        totalValueDiff += (diff * price);

        // تحديث الكمية في النظام
        const item = await db.getById('inventory_items', itemId);
        item.quantity = actualQty;
        await db.update('inventory_items', item);
    }

    const audit = {
        date: new Date().toISOString(),
        items_count: auditItems.length,
        total_system_qty: totalSystemQty,
        total_actual_qty: totalActualQty,
        total_difference: totalDifference,
        total_value_diff: totalValueDiff,
        items: JSON.stringify(auditItems)
    };

    await db.add('stock_audits', audit);
    showToast('تم حفظ الجرد بنجاح', 'success');
    closeModal();
    showStockAudit();
}

async function viewAuditDetails(id) {
    const audit = await db.getById('stock_audits', id);
    let items = [];
    try {
        items = typeof audit.items === 'string' ? JSON.parse(audit.items) : audit.items;
    } catch (error) {
        console.error('Error parsing audit items:', error);
        items = [];
    }
    
    const detailsHTML = `
        <div class="stats-grid mb-2">
            <div class="stat-card">
                <div class="stat-label">التاريخ</div>
                <div class="stat-value">${formatDate(audit.date)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">الفرق الإجمالي</div>
                <div class="stat-value ${audit.total_difference >= 0 ? 'text-success' : 'text-error'}">
                    ${audit.total_difference}
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>الصنف</th>
                        <th>كمية النظام</th>
                        <th>الكمية الفعلية</th>
                        <th>الفرق</th>
                        <th>قيمة الفرق</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.item_id}</td>
                            <td>${item.system_qty}</td>
                            <td>${item.actual_qty}</td>
                            <td class="${item.difference >= 0 ? 'text-success' : 'text-error'}">${item.difference}</td>
                            <td class="${item.value_diff >= 0 ? 'text-success' : 'text-error'}">${formatCurrency(Math.abs(item.value_diff))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    showModal('تفاصيل الجرد', detailsHTML);
}

// الهدر والفاقد
async function showWasteRecords() {
    const waste = await db.getAll('waste_records');
    const content = document.getElementById('inventoryContent');

    const totalWaste = waste.reduce((sum, w) => sum + w.total_cost, 0);
    const wasteByReason = {};
    waste.forEach(w => {
        wasteByReason[w.reason] = (wasteByReason[w.reason] || 0) + w.total_cost;
    });

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">الهدر والفاقد</h3>
                <button class="btn btn-warning" onclick="showWasteForm()">➕ تسجيل هدر</button>
            </div>

            <div class="stats-grid" style="margin-bottom: 1.5rem;">
                <div class="stat-card" style="border-color: var(--error);">
                    <div class="stat-label">إجمالي قيمة الهدر</div>
                    <div class="stat-value" style="color: var(--error);">${formatCurrency(totalWaste)}</div>
                </div>
                <div class="stat-card" style="border-color: var(--warning);">
                    <div class="stat-label">عدد الحالات</div>
                    <div class="stat-value" style="color: var(--warning);">${waste.length}</div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>التكلفة</th>
                            <th>السبب</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${waste.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد سجلات هدر</td></tr>' :
                          waste.reverse().map(w => `
                            <tr>
                                <td>${formatDate(w.date)}</td>
                                <td>${w.item_name}</td>
                                <td>${w.quantity} ${w.unit}</td>
                                <td class="text-error">${formatCurrency(w.total_cost)}</td>
                                <td><span class="badge">${w.reason}</span></td>
                                <td>${w.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showWasteForm() {
    const items = await db.getAll('inventory_items');
    
    const formHTML = `
        <form id="wasteForm" onsubmit="saveWaste(event)">
            <div class="form-group">
                <label class="form-label">الصنف *</label>
                <select name="item_id" class="form-select" required onchange="updateWasteItem(this)">
                    <option value="">اختر صنف</option>
                    ${items.map(item => `
                        <option value="${item.id}" data-price="${item.purchase_price}" data-qty="${item.quantity}" data-unit="${item.unit}">
                            ${item.name} (${item.quantity} ${item.unit})
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الكمية *</label>
                    <input type="number" name="quantity" id="wasteQty" class="form-input" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">سعر الوحدة</label>
                    <input type="number" name="price" id="wastePrice" class="form-input" step="0.01" readonly>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">السبب *</label>
                <select name="reason" class="form-select" required>
                    <option value="">اختر السبب</option>
                    <option value="انتهاء الصلاحية">انتهاء الصلاحية</option>
                    <option value="تلف">تلف</option>
                    <option value="كسر">كسر</option>
                    <option value="فقد">فقد</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea name="notes" class="form-textarea" rows="2"></textarea>
            </div>
            
            <div id="wasteCost" class="stat-card">
                <div class="stat-label">تكلفة الهدر</div>
                <div class="stat-value text-error">0.00 ر.س</div>
            </div>
        </form>
    `;

    showModal('تسجيل الهدر', formHTML, [
        { text: 'حفظ', class: 'btn-warning', onclick: 'document.getElementById("wasteForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

function updateWasteItem(select) {
    const option = select.selectedOptions[0];
    if (option) {
        document.getElementById('wastePrice').value = option.dataset.price;
        document.getElementById('wasteQty').max = option.dataset.qty;
        
        document.getElementById('wasteQty').addEventListener('input', function() {
            const qty = parseFloat(this.value) || 0;
            const price = parseFloat(document.getElementById('wastePrice').value) || 0;
            document.querySelector('#wasteCost .stat-value').textContent = formatCurrency(qty * price);
        });
    }
}

async function saveWaste(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const itemId = parseInt(formData.get('item_id'));
    const item = await db.getById('inventory_items', itemId);
    const quantity = parseFloat(formData.get('quantity'));
    const price = parseFloat(formData.get('price'));

    if (quantity > item.quantity) {
        showToast('الكمية أكبر من المتاح', 'error');
        return;
    }

    const waste = {
        date: new Date().toISOString(),
        item_id: itemId,
        item_name: item.name,
        unit: item.unit,
        quantity: quantity,
        price: price,
        total_cost: quantity * price,
        reason: formData.get('reason'),
        notes: formData.get('notes')
    };

    // تحديث الكمية
    item.quantity -= quantity;
    await db.update('inventory_items', item);
    await db.add('waste_records', waste);

    showToast('تم تسجيل الهدر بنجاح', 'success');
    closeModal();
    showWasteRecords();
}
