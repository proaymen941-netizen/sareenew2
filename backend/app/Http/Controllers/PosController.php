<?php

namespace App\Http\Controllers;

use App\Models\PosOrder;
use Illuminate\Http\Request;

class PosController extends Controller
{
    public function index()
    {
        return response()->json(PosOrder::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department' => 'required|string',
            'items' => 'required|array',
            'total' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $order = PosOrder::create($validated);
        return response()->json($order, 201);
    }

    public function show($id)
    {
        $order = PosOrder::findOrFail($id);
        return response()->json($order);
    }

    public function todayOrders()
    {
        $orders = PosOrder::whereDate('created_at', today())->get();
        return response()->json($orders);
    }
}
