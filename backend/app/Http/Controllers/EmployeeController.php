<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(Employee::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'position' => 'nullable|string',
            'department' => 'nullable|string',
            'salary' => 'required|numeric',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'national_id' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'hire_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::create($validated);
        return response()->json($employee, 201);
    }

    public function show($id)
    {
        $employee = Employee::findOrFail($id);
        return response()->json($employee);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'position' => 'nullable|string',
            'department' => 'nullable|string',
            'salary' => 'sometimes|numeric',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'national_id' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'hire_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $employee->update($validated);
        return response()->json($employee);
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();
        return response()->json(['message' => 'تم الحذف بنجاح']);
    }
}
