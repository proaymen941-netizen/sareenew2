<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    protected $fillable = [
        'item_id',
        'type',
        'quantity',
        'reason',
        'notes',
        'date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'date' => 'datetime',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }
}
