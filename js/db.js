// IndexedDB Database Manager
class DatabaseManager {
    constructor() {
        this.dbName = 'RestaurantDB';
        this.version = 2;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Inventory Stores
                if (!db.objectStoreNames.contains('inventory_items')) {
                    const inventoryStore = db.createObjectStore('inventory_items', { keyPath: 'id', autoIncrement: true });
                    inventoryStore.createIndex('name', 'name', { unique: false });
                    inventoryStore.createIndex('category', 'category', { unique: false });
                }

                if (!db.objectStoreNames.contains('inventory_movements')) {
                    const movementsStore = db.createObjectStore('inventory_movements', { keyPath: 'id', autoIncrement: true });
                    movementsStore.createIndex('item_id', 'item_id', { unique: false });
                    movementsStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('stock_audits')) {
                    db.createObjectStore('stock_audits', { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains('waste_records')) {
                    db.createObjectStore('waste_records', { keyPath: 'id', autoIncrement: true });
                }

                // Employee Stores
                if (!db.objectStoreNames.contains('employees')) {
                    const employeeStore = db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
                    employeeStore.createIndex('name', 'name', { unique: false });
                    employeeStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('attendance')) {
                    const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attendanceStore.createIndex('employee_id', 'employee_id', { unique: false });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('salaries')) {
                    const salaryStore = db.createObjectStore('salaries', { keyPath: 'id', autoIncrement: true });
                    salaryStore.createIndex('employee_id', 'employee_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('employee_advances')) {
                    db.createObjectStore('employee_advances', { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains('shifts')) {
                    db.createObjectStore('shifts', { keyPath: 'id', autoIncrement: true });
                }

                // Supplier Stores
                if (!db.objectStoreNames.contains('suppliers')) {
                    const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
                    supplierStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('purchase_invoices')) {
                    const invoiceStore = db.createObjectStore('purchase_invoices', { keyPath: 'id', autoIncrement: true });
                    invoiceStore.createIndex('supplier_id', 'supplier_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('supplier_payments')) {
                    db.createObjectStore('supplier_payments', { keyPath: 'id', autoIncrement: true });
                }

                // Finance Stores
                if (!db.objectStoreNames.contains('revenues')) {
                    const revenueStore = db.createObjectStore('revenues', { keyPath: 'id', autoIncrement: true });
                    revenueStore.createIndex('date', 'date', { unique: false });
                    revenueStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                    expenseStore.createIndex('date', 'date', { unique: false });
                    expenseStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains('budgets')) {
                    db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
                }

                // Notifications
                if (!db.objectStoreNames.contains('notifications')) {
                    const notifStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                    notifStore.createIndex('read', 'read', { unique: false });
                    notifStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // POS Orders
                if (!db.objectStoreNames.contains('pos_orders')) {
                    const posStore = db.createObjectStore('pos_orders', { keyPath: 'id', autoIncrement: true });
                    posStore.createIndex('department', 'department', { unique: false });
                    posStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // Employee Meals (for employee cashier)
                if (!db.objectStoreNames.contains('employee_meals')) {
                    const mealsStore = db.createObjectStore('employee_meals', { keyPath: 'id', autoIncrement: true });
                    mealsStore.createIndex('name', 'name', { unique: false });
                }

                // Employee Meal Orders
                if (!db.objectStoreNames.contains('employee_meal_orders')) {
                    const mealOrdersStore = db.createObjectStore('employee_meal_orders', { keyPath: 'id', autoIncrement: true });
                    mealOrdersStore.createIndex('employee_id', 'employee_id', { unique: false });
                    mealOrdersStore.createIndex('created_at', 'created_at', { unique: false });
                }
            };
        });
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportData() {
        const data = {};
        const storeNames = Array.from(this.db.objectStoreNames);
        
        for (const storeName of storeNames) {
            data[storeName] = await this.getAll(storeName);
        }
        
        return data;
    }

    async importData(data) {
        for (const [storeName, items] of Object.entries(data)) {
            await this.clear(storeName);
            for (const item of items) {
                await this.add(storeName, item);
            }
        }
    }
}

const db = new DatabaseManager();
