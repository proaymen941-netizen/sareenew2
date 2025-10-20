// Smart Notifications System

async function initSmartNotifications() {
    // التحقق من التنبيهات كل 30 ثانية
    setInterval(checkSmartAlerts, 30000);
    await checkSmartAlerts(); // تشغيل فوري عند البدء
}

async function checkSmartAlerts() {
    const alerts = [];
    
    // 1. تنبيهات المخزون المنخفض
    const items = await db.getAll('inventory_items');
    const lowStock = items.filter(item => item.quantity < (item.min_quantity || 10));
    if (lowStock.length > 0) {
        alerts.push({
            type: 'warning',
            title: `⚠️ مخزون منخفض (${lowStock.length})`,
            message: `${lowStock.map(i => i.name).join(', ')} - يحتاج إعادة طلب`,
            priority: 'high'
        });
    }

    // 2. تنبيهات انتهاء الصلاحية
    const expiringItems = items.filter(item => {
        const daysUntilExpiry = (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });
    if (expiringItems.length > 0) {
        alerts.push({
            type: 'error',
            title: `🚨 أصناف قريبة من الانتهاء (${expiringItems.length})`,
            message: `${expiringItems.map(i => i.name).join(', ')}`,
            priority: 'critical'
        });
    }

    // 3. تنبيهات هامش الربح المنخفض
    const lowMarginItems = items.filter(item => {
        const margin = calculateProfitMargin(item.purchase_price, item.sell_price);
        return margin < 15; // أقل من 15%
    });
    if (lowMarginItems.length > 0) {
        alerts.push({
            type: 'warning',
            title: `📉 هامش ربح منخفض (${lowMarginItems.length})`,
            message: `مراجعة الأسعار مطلوبة`,
            priority: 'medium'
        });
    }

    // 4. تنبيهات تكلفة العمالة المرتفعة
    const revenues = await db.getAll('revenues');
    const salaries = await db.getAll('salaries');
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
    const laborCostRatio = totalRevenue > 0 ? (totalSalaries / totalRevenue * 100) : 0;
    
    if (laborCostRatio > 30) { // أكثر من 30% من الإيرادات
        alerts.push({
            type: 'warning',
            title: `💼 تكلفة العمالة مرتفعة`,
            message: `${laborCostRatio.toFixed(1)}% من الإيرادات - المعدل الموصى به 25-30%`,
            priority: 'high'
        });
    }

    // 5. تنبيهات نسبة الهدر العالية
    const waste = await db.getAll('waste_records');
    const movements = await db.getAll('inventory_movements');
    const totalPurchases = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.total_cost, 0);
    const totalWaste = waste.reduce((sum, w) => sum + w.total_cost, 0);
    const wasteRatio = totalPurchases > 0 ? (totalWaste / totalPurchases * 100) : 0;
    
    if (wasteRatio > 5) { // أكثر من 5%
        alerts.push({
            type: 'error',
            title: `🗑️ نسبة هدر عالية`,
            message: `${wasteRatio.toFixed(1)}% من المشتريات - المعدل الطبيعي 2-3%`,
            priority: 'high'
        });
    }

    // 6. تنبيهات المديونيات
    const invoices = await db.getAll('purchase_invoices');
    const payments = await db.getAll('supplier_payments');
    const totalPurchasesAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalDue = totalPurchasesAmount - totalPayments;
    
    if (totalDue > 10000) {
        alerts.push({
            type: 'warning',
            title: `💰 مديونيات مرتفعة`,
            message: `${formatCurrency(totalDue)} للموردين`,
            priority: 'medium'
        });
    }

    // 7. تنبيهات السلف
    const advances = await db.getAll('employee_advances');
    const unpaidAdvances = advances.filter(a => a.amount > a.paid);
    const totalAdvancesUnpaid = unpaidAdvances.reduce((sum, a) => sum + (a.amount - a.paid), 0);
    
    if (totalAdvancesUnpaid > 5000) {
        alerts.push({
            type: 'info',
            title: `💸 سلف مستحقة`,
            message: `${formatCurrency(totalAdvancesUnpaid)} - ${unpaidAdvances.length} موظف`,
            priority: 'low'
        });
    }

    // 8. تحليل الربحية
    const expenses = await db.getAll('expenses');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses - totalSalaries;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    
    if (profitMargin < 10 && totalRevenue > 0) {
        alerts.push({
            type: 'error',
            title: `📊 هامش ربح منخفض جداً`,
            message: `${profitMargin.toFixed(1)}% - مراجعة شاملة مطلوبة`,
            priority: 'critical'
        });
    }

    // حذف التنبيهات القديمة (أكثر من 24 ساعة) - دائماً
    const oldNotifs = await db.getAll('notifications');
    const now = new Date();
    let cleanedCount = 0;
    
    for (const notif of oldNotifs) {
        const notifDate = new Date(notif.date);
        const hoursDiff = (now - notifDate) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
            await db.delete('notifications', notif.id);
            cleanedCount++;
        }
    }

    // حفظ التنبيهات الجديدة في قاعدة البيانات
    if (alerts.length > 0) {
        // إضافة التنبيهات الجديدة فقط (تجنب التكرار)
        const existingTitles = oldNotifs.filter(n => {
            const notifDate = new Date(n.date);
            const hoursDiff = (now - notifDate) / (1000 * 60 * 60);
            return hoursDiff < 1 && hoursDiff >= 0; // نفس التنبيه خلال ساعة
        }).map(n => n.title);

        const newAlerts = [];
        for (const alert of alerts) {
            if (!existingTitles.includes(alert.title)) {
                await db.add('notifications', {
                    ...alert,
                    date: new Date().toISOString(),
                    read: 0
                });
                newAlerts.push(alert);
            }
        }
        
        // عرض التنبيهات الجديدة فقط
        if (newAlerts.length > 0) {
            displaySmartAlerts(newAlerts);
        }
    }

    // تحديث العداد في UI (دائماً بعد التنظيف أو الإضافة)
    if (typeof updateNotifications === 'function') {
        await updateNotifications();
    }
}

function displaySmartAlerts(alerts) {
    if (alerts.length === 0) return;

    // ترتيب حسب الأولوية
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // عرض أهم 3 تنبيهات فقط
    alerts.slice(0, 3).forEach((alert, index) => {
        setTimeout(() => {
            showToast(`${alert.title}\n${alert.message}`, alert.type);
        }, index * 1000); // تأخير بسيط بين التنبيهات
    });
}

// دالة لعرض جميع التنبيهات
async function showAllNotifications() {
    const notifications = await db.getAll('notifications');
    const unread = notifications.filter(n => n.read === 0);

    const notificationsHTML = `
        <div class="notifications-list">
            ${notifications.length === 0 ? '<p class="text-center">لا توجد تنبيهات</p>' :
              notifications.reverse().slice(0, 20).map(notif => `
                <div class="notification-item ${notif.read === 0 ? 'unread' : ''}" style="
                    padding: 1rem;
                    border-left: 4px solid var(--${notif.type});
                    background: var(--bg-secondary);
                    margin-bottom: 0.5rem;
                    border-radius: 0.5rem;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0;">${notif.title}</h4>
                            <p style="margin: 0; opacity: 0.8;">${notif.message}</p>
                            <small style="opacity: 0.6;">${notif.date ? formatDate(notif.date) : 'الآن'}</small>
                        </div>
                        ${notif.read === 0 ? `<button class="btn-icon" onclick="markAsRead(${notif.id})">✓</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-secondary mt-2" onclick="clearAllNotifications()">مسح الكل</button>
    `;

    showModal('التنبيهات', notificationsHTML);
}

async function markAsRead(id) {
    const notif = await db.getById('notifications', id);
    notif.read = 1;
    await db.update('notifications', notif);
    showAllNotifications();
}

async function clearAllNotifications() {
    const notifications = await db.getAll('notifications');
    for (const notif of notifications) {
        await db.delete('notifications', notif.id);
    }
    closeModal();
    showToast('تم مسح جميع التنبيهات', 'success');
}

// تصدير الدالة للاستخدام في index.html
window.initSmartNotifications = initSmartNotifications;
window.showAllNotifications = showAllNotifications;
