<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;

class ValidateCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Add any routes that should bypass CSRF verification
        // Note: Be very careful with this - only exclude routes that have other protection
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, \Closure $next)
    {
        if ($request->ajax() || $request->wantsJson()) {
            // Log CSRF token issues for debugging
            $token = $request->header('X-CSRF-TOKEN') ?: $request->input('_token');
            $sessionToken = $request->session()->token();
            
            if (!$token || !hash_equals($sessionToken, $token)) {
                \Log::warning('CSRF Token Mismatch', [
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'provided_token' => $token ? substr($token, 0, 10) . '...' : 'none',
                    'session_token' => $sessionToken ? substr($sessionToken, 0, 10) . '...' : 'none',
                    'user_id' => auth()->id(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        }

        return parent::handle($request, $next);
    }

    /**
     * Determine if the session and input CSRF tokens match.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        $token = $this->getTokenFromRequest($request);

        return is_string($request->session()->token()) &&
               is_string($token) &&
               hash_equals($request->session()->token(), $token);
    }
}