// Database Manager - Laravel API Version
class DatabaseManager {
    constructor() {
        this.apiReady = false;
    }

    async init() {
        try {
            await DashboardAPI.getStats();
            this.apiReady = true;
            return Promise.resolve();
        } catch (error) {
            console.error('API Connection Error:', error);
            this.apiReady = false;
            throw new Error('فشل الاتصال بالخادم');
        }
    }

    async add(storeName, data) {
        try {
            switch (storeName) {
                case 'inventory_items':
                    return await InventoryAPI.create(data);
                case 'employees':
                    return await EmployeeAPI.create(data);
                case 'suppliers':
                    return await SupplierAPI.create(data);
                case 'revenues':
                    return await FinanceAPI.createRevenue(data);
                case 'expenses':
                    return await FinanceAPI.createExpense(data);
                case 'pos_orders':
                    return await PosAPI.createOrder(data);
                case 'inventory_movements':
                    return await InventoryAPI.addMovement(data);
                default:
                    throw new Error('Store not supported');
            }
        } catch (error) {
            throw error;
        }
    }

    async update(storeName, data) {
        try {
            const id = data.id;
            switch (storeName) {
                case 'inventory_items':
                    return await InventoryAPI.update(id, data);
                case 'employees':
                    return await EmployeeAPI.update(id, data);
                case 'suppliers':
                    return await SupplierAPI.update(id, data);
                case 'notifications':
                    return await NotificationAPI.markAsRead(id);
                default:
                    throw new Error('Store not supported');
            }
        } catch (error) {
            throw error;
        }
    }

    async delete(storeName, id) {
        try {
            switch (storeName) {
                case 'inventory_items':
                    return await InventoryAPI.delete(id);
                case 'employees':
                    return await EmployeeAPI.delete(id);
                case 'suppliers':
                    return await SupplierAPI.delete(id);
                case 'revenues':
                    return await FinanceAPI.deleteRevenue(id);
                case 'expenses':
                    return await FinanceAPI.deleteExpense(id);
                default:
                    throw new Error('Store not supported');
            }
        } catch (error) {
            throw error;
        }
    }

    async getAll(storeName) {
        try {
            switch (storeName) {
                case 'inventory_items':
                    return await InventoryAPI.getAll();
                case 'employees':
                    return await EmployeeAPI.getAll();
                case 'suppliers':
                    return await SupplierAPI.getAll();
                case 'revenues':
                    return await FinanceAPI.getRevenues();
                case 'expenses':
                    return await FinanceAPI.getExpenses();
                case 'pos_orders':
                    return await PosAPI.getOrders();
                case 'notifications':
                    return await NotificationAPI.getAll();
                case 'inventory_movements':
                case 'stock_audits':
                case 'waste_records':
                case 'attendance':
                case 'salaries':
                case 'employee_advances':
                case 'shifts':
                case 'purchase_invoices':
                case 'supplier_payments':
                case 'budgets':
                case 'employee_meals':
                case 'employee_meal_orders':
                    return [];
                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error fetching ${storeName}:`, error);
            return [];
        }
    }

    async getById(storeName, id) {
        try {
            switch (storeName) {
                case 'inventory_items':
                    return await InventoryAPI.getById(id);
                case 'employees':
                    return await EmployeeAPI.getById(id);
                case 'suppliers':
                    return await SupplierAPI.getById(id);
                case 'pos_orders':
                    return await PosAPI.getOrderById(id);
                default:
                    throw new Error('Store not supported');
            }
        } catch (error) {
            throw error;
        }
    }

    async getByIndex(storeName, indexName, value) {
        const all = await this.getAll(storeName);
        return all.filter(item => item[indexName] === value);
    }

    async clear(storeName) {
        return Promise.resolve();
    }

    async exportData() {
        const data = {};
        const stores = [
            'inventory_items',
            'employees',
            'suppliers',
            'revenues',
            'expenses',
            'pos_orders',
            'notifications'
        ];

        for (const store of stores) {
            data[store] = await this.getAll(store);
        }

        return data;
    }

    async importData(data) {
        return Promise.resolve();
    }
}

const db = new DatabaseManager();
