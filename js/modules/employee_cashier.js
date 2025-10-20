// Employee Cashier Module - كاشير الموظفين
async function loadEmployeeCashier() {
    const contentArea = document.getElementById('content-area');
    const meals = await db.getAll('employee_meals') || [];
    const orders = await db.getAll('employee_meal_orders') || [];
    
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
    });
    
    const totalToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
    
    contentArea.innerHTML = `
        <h2 class="mb-3">🍽️ كاشير الموظفين</h2>

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
                <div class="stat-label">عدد الوجبات</div>
                <div class="stat-value" style="color: var(--info);">${meals.length}</div>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showMealManagement()">🍽️ إدارة الوجبات</button>
            <button class="btn btn-success" onclick="showNewMealOrder()">➕ طلب جديد</button>
            <button class="btn btn-secondary" onclick="showMealOrdersHistory()">📋 سجل الطلبات</button>
        </div>

        <div id="employeeCashierContent"></div>
    `;

    showMealManagement();
}

async function showMealManagement() {
    const meals = await db.getAll('employee_meals');
    const content = document.getElementById('employeeCashierContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">إدارة الوجبات</h3>
                <button class="btn btn-primary" onclick="showAddMealForm()">➕ إضافة وجبة</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>كود</th>
                            <th>اسم الوجبة</th>
                            <th>السعر</th>
                            <th>الفئة</th>
                            <th>الوصف</th>
                            <th>متوفرة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meals.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد وجبات</td></tr>' :
                          meals.map(meal => `
                            <tr>
                                <td>${meal.id}</td>
                                <td>${meal.name}</td>
                                <td>${formatCurrency(meal.price)}</td>
                                <td>${meal.category || '-'}</td>
                                <td>${meal.description || '-'}</td>
                                <td><span class="badge ${meal.available ? 'text-success' : 'text-error'}">${meal.available ? 'متوفرة' : 'غير متوفرة'}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="editMeal(${meal.id})" title="تعديل">✏️</button>
                                    <button class="btn-icon" onclick="toggleMealAvailability(${meal.id}, ${!meal.available})" title="${meal.available ? 'إيقاف' : 'تفعيل'}">${meal.available ? '🔴' : '🟢'}</button>
                                    <button class="btn-icon" onclick="deleteMeal(${meal.id})" title="حذف">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddMealForm() {
    const formHTML = `
        <form id="mealForm" onsubmit="saveMeal(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم الوجبة *</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">السعر *</label>
                    <input type="number" name="price" class="form-input" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الفئة</label>
                    <select name="category" class="form-select">
                        <option value="">اختر الفئة</option>
                        <option value="إفطار">إفطار</option>
                        <option value="غداء">غداء</option>
                        <option value="عشاء">عشاء</option>
                        <option value="وجبات خفيفة">وجبات خفيفة</option>
                        <option value="مشروبات">مشروبات</option>
                        <option value="حلويات">حلويات</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">متوفرة</label>
                    <select name="available" class="form-select">
                        <option value="true">نعم</option>
                        <option value="false">لا</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">الوصف</label>
                <textarea name="description" class="form-input" rows="3"></textarea>
            </div>
        </form>
    `;

    showModal('إضافة وجبة جديدة', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("mealForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveMeal(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const meal = {
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        description: formData.get('description'),
        available: formData.get('available') === 'true'
    };

    await db.add('employee_meals', meal);
    showToast('تم إضافة الوجبة بنجاح', 'success');
    closeModal();
    showMealManagement();
}

async function editMeal(id) {
    const meal = await db.getById('employee_meals', id);
    
    const formHTML = `
        <form id="editMealForm" onsubmit="updateMeal(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">اسم الوجبة *</label>
                    <input type="text" name="name" class="form-input" value="${meal.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">السعر *</label>
                    <input type="number" name="price" class="form-input" value="${meal.price}" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الفئة</label>
                    <select name="category" class="form-select">
                        <option value="">اختر الفئة</option>
                        <option value="إفطار" ${meal.category === 'إفطار' ? 'selected' : ''}>إفطار</option>
                        <option value="غداء" ${meal.category === 'غداء' ? 'selected' : ''}>غداء</option>
                        <option value="عشاء" ${meal.category === 'عشاء' ? 'selected' : ''}>عشاء</option>
                        <option value="وجبات خفيفة" ${meal.category === 'وجبات خفيفة' ? 'selected' : ''}>وجبات خفيفة</option>
                        <option value="مشروبات" ${meal.category === 'مشروبات' ? 'selected' : ''}>مشروبات</option>
                        <option value="حلويات" ${meal.category === 'حلويات' ? 'selected' : ''}>حلويات</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">متوفرة</label>
                    <select name="available" class="form-select">
                        <option value="true" ${meal.available ? 'selected' : ''}>نعم</option>
                        <option value="false" ${!meal.available ? 'selected' : ''}>لا</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">الوصف</label>
                <textarea name="description" class="form-input" rows="3">${meal.description || ''}</textarea>
            </div>
        </form>
    `;

    showModal('تعديل الوجبة', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("editMealForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function updateMeal(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const meal = await db.getById('employee_meals', id);
    meal.name = formData.get('name');
    meal.price = parseFloat(formData.get('price'));
    meal.category = formData.get('category');
    meal.description = formData.get('description');
    meal.available = formData.get('available') === 'true';

    await db.update('employee_meals', meal);
    showToast('تم تحديث الوجبة بنجاح', 'success');
    closeModal();
    showMealManagement();
}

async function toggleMealAvailability(id, available) {
    const meal = await db.getById('employee_meals', id);
    meal.available = available;
    await db.update('employee_meals', meal);
    showToast(available ? 'تم تفعيل الوجبة' : 'تم إيقاف الوجبة', 'success');
    showMealManagement();
}

async function deleteMeal(id) {
    if (await confirm('هل أنت متأكد من حذف هذه الوجبة؟')) {
        await db.delete('employee_meals', id);
        showToast('تم حذف الوجبة بنجاح', 'success');
        showMealManagement();
    }
}

async function showNewMealOrder() {
    const employees = await db.getAll('employees').then(e => e.filter(emp => emp.status === 'active'));
    const meals = await db.getAll('employee_meals').then(m => m.filter(meal => meal.available));
    const content = document.getElementById('employeeCashierContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">طلب وجبة جديد</h3>
            </div>

            <div class="form-row mb-2">
                <div class="form-group">
                    <label class="form-label">الموظف *</label>
                    <select id="employeeSelect" class="form-select" required>
                        <option value="">اختر الموظف</option>
                        ${employees.map(emp => `
                            <option value="${emp.id}" data-name="${emp.name}">${emp.name} - ${emp.position}</option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div id="mealOrderItems" class="mb-2">
                <h4>الوجبات المطلوبة:</h4>
                <div id="selectedMeals" style="min-height: 100px; border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
                    <p style="color: var(--text-secondary); text-align: center;">لم يتم اختيار وجبات بعد</p>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <h4>الإجمالي: <span id="mealOrderTotal">0.00 ر.س</span></h4>
                </div>
            </div>

            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>الوجبة</th>
                            <th>الفئة</th>
                            <th>السعر</th>
                            <th>إضافة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meals.length === 0 ? '<tr><td colspan="4" class="text-center">لا توجد وجبات متوفرة</td></tr>' :
                          meals.map(meal => `
                            <tr>
                                <td>${meal.name}</td>
                                <td>${meal.category || '-'}</td>
                                <td>${formatCurrency(meal.price)}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="addMealToOrder(${meal.id}, '${meal.name}', ${meal.price})">➕</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="submitMealOrder()">✅ تأكيد الطلب وإضافته لحساب الموظف</button>
                <button class="btn btn-secondary" onclick="clearMealOrder()">🗑️ مسح الطلب</button>
            </div>
        </div>
    `;
    
    window.mealOrder = { items: [], total: 0 };
}

function addMealToOrder(id, name, price) {
    const quantity = prompt(`الكمية من ${name}`, '1');
    
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
        return;
    }
    
    const qty = parseInt(quantity);
    
    window.mealOrder.items.push({
        id: id,
        name: name,
        price: price,
        quantity: qty,
        total: price * qty
    });
    
    window.mealOrder.total += price * qty;
    
    updateSelectedMeals();
}

function updateSelectedMeals() {
    const container = document.getElementById('selectedMeals');
    const totalElement = document.getElementById('mealOrderTotal');
    
    if (window.mealOrder.items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">لم يتم اختيار وجبات بعد</p>';
        totalElement.textContent = formatCurrency(0);
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%;">
            <thead>
                <tr>
                    <th>الوجبة</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>المجموع</th>
                    <th>إجراء</th>
                </tr>
            </thead>
            <tbody>
                ${window.mealOrder.items.map((item, index) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${formatCurrency(item.total)}</td>
                        <td>
                            <button class="btn-icon" onclick="removeMealFromOrder(${index})" title="حذف">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    totalElement.textContent = formatCurrency(window.mealOrder.total);
}

function removeMealFromOrder(index) {
    const item = window.mealOrder.items[index];
    window.mealOrder.total -= item.total;
    window.mealOrder.items.splice(index, 1);
    updateSelectedMeals();
}

function clearMealOrder() {
    if (confirm('هل تريد مسح الطلب؟')) {
        window.mealOrder = { items: [], total: 0 };
        updateSelectedMeals();
    }
}

async function submitMealOrder() {
    const employeeSelect = document.getElementById('employeeSelect');
    const employeeId = employeeSelect.value;
    const employeeName = employeeSelect.options[employeeSelect.selectedIndex]?.dataset?.name;
    
    if (!employeeId) {
        showToast('الرجاء اختيار الموظف', 'error');
        return;
    }
    
    if (window.mealOrder.items.length === 0) {
        showToast('الرجاء اختيار وجبات للطلب', 'error');
        return;
    }
    
    const order = {
        employee_id: parseInt(employeeId),
        employee_name: employeeName,
        items: window.mealOrder.items,
        total: window.mealOrder.total,
        created_at: new Date().toISOString(),
        paid: false
    };
    
    const orderId = await db.add('employee_meal_orders', order);
    
    const employee = await db.getById('employees', parseInt(employeeId));
    if (!employee.meal_balance) {
        employee.meal_balance = 0;
    }
    employee.meal_balance -= window.mealOrder.total;
    await db.update('employees', employee);
    
    printMealOrder(orderId, order);
    
    showToast(`تم تسجيل الطلب وخصم ${formatCurrency(window.mealOrder.total)} من حساب ${employeeName}`, 'success');
    
    window.mealOrder = { items: [], total: 0 };
    loadEmployeeCashier();
}

function printMealOrder(orderId, order) {
    const printContent = `
        <div style="font-family: Arial; padding: 20px; direction: rtl;">
            <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
                فاتورة وجبة موظف
            </h2>
            <p><strong>رقم الفاتورة:</strong> ${orderId}</p>
            <p><strong>الموظف:</strong> ${order.employee_name}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>الوقت:</strong> ${formatTime(order.created_at)}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #000;">
                        <th style="text-align: right; padding: 8px;">الوجبة</th>
                        <th style="text-align: center; padding: 8px;">الكمية</th>
                        <th style="text-align: center; padding: 8px;">السعر</th>
                        <th style="text-align: center; padding: 8px;">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr style="border-bottom: 1px solid #ccc;">
                            <td style="text-align: right; padding: 8px;">${item.name}</td>
                            <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                            <td style="text-align: center; padding: 8px;">${formatCurrency(item.price)}</td>
                            <td style="text-align: center; padding: 8px;">${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 20px;">
                <h3 style="text-align: center;">الإجمالي: ${formatCurrency(order.total)}</h3>
            </div>
            
            <p style="text-align: center; margin-top: 30px; font-size: 0.9em;">
                تم خصم المبلغ من حساب الموظف
            </p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

async function showMealOrdersHistory() {
    const orders = await db.getAll('employee_meal_orders');
    const content = document.getElementById('employeeCashierContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">سجل طلبات الوجبات</h3>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>رقم</th>
                            <th>التاريخ</th>
                            <th>الموظف</th>
                            <th>عدد الوجبات</th>
                            <th>الإجمالي</th>
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
                                <td>${order.employee_name}</td>
                                <td>${order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                                <td>${formatCurrency(order.total)}</td>
                                <td>
                                    <button class="btn-icon" onclick="showMealOrderDetails(${order.id})" title="تفاصيل">👁️</button>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="reprintMealOrder(${order.id})" title="طباعة">🖨️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showMealOrderDetails(orderId) {
    const order = await db.getById('employee_meal_orders', orderId);
    
    const detailsHTML = `
        <div>
            <p><strong>الموظف:</strong> ${order.employee_name}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.created_at)} - ${formatTime(order.created_at)}</p>
            <p><strong>الإجمالي:</strong> ${formatCurrency(order.total)}</p>
            
            <h4>الوجبات:</h4>
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>الوجبة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    showModal(`تفاصيل الطلب #${orderId}`, detailsHTML);
}

async function reprintMealOrder(orderId) {
    const order = await db.getById('employee_meal_orders', orderId);
    printMealOrder(orderId, order);
    showToast('تم إعادة طباعة الفاتورة', 'success');
}
