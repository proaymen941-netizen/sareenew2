// Settings Module
async function loadSettings() {
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">⚙️ الإعدادات</h2>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div>
                    <h3 style="margin-bottom: 1rem;">المظهر</h3>
                    <button class="btn btn-secondary" onclick="toggleTheme()">
                        تبديل الوضع (فاتح/داكن)
                    </button>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">البيانات</h3>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="backupData()">
                            💾 تصدير نسخة احتياطية
                        </button>
                        <button class="btn btn-warning" onclick="restoreData()">
                            📥 استعادة نسخة احتياطية
                        </button>
                        <button class="btn btn-danger" onclick="clearAllData()">
                            🗑️ حذف جميع البيانات
                        </button>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">حول النظام</h3>
                    <div class="alert alert-info">
                        <strong>نظام إدارة المطعم المتكامل</strong><br>
                        الإصدار: 1.0.0<br>
                        تطبيق ويب محلي - يعمل بالكامل في المتصفح<br>
                        جميع البيانات محفوظة محلياً في IndexedDB
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">دليل الاستخدام</h3>
                    <div style="background: var(--background); padding: 1rem; border-radius: 0.5rem;">
                        <ul style="list-style-position: inside;">
                            <li>استخدم قائمة التنقل اليمنى للوصول للوحدات المختلفة</li>
                            <li>يمكنك إضافة وتعديل وحذف البيانات من كل وحدة</li>
                            <li>التقارير متاحة من قسم التقارير مع إمكانية الطباعة</li>
                            <li>احفظ نسخة احتياطية بانتظام لحماية بياناتك</li>
                            <li>جميع البيانات محفوظة في متصفحك فقط</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function clearAllData() {
    if (await confirm('تحذير: سيتم حذف جميع البيانات نهائياً. هل أنت متأكد؟')) {
        const stores = ['inventory_items', 'inventory_movements', 'stock_audits', 'waste_records',
                       'employees', 'attendance', 'salaries', 'employee_advances', 'shifts',
                       'suppliers', 'purchase_invoices', 'supplier_payments',
                       'revenues', 'expenses', 'budgets', 'notifications'];
        
        for (const store of stores) {
            await db.clear(store);
        }

        showToast('تم حذف جميع البيانات', 'success');
        location.reload();
    }
}
