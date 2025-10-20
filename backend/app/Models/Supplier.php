<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'product_type',
        'phone',
        'email',
        'address',
        'rating',
        'notes',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];
}
