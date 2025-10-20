// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// API Helper
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'حدث خطأ في الاتصال');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Dashboard API
const DashboardAPI = {
    getStats: () => API.get('/dashboard/stats'),
};

// Inventory API
const InventoryAPI = {
    getAll: () => API.get('/inventory'),
    getById: (id) => API.get(`/inventory/${id}`),
    create: (data) => API.post('/inventory', data),
    update: (id, data) => API.put(`/inventory/${id}`, data),
    delete: (id) => API.delete(`/inventory/${id}`),
    getMovements: (id) => API.get(`/inventory/${id}/movements`),
    addMovement: (data) => API.post('/inventory/movements', data),
};

// Employee API
const EmployeeAPI = {
    getAll: () => API.get('/employees'),
    getById: (id) => API.get(`/employees/${id}`),
    create: (data) => API.post('/employees', data),
    update: (id, data) => API.put(`/employees/${id}`, data),
    delete: (id) => API.delete(`/employees/${id}`),
};

// Supplier API
const SupplierAPI = {
    getAll: () => API.get('/suppliers'),
    getById: (id) => API.get(`/suppliers/${id}`),
    create: (data) => API.post('/suppliers', data),
    update: (id, data) => API.put(`/suppliers/${id}`, data),
    delete: (id) => API.delete(`/suppliers/${id}`),
};

// Finance API
const FinanceAPI = {
    getRevenues: () => API.get('/finance/revenues'),
    getExpenses: () => API.get('/finance/expenses'),
    createRevenue: (data) => API.post('/finance/revenues', data),
    createExpense: (data) => API.post('/finance/expenses', data),
    deleteRevenue: (id) => API.delete(`/finance/revenues/${id}`),
    deleteExpense: (id) => API.delete(`/finance/expenses/${id}`),
    getSummary: () => API.get('/finance/summary'),
};

// POS API
const PosAPI = {
    getOrders: () => API.get('/pos/orders'),
    getTodayOrders: () => API.get('/pos/orders/today'),
    getOrderById: (id) => API.get(`/pos/orders/${id}`),
    createOrder: (data) => API.post('/pos/orders', data),
};

// Notification API
const NotificationAPI = {
    getAll: () => API.get('/notifications'),
    getUnread: () => API.get('/notifications/unread'),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    markAllAsRead: () => API.put('/notifications/read-all'),
};
