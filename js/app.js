// Main Application
let currentModule = 'dashboard';

// Initialize App
async function initApp() {
    try {
        // Initialize Database
        await db.init();
        console.log('Database initialized successfully');

        // Load saved theme
        const savedTheme = storage.get('theme', 'light');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
        }

        // Setup Event Listeners
        setupEventListeners();

        // Load initial module
        await loadModule('dashboard');

        // Check for notifications
        await updateNotifications();

        // Initialize Smart Notifications System
        if (typeof initSmartNotifications === 'function') {
            await initSmartNotifications();
        }

        // Initialize sample data if empty
        await initSampleData();

    } catch (error) {
        console.error('Failed to initialize app:', error);
        if (error && error.message) {
            showToast('خطأ: ' + error.message, 'error');
        } else {
            showToast('حدث خطأ في تهيئة التطبيق', 'error');
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const module = e.currentTarget.dataset.module;
            loadModule(module);
        });
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Backup Button
    document.getElementById('backupBtn').addEventListener('click', showBackupOptions);

    // Notifications Button
    document.getElementById('notificationsBtn').addEventListener('click', () => {
        if (typeof showAllNotifications === 'function') {
            showAllNotifications();
        } else {
            toggleNotifications();
        }
    });
}

// Load Module
async function loadModule(module) {
    currentModule = module;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.module === module) {
            item.classList.add('active');
        }
    });

    // Load module content
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="spinner"></div>';

    try {
        switch (module) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'inventory':
                await loadInventory();
                break;
            case 'pos':
                await loadPOS();
                break;
            case 'employees':
                await loadEmployees();
                break;
            case 'employee_cashier':
                await loadEmployeeCashier();
                break;
            case 'suppliers':
                await loadSuppliers();
                break;
            case 'finance':
                await loadFinance();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'settings':
                await loadSettings();
                break;
            default:
                contentArea.innerHTML = '<p>الوحدة غير موجودة</p>';
        }
    } catch (error) {
        console.error('Error loading module:', error);
        contentArea.innerHTML = '<div class="alert alert-error">حدث خطأ في تحميل الوحدة</div>';
    }
}

// Toggle Theme
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        storage.set('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        storage.set('theme', 'dark');
    }
}

// Toggle Notifications
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('hidden');
}

function closeNotifications() {
    document.getElementById('notificationPanel').classList.add('hidden');
}

// Update Notifications
async function updateNotifications() {
    const allNotifications = await db.getAll('notifications');
    const notifications = allNotifications.filter(n => !n.read);
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');

    if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Load notification list
    if (allNotifications.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">لا توجد تنبيهات</div>';
    } else {
        list.innerHTML = allNotifications.slice(0, 10).map(notif => `
            <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
                <div style="font-weight: 600;">${notif.title}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">${notif.message}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    ${notif.created_at ? formatDate(notif.created_at) : ''}
                </div>
            </div>
        `).join('');
    }
}

async function markNotificationRead(id) {
    const notif = await db.getById('notifications', id);
    if (notif) {
        notif.read = true;
        await db.update('notifications', notif);
        await updateNotifications();
    }
}

// Backup Options
function showBackupOptions() {
    const content = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <button class="btn btn-primary" onclick="backupData()">
                تصدير النسخة الاحتياطية
            </button>
            <button class="btn btn-secondary" onclick="restoreData()">
                استعادة النسخة الاحتياطية
            </button>
        </div>
    `;
    showModal('النسخ الاحتياطي', content);
}

async function backupData() {
    try {
        const data = await db.exportData();
        const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(data, filename);
        showToast('تم تصدير النسخة الاحتياطية بنجاح', 'success');
        closeModal();
    } catch (error) {
        showToast('حدث خطأ في التصدير', 'error');
    }
}

async function restoreData() {
    if (await confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
        try {
            const data = await importFromJSON();
            if (data) {
                await db.importData(data);
                showToast('تم استعادة البيانات بنجاح', 'success');
                closeModal();
                location.reload();
            }
        } catch (error) {
            showToast('حدث خطأ في الاستعادة', 'error');
        }
    }
}

// Initialize Sample Data
async function initSampleData() {
    const items = await db.getAll('inventory_items');
    if (items.length === 0) {
        // Add sample inventory items
        const sampleItems = [
            { name: 'دجاج طازج', category: 'لحوم', unit: 'كيلو', quantity: 50, purchase_price: 20, sell_price: 30, expiry_date: new Date(Date.now() + 7*24*60*60*1000).toISOString() },
            { name: 'أرز بسمتي', category: 'حبوب', unit: 'كيس', quantity: 30, purchase_price: 15, sell_price: 25, expiry_date: new Date(Date.now() + 180*24*60*60*1000).toISOString() },
            { name: 'طماطم', category: 'خضروات', unit: 'كيلو', quantity: 25, purchase_price: 3, sell_price: 5, expiry_date: new Date(Date.now() + 5*24*60*60*1000).toISOString() },
        ];

        for (const item of sampleItems) {
            await db.add('inventory_items', item);
        }

        // Add sample notification
        await db.add('notifications', {
            title: 'مرحباً بك',
            message: 'تم تهيئة النظام بنجاح مع بيانات تجريبية',
            type: 'info',
            read: false,
            created_at: new Date().toISOString()
        });
    }
}

// Global Error Handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// Start App
document.addEventListener('DOMContentLoaded', initApp);
