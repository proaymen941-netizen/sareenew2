<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(InventoryItem::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'unit' => 'required|string',
            'quantity' => 'required|numeric',
            'min_quantity' => 'nullable|numeric',
            'purchase_price' => 'required|numeric',
            'sell_price' => 'required|numeric',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = InventoryItem::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'category' => 'sometimes|string',
            'unit' => 'sometimes|string',
            'quantity' => 'sometimes|numeric',
            'min_quantity' => 'nullable|numeric',
            'purchase_price' => 'sometimes|numeric',
            'sell_price' => 'sometimes|numeric',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'تم الحذف بنجاح']);
    }

    public function movements($id)
    {
        $item = InventoryItem::findOrFail($id);
        return response()->json($item->movements);
    }

    public function addMovement(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|numeric',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $movement = InventoryMovement::create($validated);

        $item = InventoryItem::find($validated['item_id']);
        if ($validated['type'] === 'in') {
            $item->quantity += $validated['quantity'];
        } else {
            $item->quantity -= $validated['quantity'];
        }
        $item->save();

        return response()->json($movement, 201);
    }
}
