// Finance Module
async function loadFinance() {
    const contentArea = document.getElementById('content-area');
    const revenues = await db.getAll('revenues');
    const expenses = await db.getAll('expenses');

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    contentArea.innerHTML = `
        <h2 class="mb-3">💰 النظام المالي</h2>

        <div class="stats-grid">
            <div class="stat-card" style="border-color: var(--success);">
                <div class="stat-label">إجمالي الإيرادات</div>
                <div class="stat-value" style="color: var(--success);">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="stat-card" style="border-color: var(--error);">
                <div class="stat-label">إجمالي المصروفات</div>
                <div class="stat-value" style="color: var(--error);">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="stat-card" style="border-color: ${netProfit >= 0 ? 'var(--success)' : 'var(--error)'};">
                <div class="stat-label">صافي الربح</div>
                <div class="stat-value" style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--error)'};">
                    ${formatCurrency(netProfit)}
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">الإيرادات</h3>
                <button class="btn btn-success" onclick="showAddRevenueForm()">➕ إضافة إيراد</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الوصف</th>
                            <th>المبلغ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${revenues.length === 0 ? '<tr><td colspan="4" class="text-center">لا توجد إيرادات</td></tr>' :
                          revenues.map(rev => `
                            <tr>
                                <td>${formatDate(rev.date)}</td>
                                <td>${rev.description || ''}</td>
                                <td class="text-success">${formatCurrency(rev.amount)}</td>
                                <td><button class="btn-icon" onclick="deleteRevenue(${rev.id})">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">المصروفات</h3>
                <button class="btn btn-warning" onclick="showAddExpenseForm()">➕ إضافة مصروف</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الوصف</th>
                            <th>المبلغ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.length === 0 ? '<tr><td colspan="4" class="text-center">لا توجد مصروفات</td></tr>' :
                          expenses.map(exp => `
                            <tr>
                                <td>${formatDate(exp.date)}</td>
                                <td>${exp.description || ''}</td>
                                <td class="text-error">${formatCurrency(exp.amount)}</td>
                                <td><button class="btn-icon" onclick="deleteExpense(${exp.id})">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddRevenueForm() {
    const formHTML = `
        <form id="revenueForm" onsubmit="saveRevenue(event)">
            <div class="form-group">
                <label class="form-label">التاريخ *</label>
                <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label class="form-label">الوصف *</label>
                <input type="text" name="description" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">المبلغ *</label>
                <input type="number" name="amount" class="form-input" step="0.01" min="0" required>
            </div>
        </form>
    `;

    showModal('إضافة إيراد', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("revenueForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveRevenue(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    await db.add('revenues', {
        date: formData.get('date'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount'))
    });

    showToast('تم إضافة الإيراد بنجاح', 'success');
    closeModal();
    loadFinance();
}

function showAddExpenseForm() {
    const formHTML = `
        <form id="expenseForm" onsubmit="saveExpense(event)">
            <div class="form-group">
                <label class="form-label">التاريخ *</label>
                <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label class="form-label">الوصف *</label>
                <input type="text" name="description" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">المبلغ *</label>
                <input type="number" name="amount" class="form-input" step="0.01" min="0" required>
            </div>
        </form>
    `;

    showModal('إضافة مصروف', formHTML, [
        { text: 'حفظ', class: 'btn-primary', onclick: 'document.getElementById("expenseForm").requestSubmit()' },
        { text: 'إلغاء', class: 'btn-secondary', onclick: 'closeModal()' }
    ]);
}

async function saveExpense(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    await db.add('expenses', {
        date: formData.get('date'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount'))
    });

    showToast('تم إضافة المصروف بنجاح', 'success');
    closeModal();
    loadFinance();
}

async function deleteRevenue(id) {
    if (await confirm('هل أنت متأكد من حذف هذا الإيراد؟')) {
        await db.delete('revenues', id);
        showToast('تم الحذف بنجاح', 'success');
        loadFinance();
    }
}

async function deleteExpense(id) {
    if (await confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        await db.delete('expenses', id);
        showToast('تم الحذف بنجاح', 'success');
        loadFinance();
    }
}
