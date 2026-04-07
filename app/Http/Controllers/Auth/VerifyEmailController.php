<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        // ดึง user จาก ID ในลิงค์ยืนยัน
        try {
            $user = User::findOrFail($request->route('id'));
        } catch (\Exception $e) {
            \Log::error('User not found', ['user_id' => $request->route('id')]);
            return redirect()->route('login')
                           ->with('error', 'ไม่พบผู้ใช้งาน');
        }
        
        // ตรวจสอบ hash
        $expectedHash = sha1($user->email);
        $receivedHash = $request->route('hash');
        
        \Log::info('Email Verification Attempt:', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'expected_hash' => $expectedHash,
            'received_hash' => $receivedHash,
            'hash_match' => $expectedHash === $receivedHash,
            'already_verified' => $user->hasVerifiedEmail(),
            'current_user' => auth()->id()
        ]);

        if ($expectedHash !== $receivedHash) {
            \Log::warning('Hash mismatch for user', ['user_id' => $user->id]);
            return redirect()->route('login')
                           ->with('error', 'ลิงค์ยืนยันไม่ถูกต้อง กรุณาขอลิงค์ใหม่');
        }

        if ($user->hasVerifiedEmail()) {
            \Log::info('User already verified', ['user_id' => $user->id]);
            return redirect()->route('login')
                           ->with('success', 'อีเมลยืนยันแล้ว คุณสามารถเข้าสู่ระบบได้');
        }

        // บันทึก email_verified_at
        $updated = $user->update(['email_verified_at' => now()]);
        
        \Log::info('Email Verified Successfully:', [
            'user_id' => $user->id,
            'updated' => $updated,
            'email_verified_at' => $user->email_verified_at
        ]);
        
        event(new Verified($user));

        return redirect()->route('login')
                       ->with('success', 'อีเมลยืนยันสำเร็จ กรุณาลงชินสธี แล้วลองอินมากก่อน');
    }
}
