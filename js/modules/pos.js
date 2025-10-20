// POS Module - نقطة الكاشير للأقسام
async function loadPOS() {
    const contentArea = document.getElementById('content-area');
    const orders = await db.getAll('pos_orders') || [];
    
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
    });
    
    const totalToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
    
    contentArea.innerHTML = `
        <h2 class="mb-3">🧾 نقطة الكاشير - طلبات الأقسام</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">طلبات اليوم</div>
                <div class="stat-value">${todayOrders.length}</div>
            </div>
            <div class="stat-card" style="border-color: var(--success);">
                <div class="stat-label">إجمالي اليوم</div>
                <div class="stat-value" style="color: var(--success);">${formatCurrency(totalToday)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--info);">
                <div class="stat-label">إجمالي الطلبات</div>
                <div class="stat-value" style="color: var(--info);">${orders.length}</div>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showNewOrderForm()">➕ طلب جديد</button>
            <button class="btn btn-secondary" onclick="showOrdersHistory()">📋 سجل الطلبات</button>
        </div>

        <div id="posContent"></div>
    `;

    showNewOrderForm();
}

async function showNewOrderForm() {
    const items = await db.getAll('inventory_items');
    const content = document.getElementById('posContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">طلب جديد</h3>
            </div>

            <div class="form-row mb-2">
                <div class="form-group">
                    <label class="form-label">القسم الطالب *</label>
                    <select id="departmentSelect" class="form-select" required>
                        <option value="">اختر القسم</option>
                        <option value="الشاورما">الشاورما</option>
                        <option value="المشويات">المشويات</option>
                        <option value="المطبخ">المطبخ</option>
                        <option value="البيتزا">البيتزا</option>
                        <option value="الحلويات">الحلويات</option>
                        <option value="المشروبات">المشروبات</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">بحث عن صنف</label>
                    <input type="text" id="searchPOSItems" class="form-input" placeholder="بحث بالاسم أو الرقم..." 
                        oninput="searchPOSItems(this.value)">
                </div>
            </div>

            <div id="orderItems" class="mb-2">
                <h4>الأصناف المطلوبة:</h4>
                <div id="selectedItems" style="min-height: 100px; border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
                    <p style="color: var(--text-secondary); text-align: center;">لم يتم اختيار أصناف بعد</p>
                </div>
            </div>

            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table id="posItemsTable">
                    <thead>
                        <tr>
                            <th>كود</th>
                            <th>الصنف</th>
                            <th>الفئة</th>
                            <th>المتوفر</th>
                            <th>الوحدة</th>
                            <th>إضافة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderPOSItems(items)}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="submitPOSOrder()">✅ تأكيد وطباعة الطلب</button>
                <button class="btn btn-secondary" onclick="clearPOSOrder()">🗑️ مسح الطلب</button>
            </div>
        </div>
    `;
    
    window.posOrder = { items: [] };
}

function renderPOSItems(items) {
    if (items.length === 0) {
        return '<tr><td colspan="6" class="text-center">لا توجد أصناف</td></tr>';
    }

    return items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="${item.quantity < 10 ? 'text-warning' : ''}">${item.quantity}</td>
            <td>${item.unit}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="addItemToPOSOrder(${item.id}, '${item.name}', ${item.quantity}, '${item.unit}')">➕</button>
            </td>
        </tr>
    `).join('');
}

function searchPOSItems(query) {
    db.getAll('inventory_items').then(items => {
        const filtered = items.filter(item => {
            const searchTerm = query.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchTerm) ||
                (item.category && item.category.toLowerCase().includes(searchTerm)) ||
                item.id.toString().includes(searchTerm)
            );
        });
        document.querySelector('#posItemsTable tbody').innerHTML = renderPOSItems(filtered);
    });
}

function addItemToPOSOrder(id, name, available, unit) {
    const existingItem = window.posOrder.items.find(i => i.id === id);
    
    if (existingItem) {
        showToast('هذا الصنف موجود بالفعل في الطلب', 'warning');
        return;
    }
    
    const quantity = prompt(`الكمية المطلوبة من ${name}\nالمتوفر: ${available} ${unit}`, '1');
    
    if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
        return;
    }
    
    const requestedQty = parseFloat(quantity);
    
    if (requestedQty > available) {
        showToast('الكمية المطلوبة أكبر من المتوفر', 'error');
        return;
    }
    
    window.posOrder.items.push({
        id: id,
        name: name,
        quantity: requestedQty,
        unit: unit
    });
    
    updateSelectedItems();
}

function updateSelectedItems() {
    const container = document.getElementById('selectedItems');
    
    if (window.posOrder.items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">لم يتم اختيار أصناف بعد</p>';
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%;">
            <thead>
                <tr>
                    <th>الصنف</th>
                    <th>الكمية</th>
                    <th>الوحدة</th>
                    <th>إجراء</th>
                </tr>
            </thead>
            <tbody>
                ${window.posOrder.items.map((item, index) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>
                            <button class="btn-icon" onclick="removeItemFromPOSOrder(${index})" title="حذف">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function removeItemFromPOSOrder(index) {
    window.posOrder.items.splice(index, 1);
    updateSelectedItems();
}

function clearPOSOrder() {
    if (confirm('هل تريد مسح الطلب؟')) {
        window.posOrder = { items: [] };
        updateSelectedItems();
    }
}

async function submitPOSOrder() {
    const department = document.getElementById('departmentSelect').value;
    
    if (!department) {
        showToast('الرجاء اختيار القسم الطالب', 'error');
        return;
    }
    
    if (window.posOrder.items.length === 0) {
        showToast('الرجاء اختيار أصناف للطلب', 'error');
        return;
    }
    
    const order = {
        department: department,
        items: window.posOrder.items,
        total: 0,
        created_at: new Date().toISOString(),
        printed: false
    };
    
    for (const item of window.posOrder.items) {
        const inventoryItem = await db.getById('inventory_items', item.id);
        inventoryItem.quantity -= item.quantity;
        await db.update('inventory_items', inventoryItem);
        
        await db.add('inventory_movements', {
            item_id: item.id,
            item_name: item.name,
            type: 'out',
            quantity: item.quantity,
            reason: `طلب قسم ${department}`,
            date: new Date().toISOString()
        });
    }
    
    const orderId = await db.add('pos_orders', order);
    
    printPOSOrder(orderId, order);
    
    showToast('تم تسجيل الطلب وخصمه من المخزون بنجاح', 'success');
    
    window.posOrder = { items: [] };
    loadPOS();
}

function printPOSOrder(orderId, order) {
    const printContent = `
        <div style="font-family: Arial; padding: 20px; direction: rtl;">
            <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
                طلب قسم ${order.department}
            </h2>
            <p><strong>رقم الطلب:</strong> ${orderId}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>الوقت:</strong> ${formatTime(order.created_at)}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #000;">
                        <th style="text-align: right; padding: 8px;">الصنف</th>
                        <th style="text-align: center; padding: 8px;">الكمية</th>
                        <th style="text-align: center; padding: 8px;">الوحدة</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr style="border-bottom: 1px solid #ccc;">
                            <td style="text-align: right; padding: 8px;">${item.name}</td>
                            <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                            <td style="text-align: center; padding: 8px;">${item.unit}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <p style="text-align: center; margin-top: 30px; font-size: 0.9em;">
                شكراً لاستخدام نظام إدارة المطعم
            </p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

async function showOrdersHistory() {
    const orders = await db.getAll('pos_orders');
    const content = document.getElementById('posContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">سجل الطلبات</h3>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>رقم</th>
                            <th>التاريخ</th>
                            <th>الوقت</th>
                            <th>القسم</th>
                            <th>عدد الأصناف</th>
                            <th>تفاصيل</th>
                            <th>طباعة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد طلبات</td></tr>' :
                          orders.reverse().map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${formatDate(order.created_at)}</td>
                                <td>${formatTime(order.created_at)}</td>
                                <td>${order.department}</td>
                                <td>${order.items.length}</td>
                                <td>
                                    <button class="btn-icon" onclick="showOrderDetails(${order.id})" title="تفاصيل">👁️</button>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="reprintPOSOrder(${order.id})" title="طباعة">🖨️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showOrderDetails(orderId) {
    const order = await db.getById('pos_orders', orderId);
    
    const detailsHTML = `
        <div>
            <p><strong>القسم:</strong> ${order.department}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.created_at)} - ${formatTime(order.created_at)}</p>
            
            <h4>الأصناف:</h4>
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>الصنف</th>
                        <th>الكمية</th>
                        <th>الوحدة</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    showModal(`تفاصيل الطلب #${orderId}`, detailsHTML);
}

async function reprintPOSOrder(orderId) {
    const order = await db.getById('pos_orders', orderId);
    printPOSOrder(orderId, order);
    showToast('تم إعادة طباعة الطلب', 'success');
}
