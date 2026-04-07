<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'sale_id',
        'user_id',
        'customer_name',
        'customer_phone',
        'customer_tax_id',
        'total_amount',
        'tax_amount',
        'grand_total',
        'payment_method',
        'received_amount',
        'change_amount',
        'receipt_type',
        'status',
        'issued_at',
        'notes',
        'paid_amount',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'received_amount' => 'json',
            'change_amount' => 'decimal:2',
            'issued_at' => 'datetime',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function receiptItems()
    {
        return $this->hasMany(ReceiptItem::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnModel::class, 'original_receipt_id');
    }

    public function customerCredits()
    {
        return $this->hasMany(CustomerCredit::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSales($query)
    {
        return $query->where('receipt_type', 'sale');
    }

    public function scopeReturnable($query)
    {
        return $query->where('status', 'active')
                    ->where('receipt_type', 'sale')
                    ->where('issued_at', '>=', now()->subDays(config('pos.return_policy.max_days', 7)));
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('issued_at', [$startDate, $endDate]);
    }

    public function scopeByPaymentMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    // Accessors
    public function getFormattedReceiptNumberAttribute()
    {
        return 'R' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    public function getFormattedIssuedDateAttribute()
    {
        return $this->issued_at->format('d/m/Y H:i');
    }

    public function getCanReturnAttribute()
    {
        $maxReturnDays = config('pos.return_policy.max_days', 7);
        $daysSinceIssued = $this->issued_at->diffInDays(now());
        
        return $this->status === 'active' && 
               $this->receipt_type === 'sale' && 
               $daysSinceIssued <= $maxReturnDays;
    }

    public function getTotalReturnedAmountAttribute()
    {
        return $this->returns()
                   ->where('status', 'completed')
                   ->sum('grand_return_total');
    }

    public function getRemainingReturnableAmountAttribute()
    {
        return $this->grand_total - $this->total_returned_amount;
    }

    public function getIsFullyReturnedAttribute()
    {
        return $this->total_returned_amount >= $this->grand_total;
    }

    public function getReturnableItemsAttribute()
    {
        return $this->receiptItems->filter(function ($item) {
            return $item->returnable_quantity > 0;
        });
    }

    // Methods
    public function generateReceiptNumber()
    {
        $date = $this->issued_at->format('Ymd');
        $lastReceipt = self::whereDate('issued_at', $this->issued_at->toDateString())
                          ->orderBy('id', 'desc')
                          ->first();
        
        $sequence = $lastReceipt ? (int)substr($lastReceipt->receipt_number, -4) + 1 : 1;
        
        return $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function canBeReturned()
    {
        return $this->can_return && !$this->is_fully_returned;
    }

    public function markAsVoided($reason = null)
    {
        $this->update([
            'status' => 'voided',
            'notes' => ($this->notes ? $this->notes . "\n" : '') . "Voided: " . $reason
        ]);
    }

    public function markAsReturned()
    {
        if ($this->is_fully_returned) {
            $this->update(['status' => 'returned']);
        }
    }

    // Static methods
    public static function generateNewReceiptNumber($date = null)
    {
        $date = $date ? Carbon::parse($date) : now();
        $dateStr = $date->format('Ymd');
        
        // ใช้ lockForUpdate และ MAX() เพื่อหาเลขล่าสุดที่แน่นอน
        $maxReceiptNumber = self::where('receipt_number', 'like', $dateStr . '%')
                                ->lockForUpdate()
                                ->max('receipt_number');
        
        if ($maxReceiptNumber) {
            // ดึงเลข 4 หลักสุดท้ายมาบวก 1
            $sequence = (int)substr($maxReceiptNumber, -4) + 1;
        } else {
            $sequence = 1;
        }
        
        return $dateStr . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public static function findByReceiptNumber($receiptNumber)
    {
        return self::where('receipt_number', $receiptNumber)->first();
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($receipt) {
            if (!$receipt->receipt_number) {
                // สร้างเลขใบเสร็จใหม่ภายใน transaction
                $receipt->receipt_number = self::generateNewReceiptNumber($receipt->issued_at);
            }
        });
    }
}
