// Dashboard Module
async function loadDashboard() {
    const contentArea = document.getElementById('content-area');

    // Get stats
    const inventoryItems = await db.getAll('inventory_items');
    const employees = await db.getAll('employees');
    const suppliers = await db.getAll('suppliers');
    const revenues = await db.getAll('revenues');
    const expenses = await db.getAll('expenses');

    // Calculate totals
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Low stock items
    const lowStockItems = inventoryItems.filter(item => item.quantity < 10);

    // Expiring soon items
    const expiringItems = inventoryItems.filter(item => {
        const expiry = new Date(item.expiry_date);
        const daysUntilExpiry = (expiry - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry < 7 && daysUntilExpiry > 0;
    });

    contentArea.innerHTML = `
        <h2 class="mb-3">لوحة التحكم</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">إجمالي الأصناف</div>
                <div class="stat-value">${inventoryItems.length}</div>
            </div>
            <div class="stat-card" style="border-color: var(--secondary-color);">
                <div class="stat-label">عدد الموظفين</div>
                <div class="stat-value" style="color: var(--secondary-color);">${employees.length}</div>
            </div>
            <div class="stat-card" style="border-color: var(--warning);">
                <div class="stat-label">عدد الموردين</div>
                <div class="stat-value" style="color: var(--warning);">${suppliers.length}</div>
            </div>
            <div class="stat-card" style="border-color: ${netProfit >= 0 ? 'var(--success)' : 'var(--error)'};">
                <div class="stat-label">صافي الربح</div>
                <div class="stat-value" style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--error)'};">
                    ${formatCurrency(netProfit)}
                </div>
            </div>
        </div>

        ${lowStockItems.length > 0 ? `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">⚠️ تنبيهات المخزون المنخفض</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الكمية المتبقية</th>
                            <th>الوحدة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="text-warning">${item.quantity}</td>
                                <td>${item.unit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        ${expiringItems.length > 0 ? `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">⏰ منتجات قريبة من انتهاء الصلاحية</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>تاريخ الانتهاء</th>
                            <th>الكمية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expiringItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="text-error">${formatDate(item.expiry_date)}</td>
                                <td>${item.quantity} ${item.unit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📊 الإحصائيات المالية</h3>
            </div>
            <div class="stats-grid">
                <div class="stat-card" style="border-color: var(--success);">
                    <div class="stat-label">إجمالي الإيرادات</div>
                    <div class="stat-value" style="color: var(--success);">${formatCurrency(totalRevenue)}</div>
                </div>
                <div class="stat-card" style="border-color: var(--error);">
                    <div class="stat-label">إجمالي المصروفات</div>
                    <div class="stat-value" style="color: var(--error);">${formatCurrency(totalExpenses)}</div>
                </div>
            </div>
        </div>
    `;
}
