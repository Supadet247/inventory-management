<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_id',
        'customer_name',
        'customer_phone',
        'id_card_number',
        'total_amount',
        'down_payment_percent',
        'installment_count',
        'installment_amount',
        'installment_start_date',
        'paid_amount',
        'paid_installments',
        'status',
        'note',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'down_payment_percent' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'installment_start_date' => 'date',
    ];

    /**
     * Get the receipt that this credit belongs to
     */
    public function receipt()
    {
        return $this->belongsTo(Receipt::class);
    }

    /**
     * Get down payment amount
     */
    public function getDownPaymentAmountAttribute()
    {
        return $this->total_amount * ($this->down_payment_percent / 100);
    }

    /**
     * Get remaining amount
     */
    public function getRemainingAmountAttribute()
    {
        return $this->total_amount - $this->paid_amount;
    }

    /**
     * Get remaining installments
     */
    public function getRemainingInstallmentsAttribute()
    {
        return $this->installment_count - $this->paid_installments;
    }

    /**
     * Check if credit is fully paid
     */
    public function isPaid()
    {
        return $this->paid_amount >= $this->total_amount;
    }

    /**
     * Check if installment is active
     */
    public function isActive()
    {
        return $this->status === 'active';
    }
}
