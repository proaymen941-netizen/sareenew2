// Reports Module
async function loadReports() {
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">📈 التقارير والإحصائيات</h2>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                <button class="btn btn-primary" onclick="showInventoryReport()">
                    📦 تقرير المخزون
                </button>
                <button class="btn btn-secondary" onclick="showFinanceReport()">
                    💰 التقرير المالي
                </button>
                <button class="btn btn-success" onclick="showEmployeeReport()">
                    👥 تقرير الموظفين
                </button>
                <button class="btn btn-warning" onclick="showSupplierReport()">
                    🚚 تقرير الموردين
                </button>
            </div>

            <div id="reportContent" class="mt-3"></div>
        </div>
    `;
}

async function showInventoryReport() {
    const items = await db.getAll('inventory_items');
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0);

    const reportHTML = `
        <div class="card">
            <h3 class="card-title">تقرير المخزون الشامل</h3>
            <div class="stat-card">
                <div class="stat-label">القيمة الإجمالية للمخزون</div>
                <div class="stat-value">${formatCurrency(totalValue)}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>القيمة الإجمالية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${formatCurrency(item.purchase_price)}</td>
                                <td>${formatCurrency(item.quantity * item.purchase_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary mt-2" onclick="printElement('reportContent')">🖨️ طباعة</button>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHTML;
}

async function showFinanceReport() {
    const revenues = await db.getAll('revenues');
    const expenses = await db.getAll('expenses');
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const reportHTML = `
        <div class="card">
            <h3 class="card-title">التقرير المالي</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">إجمالي الإيرادات</div>
                    <div class="stat-value" style="color: var(--success);">${formatCurrency(totalRevenue)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">إجمالي المصروفات</div>
                    <div class="stat-value" style="color: var(--error);">${formatCurrency(totalExpenses)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">صافي الربح</div>
                    <div class="stat-value" style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--error)'};">
                        ${formatCurrency(netProfit)}
                    </div>
                </div>
            </div>
            <button class="btn btn-primary mt-2" onclick="printElement('reportContent')">🖨️ طباعة</button>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHTML;
}

async function showEmployeeReport() {
    const employees = await db.getAll('employees');
    const totalSalaries = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

    const reportHTML = `
        <div class="card">
            <h3 class="card-title">تقرير الموظفين</h3>
            <div class="stat-card">
                <div class="stat-label">إجمالي الرواتب الشهرية</div>
                <div class="stat-value">${formatCurrency(totalSalaries)}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الموظف</th>
                            <th>المنصب</th>
                            <th>الراتب</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(emp => `
                            <tr>
                                <td>${emp.name || ''}</td>
                                <td>${emp.position || ''}</td>
                                <td>${formatCurrency(emp.salary || 0)}</td>
                                <td>${emp.status === 'active' ? 'نشط' : 'غير نشط'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary mt-2" onclick="printElement('reportContent')">🖨️ طباعة</button>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHTML;
}

async function showSupplierReport() {
    const suppliers = await db.getAll('suppliers');

    const reportHTML = `
        <div class="card">
            <h3 class="card-title">تقرير الموردين</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المورد</th>
                            <th>نوع المنتجات</th>
                            <th>رقم الهاتف</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.map(sup => `
                            <tr>
                                <td>${sup.name || ''}</td>
                                <td>${sup.product_type || ''}</td>
                                <td>${sup.phone || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary mt-2" onclick="printElement('reportContent')">🖨️ طباعة</button>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHTML;
}
