<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeMeal extends Model
{
    protected $fillable = [
        'name',
        'price',
        'category',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];
}
