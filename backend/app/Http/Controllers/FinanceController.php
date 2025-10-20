<?php

namespace App\Http\Controllers;

use App\Models\Revenue;
use App\Models\Expense;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function revenues()
    {
        return response()->json(Revenue::all());
    }

    public function expenses()
    {
        return response()->json(Expense::all());
    }

    public function storeRevenue(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'description' => 'nullable|string',
            'type' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $revenue = Revenue::create($validated);
        return response()->json($revenue, 201);
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'description' => 'nullable|string',
            'type' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $expense = Expense::create($validated);
        return response()->json($expense, 201);
    }

    public function deleteRevenue($id)
    {
        $revenue = Revenue::findOrFail($id);
        $revenue->delete();
        return response()->json(['message' => 'تم الحذف بنجاح']);
    }

    public function deleteExpense($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();
        return response()->json(['message' => 'تم الحذف بنجاح']);
    }

    public function summary()
    {
        $totalRevenue = Revenue::sum('amount');
        $totalExpenses = Expense::sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
        ]);
    }
}
