<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\StockMovement;

class ManageReturnedStock extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:manage-returned {action} {product_id?} {quantity?}
                            {--all : Apply to all products with returned stock}
                            {--dry-run : Show what would happen without making changes}
                            {--reason= : Reason for the action}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage returned stock - restock, discard, or view status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');
        
        switch ($action) {
            case 'status':
                $this->showReturnedStockStatus();
                break;
                
            case 'restock':
                $this->restockFromReturned();
                break;
                
            case 'discard':
                $this->discardReturnedStock();
                break;
                
            case 'list':
                $this->listProductsWithReturnedStock();
                break;
                
            default:
                $this->error("Invalid action. Available actions: status, restock, discard, list");
                return 1;
        }
        
        return 0;
    }

    /**
     * Show overall returned stock status
     */
    private function showReturnedStockStatus()
    {
        $productsWithReturns = Product::where('returned_quantity', '>', 0)->get();
        
        if ($productsWithReturns->isEmpty()) {
            $this->info('ไม่มีสินค้าคืนในระบบ');
            return;
        }
        
        $totalReturnedItems = $productsWithReturns->sum('returned_quantity');
        $totalReturnedValue = $productsWithReturns->sum(function($product) {
            return $product->returned_quantity * $product->price;
        });
        
        $this->info("=== สถานะสต็อกของคืน ===");
        $this->table(
            ['รายการ', 'จำนวน/มูลค่า'],
            [
                ['จำนวนผลิตภัณฑ์ที่มีของคืน', $productsWithReturns->count() . ' รายการ'],
                ['จำนวนชิ้นที่คืนทั้งหมด', number_format($totalReturnedItems) . ' ชิ้น'],
                ['มูลค่าของคืนโดยประมาณ', '฿' . number_format($totalReturnedValue, 2)],
            ]
        );
        
        if ($this->option('verbose')) {
            $this->listProductsWithReturnedStock();
        } else {
            $this->info("\nใช้ --verbose เพื่อดูรายละเอียดสินค้าแต่ละรายการ");
        }
    }

    /**
     * List products with returned stock
     */
    private function listProductsWithReturnedStock()
    {
        $products = Product::where('returned_quantity', '>', 0)
                          ->with('category')
                          ->orderBy('returned_quantity', 'desc')
                          ->get();

        if ($products->isEmpty()) {
            $this->info('ไม่มีสินค้าคืนในระบบ');
            return;
        }

        $this->info("\n=== รายการสินค้าที่มีของคืน ===");
        $data = $products->map(function($product) {
            return [
                'ID' => $product->id,
                'SKU' => $product->sku,
                'ชื่อสินค้า' => $product->name,
                'หมวดหมู่' => $product->category->name ?? 'ไม่ระบุ',
                'สต็อกขาย' => number_format($product->quantity),
                'สต็อกคืน' => number_format($product->returned_quantity),
                'ราคา/ชิ้น' => '฿' . number_format($product->price, 2),
                'มูลค่าคืน' => '฿' . number_format($product->returned_quantity * $product->price, 2),
            ];
        });

        $this->table([
            'ID', 'SKU', 'ชื่อสินค้า', 'หมวดหมู่', 'สต็อกขาย', 'สต็อกคืน', 'ราคา/ชิ้น', 'มูลค่าคืน'
        ], $data);
    }

    /**
     * Restock from returned items
     */
    private function restockFromReturned()
    {
        $productId = $this->argument('product_id');
        $quantity = $this->argument('quantity');
        $reason = $this->option('reason') ?? 'ตรวจสอบสภาพแล้ว สามารถขายต่อได้';
        
        if ($this->option('all')) {
            $this->restockAllReturnedItems($reason);
            return;
        }
        
        if (!$productId) {
            $productId = $this->ask('กรุณาระบุ Product ID');
        }
        
        $product = Product::find($productId);
        if (!$product) {
            $this->error("ไม่พบสินค้า ID: {$productId}");
            return;
        }
        
        $availableReturned = $product->returned_quantity ?? 0;
        if ($availableReturned <= 0) {
            $this->error("สินค้านี้ไม่มีของคืน");
            return;
        }
        
        if (!$quantity) {
            $this->info("สินค้า: {$product->name}");
            $this->info("จำนวนของคืนที่มีอยู่: {$availableReturned} ชิ้น");
            $quantity = $this->ask("กรุณาระบุจำนวนที่ต้องการย้ายกลับเป็นสต็อกขาย (สูงสุด {$availableReturned})", $availableReturned);
        }
        
        $quantity = (int) $quantity;
        if ($quantity <= 0 || $quantity > $availableReturned) {
            $this->error("จำนวนไม่ถูกต้อง ต้องระหว่าง 1-{$availableReturned}");
            return;
        }
        
        if ($this->option('dry-run')) {
            $this->info("[DRY RUN] จะย้าย {$quantity} ชิ้น จากสต็อกคืนเป็นสต็อกขาย");
            $this->info("[DRY RUN] สต็อกขายจะเพิ่มจาก {$product->quantity} เป็น " . ($product->quantity + $quantity));
            $this->info("[DRY RUN] สต็อกคืนจะลดจาก {$availableReturned} เป็น " . ($availableReturned - $quantity));
            return;
        }
        
        $actualMoved = $product->restockFromReturned($quantity);
        $this->info("ย้ายสินค้าสำเร็จ: {$actualMoved} ชิ้น จากสต็อกคืนเป็นสต็อกขาย");
        $this->info("สต็อกขายปัจจุบัน: {$product->fresh()->quantity} ชิ้น");
        $this->info("สต็อกคืนปัจจุบัน: " . ($product->fresh()->returned_quantity ?? 0) . " ชิ้น");
    }

    /**
     * Discard returned stock
     */
    private function discardReturnedStock()
    {
        $productId = $this->argument('product_id');
        $quantity = $this->argument('quantity');
        $reason = $this->option('reason') ?? 'สินค้าเสียหาย ไม่สามารถขายต่อได้';
        
        if (!$productId) {
            $productId = $this->ask('กรุณาระบุ Product ID');
        }
        
        $product = Product::find($productId);
        if (!$product) {
            $this->error("ไม่พบสินค้า ID: {$productId}");
            return;
        }
        
        $availableReturned = $product->returned_quantity ?? 0;
        if ($availableReturned <= 0) {
            $this->error("สินค้านี้ไม่มีของคืน");
            return;
        }
        
        if (!$quantity) {
            $this->info("สินค้า: {$product->name}");
            $this->info("จำนวนของคืนที่มีอยู่: {$availableReturned} ชิ้น");
            $quantity = $this->ask("กรุณาระบุจำนวนที่ต้องการทิ้ง (สูงสุด {$availableReturned})");
        }
        
        $quantity = (int) $quantity;
        if ($quantity <= 0 || $quantity > $availableReturned) {
            $this->error("จำนวนไม่ถูกต้อง ต้องระหว่าง 1-{$availableReturned}");
            return;
        }
        
        if ($this->option('dry-run')) {
            $this->info("[DRY RUN] จะทิ้ง {$quantity} ชิ้น จากสต็อกคืน");
            $this->info("[DRY RUN] สต็อกคืนจะลดจาก {$availableReturned} เป็น " . ($availableReturned - $quantity));
            return;
        }
        
        if (!$this->confirm("ยืนยันการทิ้งสินค้า {$quantity} ชิ้น หรือไม่?")) {
            $this->info("ยกเลิกการทิ้งสินค้า");
            return;
        }
        
        $actualDiscarded = $product->discardReturnedStock($quantity, $reason);
        $this->info("ทิ้งสินค้าสำเร็จ: {$actualDiscarded} ชิ้น จากสต็อกคืน");
        $this->info("สต็อกคืนปัจจุบัน: " . ($product->fresh()->returned_quantity ?? 0) . " ชิ้น");
    }

    /**
     * Restock all returned items
     */
    private function restockAllReturnedItems($reason)
    {
        $products = Product::where('returned_quantity', '>', 0)->get();
        
        if ($products->isEmpty()) {
            $this->info('ไม่มีสินค้าคืนในระบบ');
            return;
        }
        
        $totalMoved = 0;
        $processedProducts = 0;
        
        if ($this->option('dry-run')) {
            $this->info("[DRY RUN] จะย้ายสินค้าคืนกลับเป็นสต็อกขายทั้งหมด " . $products->count() . " รายการ");
            foreach ($products as $product) {
                $this->info("[DRY RUN] {$product->name}: จะย้าย {$product->returned_quantity} ชิ้น");
                $totalMoved += $product->returned_quantity;
            }
            $this->info("[DRY RUN] รวมจะย้าย {$totalMoved} ชิ้น");
            return;
        }
        
        if (!$this->confirm("ยืนยันการย้ายสินค้าคืนทั้งหมด " . $products->count() . " รายการ กลับเป็นสต็อกขาย?")) {
            $this->info("ยกเลิกการดำเนินการ");
            return;
        }
        
        $this->output->progressStart($products->count());
        
        foreach ($products as $product) {
            $moved = $product->restockFromReturned($product->returned_quantity);
            $totalMoved += $moved;
            $processedProducts++;
            $this->output->progressAdvance();
        }
        
        $this->output->progressFinish();
        
        $this->info("ดำเนินการเสร็จสิ้น:");
        $this->info("- ประมวลผล: {$processedProducts} รายการ");
        $this->info("- ย้ายแล้ว: {$totalMoved} ชิ้น");
    }
}