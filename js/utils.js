// Utility Functions

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR'
    }).format(amount);
}

// Format Date
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Format Time
function formatTime(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Calculate Profit Margin
function calculateProfitMargin(purchasePrice, sellPrice) {
    if (purchasePrice === 0) return 0;
    return ((sellPrice - purchasePrice) / purchasePrice * 100).toFixed(2);
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.cssText = 'position: fixed; top: 90px; left: 50%; transform: translateX(50%); z-index: 9999; min-width: 300px;';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Show Modal
function showModal(title, content, buttons = []) {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="btn-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length ? `
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class}" onclick="${btn.onclick}">${btn.text}</button>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

function closeModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modalContainer').innerHTML = '';
    }
}

// Confirm Dialog
async function confirm(message) {
    return new Promise((resolve) => {
        const content = `<p>${message}</p>`;
        const buttons = [
            { text: 'تأكيد', class: 'btn-primary', onclick: `confirmAction(true)` },
            { text: 'إلغاء', class: 'btn-secondary', onclick: `confirmAction(false)` }
        ];
        
        window.confirmCallback = resolve;
        showModal('تأكيد', content, buttons);
    });
}

function confirmAction(result) {
    if (window.confirmCallback) {
        window.confirmCallback(result);
        window.confirmCallback = null;
    }
    closeModal();
}

// Export to JSON
function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Export to CSV
function exportToCSV(data, filename, headers) {
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        csv += headers.map(header => {
            const value = row[header] || '';
            return `"${value}"`;
        }).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Import from JSON
async function importFromJSON() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    showToast('خطأ في قراءة الملف', 'error');
                    resolve(null);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
}

// Validate Arabic Input
function validateArabic(text) {
    const arabicPattern = /[\u0600-\u06FF\s]+/;
    return arabicPattern.test(text);
}

// Validate Number
function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search Filter
function searchFilter(items, query, fields) {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
        fields.some(field => 
            String(item[field]).toLowerCase().includes(lowerQuery)
        )
    );
}

// Sort Array
function sortArray(arr, field, direction = 'asc') {
    return [...arr].sort((a, b) => {
        if (direction === 'asc') {
            return a[field] > b[field] ? 1 : -1;
        } else {
            return a[field] < b[field] ? 1 : -1;
        }
    });
}

// Get Date Range
function getDateRange(period) {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(now.getDate() - 7);
            break;
        case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
        default:
            start.setHours(0, 0, 0, 0);
    }
    
    return { start, end: now };
}

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Print Element
function printElement(elementId) {
    const element = document.getElementById(elementId);
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html dir="rtl"><head><title>طباعة</title>');
    printWindow.document.write('<link rel="stylesheet" href="styles.css">');
    printWindow.document.write('</head><body>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Local Storage Helpers
const storage = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item || item === '' || item === 'undefined' || item === 'null') {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.warn(`Error parsing localStorage key "${key}":`, error);
            return defaultValue;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};
