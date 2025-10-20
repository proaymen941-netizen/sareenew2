<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;

Route::prefix('v1')->group(function () {

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::get('/inventory/{id}', [InventoryController::class, 'show']);
    Route::put('/inventory/{id}', [InventoryController::class, 'update']);
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
    Route::get('/inventory/{id}/movements', [InventoryController::class, 'movements']);
    Route::post('/inventory/movements', [InventoryController::class, 'addMovement']);

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

    // Finance
    Route::get('/finance/revenues', [FinanceController::class, 'revenues']);
    Route::get('/finance/expenses', [FinanceController::class, 'expenses']);
    Route::post('/finance/revenues', [FinanceController::class, 'storeRevenue']);
    Route::post('/finance/expenses', [FinanceController::class, 'storeExpense']);
    Route::delete('/finance/revenues/{id}', [FinanceController::class, 'deleteRevenue']);
    Route::delete('/finance/expenses/{id}', [FinanceController::class, 'deleteExpense']);
    Route::get('/finance/summary', [FinanceController::class, 'summary']);

    // POS
    Route::get('/pos/orders', [PosController::class, 'index']);
    Route::post('/pos/orders', [PosController::class, 'store']);
    Route::get('/pos/orders/{id}', [PosController::class, 'show']);
    Route::get('/pos/orders/today', [PosController::class, 'todayOrders']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
