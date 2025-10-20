<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Employee;
use App\Models\Supplier;
use App\Models\Revenue;
use App\Models\Expense;

class DashboardController extends Controller
{
    public function stats()
    {
        $inventoryCount = InventoryItem::count();
        $employeeCount = Employee::count();
        $supplierCount = Supplier::count();

        $totalRevenue = Revenue::sum('amount');
        $totalExpenses = Expense::sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;

        $lowStockItems = InventoryItem::whereColumn('quantity', '<', 'min_quantity')->get();

        $expiringItems = InventoryItem::whereDate('expiry_date', '<=', now()->addDays(7))
            ->whereDate('expiry_date', '>', now())
            ->get();

        return response()->json([
            'inventory_count' => $inventoryCount,
            'employee_count' => $employeeCount,
            'supplier_count' => $supplierCount,
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'low_stock_items' => $lowStockItems,
            'expiring_items' => $expiringItems,
        ]);
    }
}
