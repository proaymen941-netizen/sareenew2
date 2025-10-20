// Employees Module - Enhanced Version
async function loadEmployees() {
    const contentArea = document.getElementById('content-area');
    const employees = await db.getAll('employees');
    const salaries = await db.getAll('salaries');
    
    const totalSalaries = salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    contentArea.innerHTML = `
        <h2 class="mb-3">👥 إدارة الموظفين المتقدم</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">إجمالي الموظفين</div>
                <div class="stat-value">${employees.length}</div>
            </div>
            <div class="stat-card" style="border-color: var(--success);">
                <div class="stat-label">الموظفون النشطون</div>
                <div class="stat-value" style="color: var(--success);">${activeEmployees}</div>
            </div>
            <div class="stat-card" style="border-color: var(--error);">
                <div class="stat-label">تكلفة العمالة الشهرية</div>
                <div class="stat-value" style="color: var(--error);">${formatCurrency(totalSalaries)}</div>
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showEmployeesList()">الموظفين</button>
            <button class="btn btn-secondary" onclick="showAttendance()">الحضور</button>
            <button class="btn btn-success" onclick="showSalaries()">الرواتب</button>
            <button class="btn btn-warning" onclick="showAdvances()">السلف</button>
            <button class="btn btn-info" onclick="showShifts()">المناوبات</button>
        </div>

        <div id="employeesContent"></div>
    `;

    showEmployeesList();
}

async function showEmployeesList() {
    const employees = await db.getAll('employees');
    const content = document.getElementById('employeesContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">قائمة الموظفين</h3>
                <button class="btn btn-primary" onclick="showAddEmployeeForm()">➕ إضافة موظف</button>
            </div>

            <div style="margin-bottom: 1rem;">
                <input type="text" id="searchEmployees" class="form-input" placeholder="بحث بالاسم أو الرقم..." 
                    oninput="searchEmployees(this.value)">
            </div>

            <div class="table-container">
                <table id="employeesTable">
                    <thead>
                        <tr>
                            <th>كود</th>
                            <th>الاسم</th>
                            <th>المنصب</th>
                            <th>القسم</th>
                            <th>الراتب الأساسي</th>
                            <th>تكلفة الساعة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.length === 0 ? '<tr><td colspan="8" class="text-center">لا يوجد موظفين</td></tr>' :
                          employees.map(emp => {
                            const hourCost = emp.salary / 176; // 22 يوم × 8 ساعات
                            return `
                            <tr>
                                <td>${emp.id}</td>
                                <td>${emp.name}</td>
                                <td>${emp.position || '-'}</td>
                                <td>${emp.department || '-'}</td>
                                <td>${formatCurrency(emp.salary || 0)}</td>
                                <td>${formatCurrency(hourCost)}</td>
                                <td><span class="badge ${emp.status === 'active' ? 'text-success' : 'text-error'}">${emp.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="editEmployee(${emp.id})" title="تعديل">✏️</button>
                                    <button class="btn-icon" onclick="viewEmployeeAccount(${emp.id})" title="كشف حساب">📊</button>
                                    <button class="btn-icon" onclick="deleteEmployee(${emp.id})" title="حذف">🗑️</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function searchEmployees(query) {
    db.getAll('employees').then(employees => {
        const filtered = employees.filter(emp => {
            const searchTerm = query.toLowerCase();
            return (
                (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
                emp.id.toString().includes(searchTerm) ||
                (emp.department && emp.department.toLowerCase().includes(searchTerm))
            );
        });
        
        const tbody = document.querySelector('#employeesTable tbody');
        if (tbody) {
            tbody.innerHTML = filtered.length === 0 ? '<tr><td colspan="8" class="text-center">لا توجد نتائج</td></tr>' :
              filtered.map(emp => {
                const hourCost = emp.salary / 176;
                return `
                <tr>
                    <td>${emp.id}</td>
                    <td>${emp.name}</td>
                    <td>${emp.position || '-'}</td>
                    <td>${emp.department || '-'}</td>
                    <td>${formatCurrency(emp.salary || 0)}</td>
                    <td>${formatCurrency(hourCost)}</td>
                    <td><span class="badge ${emp.status === 'active' ? 'text-success' : 'text-error'}">${emp.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="editEmployee(${emp.id})" title="تعديل">✏️</button>
                        <button class="btn-icon" onclick="viewEmployeeAccount(${emp.id})" title="كشف حساب">📊</button>
                        <button class="btn-icon" onclick="deleteEmployee(${emp.id})" title="حذف">🗑️</button>
                    </td>
                </tr>
            `}).join('');
        }
    });
}

function showAddEmployeeForm() {
    const formHTML = `
        <form id="employeeForm" onsubmit="saveEmployee(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الاسم الكامل *</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">المنصب *</label>
                    <input type="text" name="position" class="form-input" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">القسم</label>
                    <select name="department" class="form-select">
                        <option value="">اختر القسم</option>
                        <option value="المطبخ">المطبخ</option>
                        <option value="الخدمة">الخدمة</option>
                        <option value="المحاسبة">المحاسبة</option>
                        <option value="الإدارة">الإدارة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">الراتب الشهري *</label>
                    <input type="number" name="salary" class="form-input" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف *</label>
                    <input type="tel" name="phone" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">تاريخ التعيين</label>
                    <input type="date" name="hire_date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">الحالة *</label>
                <select name="status" class="form-select" required>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                </select>
            </div>
        </form>
    `;

    showModal('إضافة موظف جديد', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("employeeForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveEmployee(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const employee = {
        name: formData.get('name'),
        position: formData.get('position'),
        department: formData.get('department'),
        salary: parseFloat(formData.get('salary')),
        phone: formData.get('phone'),
        hire_date: formData.get('hire_date'),
        status: formData.get('status')
    };

    await db.add('employees', employee);
    showToast('تم إضافة الموظف بنجاح', 'success');
    closeModal();
    loadEmployees();
}

async function editEmployee(id) {
    const emp = await db.getById('employees', id);
    
    const formHTML = `
        <form id="editEmployeeForm" onsubmit="updateEmployee(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الاسم الكامل *</label>
                    <input type="text" name="name" class="form-input" value="${emp.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">المنصب *</label>
                    <input type="text" name="position" class="form-input" value="${emp.position || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">القسم</label>
                    <select name="department" class="form-select">
                        <option value="">اختر القسم</option>
                        <option value="المطبخ" ${emp.department === 'المطبخ' ? 'selected' : ''}>المطبخ</option>
                        <option value="الخدمة" ${emp.department === 'الخدمة' ? 'selected' : ''}>الخدمة</option>
                        <option value="المحاسبة" ${emp.department === 'المحاسبة' ? 'selected' : ''}>المحاسبة</option>
                        <option value="الإدارة" ${emp.department === 'الإدارة' ? 'selected' : ''}>الإدارة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">الراتب الشهري *</label>
                    <input type="number" name="salary" class="form-input" value="${emp.salary || 0}" step="0.01" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف *</label>
                    <input type="tel" name="phone" class="form-input" value="${emp.phone}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">تاريخ التعيين</label>
                    <input type="date" name="hire_date" class="form-input" value="${emp.hire_date?.split('T')[0] || ''}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">الحالة *</label>
                <select name="status" class="form-select" required>
                    <option value="active" ${emp.status === 'active' ? 'selected' : ''}>نشط</option>
                    <option value="inactive" ${emp.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
                </select>
            </div>
        </form>
    `;

    showModal('تعديل الموظف', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("editEmployeeForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function updateEmployee(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const employee = {
        id: id,
        name: formData.get('name'),
        position: formData.get('position'),
        department: formData.get('department'),
        salary: parseFloat(formData.get('salary')),
        phone: formData.get('phone'),
        hire_date: formData.get('hire_date'),
        status: formData.get('status')
    };

    await db.update('employees', employee);
    showToast('تم تحديث الموظف بنجاح', 'success');
    closeModal();
    loadEmployees();
}

async function deleteEmployee(id) {
    if (await confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        await db.delete('employees', id);
        showToast('تم حذف الموظف بنجاح', 'success');
        loadEmployees();
    }
}

// الحضور والانصراف
async function showAttendance() {
    const attendance = await db.getAll('attendance');
    const content = document.getElementById('employeesContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">الحضور والانصراف</h3>
                <button class="btn btn-primary" onclick="showAttendanceForm()">➕ تسجيل حضور</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الموظف</th>
                            <th>وقت الدخول</th>
                            <th>وقت الخروج</th>
                            <th>ساعات العمل</th>
                            <th>التأخير</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendance.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد سجلات حضور</td></tr>' :
                          attendance.reverse().slice(0, 50).map(att => {
                            const hours = att.hours_worked || 0;
                            const late = att.late_minutes || 0;
                            return `
                            <tr>
                                <td>${formatDate(att.date)}</td>
                                <td>${att.employee_name}</td>
                                <td>${formatTime(att.check_in)}</td>
                                <td>${att.check_out ? formatTime(att.check_out) : '-'}</td>
                                <td>${hours.toFixed(2)} ساعة</td>
                                <td class="${late > 0 ? 'text-warning' : ''}">${late > 0 ? late + ' دقيقة' : '-'}</td>
                                <td>${att.notes || '-'}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showAttendanceForm() {
    const employees = await db.getAll('employees').then(e => e.filter(emp => emp.status === 'active'));
    
    const formHTML = `
        <form id="attendanceForm" onsubmit="saveAttendance(event)">
            <div class="form-group">
                <label class="form-label">الموظف *</label>
                <select name="employee_id" class="form-select" required>
                    <option value="">اختر موظف</option>
                    ${employees.map(emp => `
                        <option value="${emp.id}" data-name="${emp.name}">${emp.name} - ${emp.position}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">التاريخ *</label>
                    <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">وقت الدخول *</label>
                    <input type="time" name="check_in" class="form-input" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">وقت الخروج</label>
                    <input type="time" name="check_out" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">دقائق التأخير</label>
                    <input type="number" name="late_minutes" class="form-input" min="0" value="0">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea name="notes" class="form-textarea" rows="2"></textarea>
            </div>
        </form>
    `;

    showModal('تسجيل الحضور', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("attendanceForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveAttendance(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const checkIn = new Date(formData.get('date') + 'T' + formData.get('check_in'));
    const checkOut = formData.get('check_out') ? new Date(formData.get('date') + 'T' + formData.get('check_out')) : null;
    
    const hoursWorked = checkOut ? (checkOut - checkIn) / (1000 * 60 * 60) : 0;
    
    const select = document.querySelector('select[name="employee_id"]');
    const employeeName = select.selectedOptions[0].dataset.name;

    const attendance = {
        employee_id: parseInt(formData.get('employee_id')),
        employee_name: employeeName,
        date: formData.get('date'),
        check_in: checkIn.toISOString(),
        check_out: checkOut ? checkOut.toISOString() : null,
        hours_worked: hoursWorked,
        late_minutes: parseInt(formData.get('late_minutes')) || 0,
        notes: formData.get('notes')
    };

    await db.add('attendance', attendance);
    showToast('تم تسجيل الحضور بنجاح', 'success');
    closeModal();
    showAttendance();
}

// الرواتب
async function showSalaries() {
    const salaries = await db.getAll('salaries');
    const content = document.getElementById('employeesContent');

    const totalSalaries = salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">الرواتب</h3>
                <button class="btn btn-success" onclick="showSalaryForm()">➕ إضافة راتب</button>
            </div>

            <div class="stat-card" style="margin-bottom: 1.5rem;">
                <div class="stat-label">إجمالي الرواتب</div>
                <div class="stat-value">${formatCurrency(totalSalaries)}</div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الشهر</th>
                            <th>الموظف</th>
                            <th>الراتب الأساسي</th>
                            <th>الحوافز</th>
                            <th>الخصومات</th>
                            <th>السلف</th>
                            <th>الصافي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salaries.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد رواتب</td></tr>' :
                          salaries.reverse().map(sal => `
                            <tr>
                                <td>${sal.month}</td>
                                <td>${sal.employee_name}</td>
                                <td>${formatCurrency(sal.basic_salary)}</td>
                                <td class="text-success">${formatCurrency(sal.bonuses || 0)}</td>
                                <td class="text-error">${formatCurrency(sal.deductions || 0)}</td>
                                <td class="text-warning">${formatCurrency(sal.advances || 0)}</td>
                                <td class="text-primary"><strong>${formatCurrency(sal.net_salary)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showSalaryForm() {
    const employees = await db.getAll('employees').then(e => e.filter(emp => emp.status === 'active'));
    
    const formHTML = `
        <form id="salaryForm" onsubmit="saveSalary(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الموظف *</label>
                    <select name="employee_id" class="form-select" required onchange="updateSalaryEmployee(this)">
                        <option value="">اختر موظف</option>
                        ${employees.map(emp => `
                            <option value="${emp.id}" data-name="${emp.name}" data-salary="${emp.salary}">${emp.name} - ${emp.position}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">الشهر *</label>
                    <input type="month" name="month" class="form-input" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الراتب الأساسي *</label>
                    <input type="number" name="basic_salary" id="basicSalary" class="form-input" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الحوافز</label>
                    <input type="number" name="bonuses" class="form-input" step="0.01" min="0" value="0" onchange="calculateNetSalary()">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">الخصومات</label>
                    <input type="number" name="deductions" class="form-input" step="0.01" min="0" value="0" onchange="calculateNetSalary()">
                </div>
                <div class="form-group">
                    <label class="form-label">السلف المستقطعة</label>
                    <input type="number" name="advances" class="form-input" step="0.01" min="0" value="0" onchange="calculateNetSalary()">
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">صافي الراتب</div>
                <div class="stat-value" id="netSalary">0.00 ر.س</div>
            </div>
        </form>
    `;

    showModal('إضافة راتب', formHTML, [
        { text: 'حفظ', class: 'btn-success', onclick: 'document.getElementById("salaryForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

function updateSalaryEmployee(select) {
    const option = select.selectedOptions[0];
    if (option) {
        document.getElementById('basicSalary').value = option.dataset.salary;
        calculateNetSalary();
    }
}

function calculateNetSalary() {
    const basic = parseFloat(document.querySelector('input[name="basic_salary"]').value) || 0;
    const bonuses = parseFloat(document.querySelector('input[name="bonuses"]').value) || 0;
    const deductions = parseFloat(document.querySelector('input[name="deductions"]').value) || 0;
    const advances = parseFloat(document.querySelector('input[name="advances"]').value) || 0;
    
    const net = basic + bonuses - deductions - advances;
    document.getElementById('netSalary').textContent = formatCurrency(net);
}

async function saveSalary(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const select = document.querySelector('select[name="employee_id"]');
    const employeeName = select.selectedOptions[0].dataset.name;

    const basic = parseFloat(formData.get('basic_salary'));
    const bonuses = parseFloat(formData.get('bonuses')) || 0;
    const deductions = parseFloat(formData.get('deductions')) || 0;
    const advances = parseFloat(formData.get('advances')) || 0;

    const salary = {
        employee_id: parseInt(formData.get('employee_id')),
        employee_name: employeeName,
        month: formData.get('month'),
        basic_salary: basic,
        bonuses: bonuses,
        deductions: deductions,
        advances: advances,
        net_salary: basic + bonuses - deductions - advances
    };

    await db.add('salaries', salary);
    showToast('تم إضافة الراتب بنجاح', 'success');
    closeModal();
    showSalaries();
}

// السلف
async function showAdvances() {
    const advances = await db.getAll('employee_advances');
    const content = document.getElementById('employeesContent');

    const totalAdvances = advances.reduce((sum, a) => sum + (a.amount - a.paid), 0);

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">السلف</h3>
                <button class="btn btn-warning" onclick="showAdvanceForm()">➕ إضافة سلفة</button>
            </div>

            <div class="stat-card" style="margin-bottom: 1.5rem;">
                <div class="stat-label">إجمالي السلف المستحقة</div>
                <div class="stat-value text-warning">${formatCurrency(totalAdvances)}</div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الموظف</th>
                            <th>المبلغ</th>
                            <th>المدفوع</th>
                            <th>المتبقي</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${advances.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد سلف</td></tr>' :
                          advances.reverse().map(adv => {
                            const remaining = adv.amount - adv.paid;
                            const status = remaining === 0 ? 'مسددة' : 'مستحقة';
                            return `
                            <tr>
                                <td>${formatDate(adv.date)}</td>
                                <td>${adv.employee_name}</td>
                                <td>${formatCurrency(adv.amount)}</td>
                                <td class="text-success">${formatCurrency(adv.paid)}</td>
                                <td class="text-warning">${formatCurrency(remaining)}</td>
                                <td><span class="badge ${remaining === 0 ? 'text-success' : 'text-warning'}">${status}</span></td>
                                <td>
                                    ${remaining > 0 ? `<button class="btn-icon" onclick="payAdvance(${adv.id})" title="تسديد">💰</button>` : ''}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showAdvanceForm() {
    const employees = await db.getAll('employees').then(e => e.filter(emp => emp.status === 'active'));
    
    const formHTML = `
        <form id="advanceForm" onsubmit="saveAdvance(event)">
            <div class="form-group">
                <label class="form-label">الموظف *</label>
                <select name="employee_id" class="form-select" required>
                    <option value="">اختر موظف</option>
                    ${employees.map(emp => `
                        <option value="${emp.id}" data-name="${emp.name}">${emp.name} - ${emp.position}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">التاريخ *</label>
                    <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">المبلغ *</label>
                    <input type="number" name="amount" class="form-input" step="0.01" min="0.01" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <textarea name="notes" class="form-textarea" rows="2"></textarea>
            </div>
        </form>
    `;

    showModal('إضافة سلفة', formHTML, [
        { text: 'حفظ', class: 'btn-warning', onclick: 'document.getElementById("advanceForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveAdvance(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const select = document.querySelector('select[name="employee_id"]');
    const employeeName = select.selectedOptions[0].dataset.name;

    const advance = {
        employee_id: parseInt(formData.get('employee_id')),
        employee_name: employeeName,
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        paid: 0,
        notes: formData.get('notes')
    };

    await db.add('employee_advances', advance);
    showToast('تم إضافة السلفة بنجاح', 'success');
    closeModal();
    showAdvances();
}

async function payAdvance(id) {
    const advance = await db.getById('employee_advances', id);
    const remaining = advance.amount - advance.paid;
    
    const formHTML = `
        <form id="payForm" onsubmit="saveAdvancePayment(event, ${id})">
            <div class="alert alert-info">
                الموظف: <strong>${advance.employee_name}</strong><br>
                المبلغ الكلي: <strong>${formatCurrency(advance.amount)}</strong><br>
                المتبقي: <strong>${formatCurrency(remaining)}</strong>
            </div>
            
            <div class="form-group">
                <label class="form-label">المبلغ المدفوع *</label>
                <input type="number" name="payment" class="form-input" step="0.01" min="0.01" max="${remaining}" value="${remaining}" required>
            </div>
        </form>
    `;

    showModal('تسديد سلفة', formHTML, [
        { text: 'تسديد', class: 'btn-success', onclick: 'document.getElementById("payForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveAdvancePayment(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const advance = await db.getById('employee_advances', id);
    
    advance.paid += parseFloat(formData.get('payment'));
    await db.update('employee_advances', advance);
    
    showToast('تم تسديد المبلغ بنجاح', 'success');
    closeModal();
    showAdvances();
}

// المناوبات
async function showShifts() {
    const shifts = await db.getAll('shifts');
    const content = document.getElementById('employeesContent');

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">المناوبات</h3>
                <button class="btn btn-info" onclick="showShiftForm()">➕ إضافة مناوبة</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الموظف</th>
                            <th>الفترة</th>
                            <th>من</th>
                            <th>إلى</th>
                            <th>الساعات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shifts.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد مناوبات</td></tr>' :
                          shifts.reverse().slice(0, 50).map(shift => `
                            <tr>
                                <td>${formatDate(shift.date)}</td>
                                <td>${shift.employee_name}</td>
                                <td><span class="badge">${shift.shift_type}</span></td>
                                <td>${shift.start_time}</td>
                                <td>${shift.end_time}</td>
                                <td>${shift.hours} ساعة</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showShiftForm() {
    const employees = await db.getAll('employees').then(e => e.filter(emp => emp.status === 'active'));
    
    const formHTML = `
        <form id="shiftForm" onsubmit="saveShift(event)">
            <div class="form-group">
                <label class="form-label">الموظف *</label>
                <select name="employee_id" class="form-select" required>
                    <option value="">اختر موظف</option>
                    ${employees.map(emp => `
                        <option value="${emp.id}" data-name="${emp.name}">${emp.name} - ${emp.position}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">التاريخ *</label>
                    <input type="date" name="date" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الفترة *</label>
                    <select name="shift_type" class="form-select" required>
                        <option value="صباحية">صباحية</option>
                        <option value="مسائية">مسائية</option>
                        <option value="ليلية">ليلية</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">من *</label>
                    <input type="time" name="start_time" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">إلى *</label>
                    <input type="time" name="end_time" class="form-input" required>
                </div>
            </div>
        </form>
    `;

    showModal('إضافة مناوبة', formHTML, [
        { text: 'حفظ', class: 'btn-info', onclick: 'document.getElementById("shiftForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveShift(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const select = document.querySelector('select[name="employee_id"]');
    const employeeName = select.selectedOptions[0].dataset.name;

    const start = formData.get('start_time').split(':');
    const end = formData.get('end_time').split(':');
    const hours = (parseInt(end[0]) * 60 + parseInt(end[1]) - parseInt(start[0]) * 60 - parseInt(start[1])) / 60;

    const shift = {
        employee_id: parseInt(formData.get('employee_id')),
        employee_name: employeeName,
        date: formData.get('date'),
        shift_type: formData.get('shift_type'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        hours: hours
    };

    await db.add('shifts', shift);
    showToast('تم إضافة المناوبة بنجاح', 'success');
    closeModal();
    showShifts();
}

// كشف حساب الموظف
async function viewEmployeeAccount(id) {
    const employee = await db.getById('employees', id);
    const salaries = await db.getByIndex('salaries', 'employee_id', id);
    const advances = await db.getByIndex('employee_advances', 'employee_id', id);
    const attendance = await db.getByIndex('attendance', 'employee_id', id);

    const totalSalaries = salaries.reduce((sum, s) => sum + s.net_salary, 0);
    const totalAdvances = advances.reduce((sum, a) => sum + (a.amount - a.paid), 0);
    const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);

    const accountHTML = `
        <div class="stats-grid mb-2">
            <div class="stat-card">
                <div class="stat-label">إجمالي الرواتب</div>
                <div class="stat-value">${formatCurrency(totalSalaries)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">السلف المستحقة</div>
                <div class="stat-value text-warning">${formatCurrency(totalAdvances)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ساعات العمل</div>
                <div class="stat-value">${totalHours.toFixed(2)}</div>
            </div>
        </div>

        <h4>آخر الرواتب:</h4>
        <div class="table-container mb-2">
            <table>
                <thead>
                    <tr><th>الشهر</th><th>الأساسي</th><th>الحوافز</th><th>الخصومات</th><th>الصافي</th></tr>
                </thead>
                <tbody>
                    ${salaries.slice(-5).reverse().map(s => `
                        <tr>
                            <td>${s.month}</td>
                            <td>${formatCurrency(s.basic_salary)}</td>
                            <td class="text-success">${formatCurrency(s.bonuses || 0)}</td>
                            <td class="text-error">${formatCurrency(s.deductions || 0)}</td>
                            <td><strong>${formatCurrency(s.net_salary)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <h4>السلف المستحقة:</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>التاريخ</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th></tr>
                </thead>
                <tbody>
                    ${advances.filter(a => a.amount > a.paid).map(a => `
                        <tr>
                            <td>${formatDate(a.date)}</td>
                            <td>${formatCurrency(a.amount)}</td>
                            <td>${formatCurrency(a.paid)}</td>
                            <td class="text-warning">${formatCurrency(a.amount - a.paid)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    showModal(`كشف حساب: ${employee.name}`, accountHTML);
}
