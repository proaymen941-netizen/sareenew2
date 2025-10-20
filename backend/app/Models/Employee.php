<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'name',
        'position',
        'department',
        'salary',
        'phone',
        'email',
        'national_id',
        'status',
        'hire_date',
        'notes',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'hire_date' => 'date',
    ];

    public function getHourCostAttribute(): float
    {
        return $this->salary / 176;
    }
}
