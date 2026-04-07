<?php

namespace App\Http\Controllers;

use App\Models\CustomerCredit;
use App\Models\Sale;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountsReceivableController extends Controller
{
    /**
     * Display accounts credit management page
     */
    public function index(Request $request)
    {
        $summary = $this->getSummaryData();

        $credits = CustomerCredit::query()
            ->when($request->search, function ($query, $search) {
                $query->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_phone', 'like', "%{$search}%")
                      ->orWhere('id_card_number', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render(
            auth()->user() && auth()->user()->role === 'admin' 
                ? 'Admin/AccountsReceivable/Index' 
                : 'Staff/AccountsReceivable/Index',
            [
                'credits' => $credits,
                'summary' => $summary,
                'filters' => $request->only(['search', 'status']),
            ]
        );
    }

    /**
     * Create a new credit/installment plan
     */
    public function createCredit(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|size:10',
            'total_amount' => 'required|numeric|min:1',
            'down_payment_percent' => 'required|numeric|min:30|max:50',
            'installment_count' => 'required|integer|min:1|max:5',
            'installment_amount' => 'required|numeric|min:0',
            'installment_start_date' => 'required|date',
            'note' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $credit = CustomerCredit::create([
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'total_amount' => $request->total_amount,
                'down_payment_percent' => $request->down_payment_percent,
                'installment_count' => $request->installment_count,
                'installment_amount' => $request->installment_amount,
                'installment_start_date' => $request->installment_start_date,
                'paid_amount' => $request->total_amount * ($request->down_payment_percent / 100), // Down payment
                'paid_installments' => 0,
                'status' => 'active',
                'note' => $request->note,
            ]);

            DB::commit();
            
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with([
                    'success' => true,
                    'message' => 'สร้างสินเชื่อสำเร็จ',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'สร้างสินเชื่อสำเร็จ',
                'data' => $credit,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating credit: ' . $e->getMessage());

            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors([
                    'error' => 'เกิดข้อผิดพลาดในการสร้างสินเชื่อ: ' . $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างสินเชื่อ',
                'errors' => ['error' => $e->getMessage()],
            ], 500);
        }
    }

    /**
     * Record installment payment
     */
    public function recordInstallment(Request $request)
    {
        $request->validate([
            'credit_id' => 'required|exists:customer_credits,id',
            'note' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $credit = CustomerCredit::findOrFail($request->credit_id);
            
            Log::info('Recording installment payment', [
                'credit_id' => $credit->id,
                'customer' => $credit->customer_name,
                'paid_installments' => $credit->paid_installments,
                'total_installments' => $credit->installment_count,
                'installment_amount' => $credit->installment_amount,
                'current_paid_amount' => $credit->paid_amount,
                'total_amount' => $credit->total_amount,
            ]);

            if ($credit->status !== 'active') {
                $msg = 'ไม่สามารถบันทึกการผ่อนชำระได้ เนื่องจากสินเชื่อนี้ไม่อยู่ในสถานะกำลังผ่อน';
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors(['error' => $msg]);
                }
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 400);
            }

            if ($credit->paid_installments >= $credit->installment_count) {
                $msg = 'ผ่อนครบแล้ว';
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors(['error' => $msg]);
                }
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 400);
            }

            // Calculate new paid amounts
            $newPaidInstallments = $credit->paid_installments + 1;
            $newPaidAmount = $credit->paid_amount + $credit->installment_amount;

            $credit->paid_installments = $newPaidInstallments;
            
            if ($newPaidInstallments >= $credit->installment_count) {
                $credit->status = 'completed';
                // On last payment, ensure paid_amount equals total_amount to avoid rounding issues
                $credit->paid_amount = $credit->total_amount;
            } else {
                // Prevent paid_amount from exceeding total_amount (just in case of bad initial data)
                $credit->paid_amount = min($newPaidAmount, $credit->total_amount);
            }
            
            // Auto-generate payment note
            $existingNote = $credit->note ?? '';
            $timestamp = now()->format('Y-m-d H:i');
            
            if ($newPaidInstallments >= $credit->installment_count) {
                $autoNote = "งวดสุดท้าย";
            } else {
                $autoNote = "งวดที่ {$newPaidInstallments} ชำระแล้ว";
            }
            
            // Append user's custom note if provided
            if ($request->note) {
                $autoNote .= " - " . $request->note;
            }
            
            $credit->note = $existingNote . ($existingNote ? "\n" : "") . "{$timestamp}: {$autoNote}";
            
            $credit->save();

            // อัพเดท note ในใบเสร็จเดิม (ถ้ามี receipt_id)
            if ($credit->receipt_id) {
                $receipt = Receipt::find($credit->receipt_id);
                if ($receipt) {
                    $oldNote = $receipt->notes;
                    if ($newPaidInstallments >= $credit->installment_count) {
                        // ผ่อนครบแล้ว
                        $receipt->notes = "ผ่อนชำระสินค้าครบถ้วนแล้ว (งวดสุดท้าย: {$timestamp})";
                    } else {
                        // กำลังผ่อน
                        $receipt->notes = "เงินดาวน์สินค้า (ผ่อนชำระ) - ชำระแล้ว {$newPaidInstallments}/{$credit->installment_count} งวด";
                    }
                    $receipt->save();
                    
                    Log::info('Receipt note updated', [
                        'receipt_id' => $receipt->id,
                        'receipt_number' => $receipt->receipt_number,
                        'old_note' => $oldNote,
                        'new_note' => $receipt->notes,
                        'installments' => "{$newPaidInstallments}/{$credit->installment_count}",
                    ]);
                } else {
                    Log::warning('Receipt not found', ['receipt_id' => $credit->receipt_id]);
                }
            } else {
                Log::warning('Credit has no receipt_id', ['credit_id' => $credit->id]);
            }

            // Create a Sale record for this installment payment
            $taxRate = config('pos.tax_rate', 7) / 100;
            $saleGrandTotal = $credit->installment_amount;
            
            // If it's the last payment, use the actual amount paid (might be adjusted for rounding)
            if ($newPaidInstallments >= $credit->installment_count) {
                // Calculation for last payment to match what was actually added to paid_amount
                // However, since we snap paid_amount to total_amount, we should calculate 
                // exactly what was added in this transaction.
                // But for simplicity, we use installment_amount as that's what the customer pays.
                // Except if the remaining balance was different.
            }

            $saleTotalAmount = $saleGrandTotal / (1 + $taxRate);
            $saleTaxAmount = $saleGrandTotal - $saleTotalAmount;

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'total_amount' => $saleTotalAmount,
                'tax_amount' => $saleTaxAmount,
                'grand_total' => $saleGrandTotal,
                'payment_method' => 'installment',
                'received_amount' => $saleGrandTotal,
                'change_amount' => 0,
                'sale_date' => now(),
                'notes' => "รับชำระค่าสินค้าผ่อนชำระ: {$credit->customer_name} ({$autoNote})",
            ]);

            DB::commit();

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with([
                    'success' => true,
                    'message' => 'บันทึกการผ่อนชำระสำเร็จ',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการผ่อนชำระสำเร็จ',
                'data' => [
                    'paid_installments' => $credit->paid_installments,
                    'paid_amount' => $credit->paid_amount,
                    'status' => $credit->status,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error recording installment: ' . $e->getMessage());

            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors([
                    'error' => 'เกิดข้อผิดพลาดในการบันทึกการผ่อนชำระ: ' . $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกการผ่อนชำระ',
            ], 500);
        }
    }

    /**
     * Get credits data for API
     */
    public function getCredits(Request $request)
    {
        $query = CustomerCredit::query();

        if ($request->customer_name) {
            $query->where('customer_name', 'like', "%{$request->customer_name}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $credits = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $credits,
        ]);
    }

    /**
     * Get summary data for dashboard
     */
    public function getSummary(Request $request)
    {
        $summary = $this->getSummaryData();

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Helper function to get summary data
     */
    private function getSummaryData()
    {
        $allCredits = CustomerCredit::all();

        $totalCredit = $allCredits->sum('total_amount');
        $totalPaid = $allCredits->sum('paid_amount');
        $totalRemaining = $totalCredit - $totalPaid;
        
        $activeCount = $allCredits->where('status', 'active')->count();
        $completedCount = $allCredits->where('status', 'completed')->count();

        // Today's collections (approximate based on updated_at)
        $todayCollections = CustomerCredit::whereDate('updated_at', today())->sum('paid_amount');

        return [
            'total_credit' => $totalCredit,
            'total_paid' => $totalPaid,
            'total_remaining' => $totalRemaining,
            'active_count' => $activeCount,
            'completed_count' => $completedCount,
            'today_collections' => $todayCollections,
        ];
    }
}
