<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ReturnModel extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'return_number',
        'original_receipt_id',
        'user_id',
        'total_return_amount',
        'tax_return_amount',
        'grand_return_total',
        'return_type',
        'reason',
        'status',
        'returned_at',
        'notes',
        'warranty_claim_received',
        'warranty_claim_received_at',
    ];

    protected $appends = [
        'can_approve',
        'can_complete',
        'can_cancel',
        'has_warranty_claim_items',
        'can_confirm_warranty_claim',
    ];

    protected function casts(): array
    {
        return [
            'total_return_amount' => 'decimal:2',
            'tax_return_amount' => 'decimal:2',
            'grand_return_total' => 'decimal:2',
            'returned_at' => 'datetime',
            'warranty_claim_received' => 'boolean',
            'warranty_claim_received_at' => 'datetime',
        ];
    }

    // Relationships
    public function originalReceipt()
    {
        return $this->belongsTo(Receipt::class, 'original_receipt_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function returnItems()
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('returned_at', [$startDate, $endDate]);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByReturnType($query, $type)
    {
        return $query->where('return_type', $type);
    }

    // Accessors
    public function getFormattedReturnNumberAttribute()
    {
        return 'RT' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    public function getFormattedReturnedDateAttribute()
    {
        return $this->returned_at->format('d/m/Y H:i');
    }

    public function getCanApproveAttribute()
    {
        return $this->status === 'pending';
    }

    public function getCanCompleteAttribute()
    {
        return $this->status === 'approved';
    }

    public function getCanCancelAttribute()
    {
        return in_array($this->status, ['pending', 'approved']);
    }

    public function getHasWarrantyClaimItemsAttribute()
    {
        return $this->returnItems->contains(function ($item) {
            return $item->reason === 'เครมประกันสินค้า';
        });
    }

    public function getCanConfirmWarrantyClaimAttribute()
    {
        return $this->status === 'completed' 
            && $this->has_warranty_claim_items 
            && !$this->warranty_claim_received;
    }

    public function getTotalItemsReturnedAttribute()
    {
        return $this->returnItems->sum('quantity');
    }

    public function getRefundPercentageAttribute()
    {
        if ($this->originalReceipt->grand_total == 0) return 0;
        return round(($this->grand_return_total / $this->originalReceipt->grand_total) * 100, 1);
    }

    // Methods
    public function approve($notes = null)
    {
        if (!$this->can_approve) {
            throw new \Exception('Return cannot be approved in current status: ' . $this->status);
        }

        $this->update([
            'status' => 'approved',
            'notes' => $notes ? ($this->notes ? $this->notes . "\n" : '') . "Approved: " . $notes : $this->notes
        ]);

        return $this;
    }

    public function complete($notes = null)
    {
        if (!$this->can_complete) {
            throw new \Exception('Return cannot be completed in current status: ' . $this->status);
        }

        // ตรวจสอบสต็อกเพียงพอสำหรับรายการเครมประกัน (ก่อนดำเนินการ)
        foreach ($this->returnItems as $returnItem) {
            if ($returnItem->reason === 'เครมประกันสินค้า') {
                $product = $returnItem->product;
                if ($product && $product->quantity < $returnItem->quantity) {
                    throw new \Exception(
                        "สินค้า '{$product->name}' ในสต็อกมีไม่เพียงพอ: " .
                        "ต้องการ {$returnItem->quantity} ชิ้น แต่มีอยู่ {$product->quantity} ชิ้น " .
                        "ยังเบิกสินค้าให้ลูกค้าไม่ได้"
                    );
                }
            }
        }

        // Process stock returns based on return reason
        foreach ($this->returnItems as $returnItem) {
            $product = $returnItem->product;
            if ($product) {
                if ($returnItem->reason === 'ซื้อผิด') {
                    // ซื้อผิด: เพิ่มเข้าสต็อกหลัก (พร้อมขาย) และเพิ่มเข้า Lot ปัจจุบัน
                    $oldQuantity = $product->quantity ?? 0;
                    $newQuantity = $oldQuantity + $returnItem->quantity;
                    $product->update(['quantity' => $newQuantity]);

                    // เพิ่มสินค้าเข้า Lot ปัจจุบัน (FIFO - lot เก่าที่สุดที่ยังมีสต็อก)
                    $currentLot = $product->stockLotInstances()
                        ->where('quantity', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->first();
                    
                    // ถ้าไม่มี lot ที่ active ให้หา lot ล่าสุด
                    if (!$currentLot) {
                        $currentLot = $product->stockLotInstances()
                            ->orderBy('created_at', 'desc')
                            ->first();
                    }
                    
                    if (!$currentLot) {
                        // ไม่มี lot รองรับ - ไม่สามารถทำรายการได้
                        throw new \Exception("ไม่สามารถอนุมัติใบคืนได้: สินค้า '{$product->name}' ไม่มี Lot รองรับสำหรับรับคืน กรุณาตรวจสอบสต็อกสินค้า");
                    }
                    
                    // เพิ่มเข้า lot ที่มีอยู่
                    $currentLot->increment('quantity', $returnItem->quantity);

                    // Create stock movement record for main inventory
                    StockMovement::create([
                        'product_id' => $product->id,
                        'stock_lot_instance_id' => $currentLot->id,
                        'user_id' => $this->user_id,
                        'type' => 'return_in',
                        'quantity' => $returnItem->quantity,
                        'previous_quantity' => $oldQuantity,
                        'new_quantity' => $newQuantity,
                        'notes' => "สินค้าคืนเข้าสต็อกหลัก (ซื้อผิด) เข้า Lot {$currentLot->lot_number} - ใบคืน #{$this->return_number}",
                    ]);
                } elseif ($returnItem->reason === 'เครมประกันสินค้า') {
                    // เครมประกัน: หักสินค้าจากคลัง (FIFO lot) และสินค้าที่รับคืนจากดีลเลอร์จะเพิ่มกลับ
                    $lotService = app(\App\Services\InventoryLotService::class);
                    
                    // หักจาก lot ปัจจุบัน (FIFO)
                    $oldQuantity = $product->quantity ?? 0;
                    $lotService->issueLot(
                        $product,
                        $returnItem->quantity,
                        null,  // No specific lot - use FIFO
                        "หักสต็อกเพื่อเครมประกันให้ลูกค้า - ใบคืน #{$this->return_number}"
                    );
                    $newQuantity = $product->quantity ?? 0;

                    // Create stock movement record for warranty claim deduction
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => $this->user_id,
                        'type' => 'warranty_claim_out',
                        'quantity' => -$returnItem->quantity,
                        'previous_quantity' => $oldQuantity,
                        'new_quantity' => $newQuantity,
                        'notes' => "หักสต็อกเพื่อเครมประกันให้ลูกค้า (FIFO lot deduction) - ใบคืน #{$this->return_number}",
                    ]);
                } else {
                    // สินค้าชำรุด: เก็บแยก ไม่พร้อมขาย
                    $oldReturnedQuantity = $product->returned_quantity ?? 0;
                    $newReturnedQuantity = $oldReturnedQuantity + $returnItem->quantity;
                    $product->update(['returned_quantity' => $newReturnedQuantity]);

                    // Create stock movement record for returned inventory
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => $this->user_id,
                        'type' => 'return_in',
                        'quantity' => $returnItem->quantity,
                        'previous_quantity' => $oldReturnedQuantity,
                        'new_quantity' => $newReturnedQuantity,
                        'notes' => "สินค้าคืนเข้าระบบ (รอตรวจสอบ) - ใบคืน #{$this->return_number} | เหตุผล: {$returnItem->reason}",
                    ]);
                }
            }
        }

        // Update receipt item returned quantities
        foreach ($this->returnItems as $returnItem) {
            $receiptItem = $returnItem->receiptItem;
            if ($receiptItem) {
                $receiptItem->increment('returned_quantity', $returnItem->quantity);
            }
        }

        $this->update([
            'status' => 'completed',
            'notes' => $notes ? ($this->notes ? $this->notes . "\n" : '') . "Completed: " . $notes : $this->notes
        ]);

        $this->originalReceipt->refresh();
        if ($this->originalReceipt->is_fully_returned) {
            $this->originalReceipt->markAsReturned();
        }

        return $this;
    }

    /**
     * Confirm warranty claim received from dealer
     * ยืนยันว่าได้รับสินค้าใหม่จากดีลเลอร์แล้ว → เพิ่มสต็อกกลับ
     */
    public function confirmWarrantyClaim($notes = null)
    {
        if (!$this->can_confirm_warranty_claim) {
            throw new \Exception('ไม่สามารถยืนยันการรับสินค้าจากดีลเลอร์ได้');
        }

        $lotService = app(\App\Services\InventoryLotService::class);

        // เพิ่มสต็อกกลับเข้าคลัง (เข้า lot ปัจจุบัน)
        foreach ($this->returnItems as $returnItem) {
            if ($returnItem->reason === 'เครมประกันสินค้า') {
                $product = $returnItem->product;
                if ($product) {
                    // Refresh product to get current quantity
                    $product = $product->fresh();
                    
                    // หา lot ที่เก่าที่สุดที่มี quantity > 0 (lot ปัจจุบัน - FIFO)
                    $currentLot = $product->stockLotInstances()
                        ->where('quantity', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->first();
                    
                    // ถ้าไม่มี lot ที่ active ให้หา lot ล่าสุด
                    if (!$currentLot) {
                        $currentLot = $product->stockLotInstances()
                            ->orderBy('created_at', 'desc')
                            ->first();
                    }
                    
                    if (!$currentLot) {
                        // ไม่มี lot รองรับ - ไม่สามารถทำรายการได้
                        throw new \Exception("ไม่สามารถบันทึกการรับสินค้าจากดีลเลอร์ได้: สินค้า '{$product->name}' ไม่มี Lot รองรับ กรุณาตรวจสอบสต็อกสินค้า");
                    }
                    
                    $lotNumber = $currentLot->lot_number;
                    
                    // เพิ่มเข้า lot ปัจจุบัน
                    $lotService->receiveLot(
                        $product,
                        $lotNumber,
                        $returnItem->quantity,
                        null,
                        "ได้รับสินค้าจากดีลเลอร์ (เครมประกัน) เพิ่มเข้า lot {$lotNumber} - ใบคืน #{$this->return_number}"
                    );
                    
                    // receiveLot() already created the stock movement record, so no need to create again
                }
            }
        }

        $this->update([
            'warranty_claim_received' => true,
            'warranty_claim_received_at' => now(),
            'notes' => $notes 
                ? ($this->notes ? $this->notes . "\n" : '') . "ได้รับสินค้าจากดีลเลอร์: " . $notes 
                : ($this->notes ? $this->notes . "\n" : '') . "ได้รับสินค้าจากดีลเลอร์แล้ว"
        ]);

        return $this;
    }

    public function cancel($reason = null)
    {
        if (!$this->can_cancel) {
            throw new \Exception('Return cannot be cancelled in current status: ' . $this->status);
        }

        $this->update([
            'status' => 'cancelled',
            'notes' => $reason ? ($this->notes ? $this->notes . "\n" : '') . "Cancelled: " . $reason : $this->notes
        ]);

        return $this;
    }

    public function generateReturnNumber()
    {
        $date = $this->returned_at->format('Ymd');
        $lastReturn = self::whereDate('returned_at', $this->returned_at->toDateString())
                         ->orderBy('id', 'desc')
                         ->first();
        
        $sequence = $lastReturn ? (int)substr($lastReturn->return_number, -4) + 1 : 1;
        
        return 'R' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function calculateTotals()
    {
        $totalAmount = $this->returnItems->sum('total_price');
        $taxAmount = $totalAmount * 0.07; // 7% VAT
        $grandTotal = $totalAmount + $taxAmount;

        $this->update([
            'total_return_amount' => $totalAmount,
            'tax_return_amount' => $taxAmount,
            'grand_return_total' => $grandTotal,
        ]);

        return $this;
    }

    // Static methods
    public static function generateNewReturnNumber($date = null)
    {
        $date = $date ? Carbon::parse($date) : now();
        $dateStr = $date->format('Ymd');
        
        $lastReturn = self::whereDate('returned_at', $date->toDateString())
                         ->orderBy('id', 'desc')
                         ->first();
        
        $sequence = $lastReturn ? (int)substr($lastReturn->return_number, -4) + 1 : 1;
        
        return 'R' . $dateStr . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public static function findByReturnNumber($returnNumber)
    {
        return self::where('return_number', $returnNumber)->first();
    }

    public static function createFromReceipt($receipt, $returnItems, $reason = null, $userId = null)
    {
        $userId = $userId ?: auth()->id();
        
        $return = self::create([
            'return_number' => self::generateNewReturnNumber(),
            'original_receipt_id' => $receipt->id,
            'user_id' => $userId,
            'total_return_amount' => 0, // Will be calculated later
            'tax_return_amount' => 0,
            'grand_return_total' => 0,
            'return_type' => self::determineReturnType($receipt, $returnItems),
            'reason' => $reason,
            'status' => 'pending',
            'returned_at' => now(),
        ]);

        // Add return items
        foreach ($returnItems as $itemData) {
            ReturnItem::create([
                'return_id' => $return->id,
                'receipt_item_id' => $itemData['receipt_item_id'],
                'product_id' => $itemData['product_id'],
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                'reason' => $itemData['reason'],
                'condition_note' => $itemData['condition_note'] ?? null,
            ]);
        }

        // Calculate totals
        $return->calculateTotals();

        return $return;
    }

    private static function determineReturnType($receipt, $returnItems)
    {
        // Count unique items being returned
        $returnItemCount = count($returnItems);
        
        // Count total items in original receipt
        $originalItemCount = $receipt->receiptItems->count();
        
        // If returning same number of items as original, it's full return
        return $returnItemCount >= $originalItemCount ? 'full' : 'partial';
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($return) {
            if (!$return->return_number) {
                $return->return_number = self::generateNewReturnNumber($return->returned_at);
            }
        });
    }
}