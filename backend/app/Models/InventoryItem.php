<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    protected $fillable = [
        'name',
        'category',
        'unit',
        'quantity',
        'min_quantity',
        'purchase_price',
        'sell_price',
        'expiry_date',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'min_quantity' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'item_id');
    }

    public function getProfitMarginAttribute(): float
    {
        if ($this->purchase_price == 0) return 0;
        return (($this->sell_price - $this->purchase_price) / $this->purchase_price) * 100;
    }
}
