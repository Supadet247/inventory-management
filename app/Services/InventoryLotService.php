<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockLotInstance;
use App\Models\StockMovement;
use Carbon\Carbon;

class InventoryLotService
{
    /**
     * Generate auto-increment lot number with date suffix
     * Format: LOT001_250225 (LOT + sequence + _ + DDMMYY)
     * Resets sequence every year
     *
     * @param int|null $productId Filter by product ID to count lots per product
     */
    public function generateLotNumber(?int $productId = null): string
    {
        $now = Carbon::now();
        $dateSuffix = $now->format('dmy'); // 250225 for 25 Feb 2025
        $currentYear = $now->year;

        // Build query to find the latest lot number for current year (any date)
        $query = StockLotInstance::whereYear('created_at', $currentYear)
            ->where('lot_number', 'like', 'LOT%_%');

        if ($productId !== null) {
            $query->where('product_id', $productId);
        }

        $latestLot = $query->orderBy('id', 'desc')->first();

        if ($latestLot) {
            // Extract sequence number from existing lot (e.g., LOT001_250225 -> 001)
            preg_match('/LOT(\d+)_/', $latestLot->lot_number, $matches);
            $sequence = isset($matches[1]) ? intval($matches[1]) + 1 : 1;
        } else {
            $sequence = 1;
        }

        // Format: LOT001_250225
        return sprintf('LOT%03d_%s', $sequence, $dateSuffix);
    }

    /**
     * Get next available lot number (for frontend display)
     *
     * @param int|null $productId Filter by product ID
     */
    public function getNextLotNumber(?int $productId = null): string
    {
        return $this->generateLotNumber($productId);
    }

    /**
     * Receive stock into a specific lot
     * Used when type = 'in' with lot information
     */
    public function receiveLot(
        Product $product,
        ?string $lotNumber = null,
        int $quantity,
        $expiryDate = null,
        $notes = null
    ): StockLotInstance {
        if (empty($lotNumber)) {
            $lotNumber = $this->generateLotNumber();
        }
        $lotInstance = StockLotInstance::firstOrCreate(
            [
                'product_id' => $product->id,
                'lot_number' => $lotNumber,
            ],
            [
                'quantity' => 0,
                'expiry_date' => $expiryDate,
            ]
        );

        // Update expiry_date if provided and lot already exists
        if ($expiryDate && !$lotInstance->expiry_date) {
            $lotInstance->update(['expiry_date' => $expiryDate]);
        }

        $previousLotQty = $lotInstance->quantity;
        $lotInstance->increment('quantity', $quantity);

        // Update product total quantity
        $previousProductQty = $product->quantity;
        $product->increment('quantity', $quantity);

        // Record stock movement linked to lot
        StockMovement::create([
            'product_id' => $product->id,
            'stock_lot_instance_id' => $lotInstance->id,
            'user_id' => auth()->id() ?? 1,
            'type' => 'in',
            'quantity' => $quantity,
            'previous_quantity' => $previousProductQty,
            'new_quantity' => $previousProductQty + $quantity,
            'notes' => $this->buildNotes($notes, $lotNumber, $expiryDate),
        ]);

        return $lotInstance->fresh();
    }

    /**
     * Issue stock from a specific lot (FIFO if no lot specified)
     * Used when type = 'out'
     */
    public function issueLot(
        Product $product,
        int $quantity,
        ?string $lotNumber = null,
        $notes = null
    ): void {
        $previousProductQty = $product->quantity;

        if ($lotNumber) {
            // Issue from specific lot
            $lotInstance = StockLotInstance::where('product_id', $product->id)
                ->where('lot_number', $lotNumber)
                ->where('quantity', '>', 0)
                ->firstOrFail();

            $lotInstance->decrement('quantity', min($quantity, $lotInstance->quantity));

            // Record movement
            StockMovement::create([
                'product_id' => $product->id,
                'stock_lot_instance_id' => $lotInstance->id,
                'user_id' => auth()->id() ?? 1,
                'type' => 'out',
                'quantity' => $quantity,
                'previous_quantity' => $previousProductQty,
                'new_quantity' => max(0, $previousProductQty - $quantity),
                'notes' => $notes ?? "Issued from lot {$lotNumber}",
            ]);
        } else {
            // FIFO: Issue from oldest lot first
            $remainingQty = $quantity;
            $lots = StockLotInstance::where('product_id', $product->id)
                ->where('quantity', '>', 0)
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($lots as $lot) {
                if ($remainingQty <= 0) break;

                $issueQty = min($remainingQty, $lot->quantity);
                $lot->decrement('quantity', $issueQty);
                $remainingQty -= $issueQty;

                StockMovement::create([
                    'product_id' => $product->id,
                    'stock_lot_instance_id' => $lot->id,
                    'user_id' => auth()->id() ?? 1,
                    'type' => 'out',
                    'quantity' => $issueQty,
                    'previous_quantity' => $previousProductQty,
                    'new_quantity' => max(0, $previousProductQty - $issueQty),
                    'notes' => $notes ?? "Issued from lot {$lot->lot_number} (FIFO)",
                ]);

                $previousProductQty -= $issueQty;
            }
        }

        // Update product total quantity
        $product->update(['quantity' => max(0, $product->quantity - $quantity)]);
    }

    /**
     * Assign existing product stock to a new lot (no quantity change on product)
     * Used when a product has stock but no lots yet — converts it to lot-tracked
     */
    public function assignExistingStockToLot(
        Product $product,
        string $lotNumber,
        int $quantity,
        $expiryDate = null,
        $notes = null
    ): StockLotInstance {
        $lotInstance = StockLotInstance::firstOrCreate(
            [
                'product_id' => $product->id,
                'lot_number' => $lotNumber,
            ],
            [
                'quantity' => 0,
                'expiry_date' => $expiryDate,
            ]
        );

        $lotInstance->update(['quantity' => $quantity]);

        // Record movement as assignment — product total stays the same
        StockMovement::create([
            'product_id' => $product->id,
            'stock_lot_instance_id' => $lotInstance->id,
            'user_id' => auth()->id() ?? 1,
            'type' => 'adjustment',
            'quantity' => $quantity,
            'previous_quantity' => $product->quantity,
            'new_quantity' => $product->quantity,
            'notes' => $notes ?? "Assigned existing stock to lot {$lotNumber}",
        ]);

        return $lotInstance->fresh();
    }

    /**
     * Adjust stock for a specific lot
     * Used when type = 'adjustment'
     */
    public function adjustLot(
        Product $product,
        int $newQuantity,
        ?string $lotNumber = null,
        $notes = null
    ): void {
        $previousProductQty = $product->quantity;

        if ($lotNumber) {
            $lotInstance = StockLotInstance::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'lot_number' => $lotNumber,
                ],
                ['quantity' => 0]
            );

            $diff = $newQuantity - $lotInstance->quantity;
            $lotInstance->update(['quantity' => $newQuantity]);

            // Adjust product total
            $product->update(['quantity' => max(0, $previousProductQty + $diff)]);

            StockMovement::create([
                'product_id' => $product->id,
                'stock_lot_instance_id' => $lotInstance->id,
                'user_id' => auth()->id() ?? 1,
                'type' => 'adjustment',
                'quantity' => abs($diff),
                'previous_quantity' => $previousProductQty,
                'new_quantity' => max(0, $previousProductQty + $diff),
                'notes' => $notes ?? "Adjusted lot {$lotNumber} to {$newQuantity}",
            ]);
        } else {
            // No lot specified - adjust product directly
            $diff = abs($newQuantity - $previousProductQty);
            $product->update(['quantity' => $newQuantity]);

            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => auth()->id() ?? 1,
                'type' => 'adjustment',
                'quantity' => $diff,
                'previous_quantity' => $previousProductQty,
                'new_quantity' => $newQuantity,
                'notes' => $notes ?? "Stock adjusted to {$newQuantity}",
            ]);
        }
    }

    /**
     * Get all lots for a product
     */
    public function getLotsForProduct(Product $product)
    {
        return $product->stockLotInstances()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get available (non-zero quantity) lots for a product
     */
    public function getAvailableLotsForProduct(Product $product)
    {
        return $product->stockLotInstances()
            ->available()
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Sync product total quantity from all lots
     */
    public function syncProductQuantity(Product $product): void
    {
        $totalLotQuantity = $product->stockLotInstances()->sum('quantity');
        $product->update(['quantity' => $totalLotQuantity]);
    }

    /**
     * Build notes string with lot info
     */
    private function buildNotes(?string $notes, string $lotNumber, $expiryDate = null): string
    {
        $result = $notes ?? '';
        
        if ($lotNumber && $lotNumber !== 'DEFAULT') {
            $result .= ($result ? ' | ' : '') . "Lot: {$lotNumber}";
        }
        
        if ($expiryDate) {
            $result .= ($result ? ' | ' : '') . "Expiry: {$expiryDate}";
        }

        return $result ?: "Received lot {$lotNumber}";
    }
}
