<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        <!-- CSRF Token -->
        <meta name="csrf-token" content="{{ csrf_token() }}">
        
        <!-- App Name -->
        <title inertia>{{ config('app.name', 'สมบัติเกษตรยนต์') }}</title>
        
        <!-- Favicon -->
        <link rel="icon" type="image/png" href="{{ asset('images/logo.png') }}">
        <link rel="shortcut icon" type="image/png" href="{{ asset('images/logo.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('images/logo.png') }}">
        
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=prompt:300,400,500,600,700&display=swap" rel="stylesheet" />
        
        <!-- Additional Meta Tags -->
        <meta name="description" content="ระบบจัดการคลังสินค้าและ POS สำหรับธุรกิจ สมบัติเกษตรยนต์">
        <meta name="keywords" content="คลังสินค้า, POS, ระบบขาย, เกษตรยนต์, อะไหล่">
        <meta name="author" content="สมบัติเกษตรยนต์">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:title" content="{{ config('app.name', 'สมบัติเกษตรยนต์') }}">
        <meta property="og:description" content="ระบบจัดการคลังสินค้าและ POS ที่ครบวงจร">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url('/') }}">
        <meta property="og:image" content="{{ asset('images/logo.png') }}">
        
        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        
        <!-- Additional Head Content -->
        @stack('head')
    </head>
    <body class="font-sans antialiased bg-gray-50">
        @inertia
        
        <!-- Additional Body Content -->
        @stack('body')
        
        <!-- Global JavaScript Variables -->
        <script>
            window.Laravel = {
                csrfToken: '{{ csrf_token() }}',
                user: @json(auth()->user()),
                appName: '{{ config('app.name', 'สมบัติเกษตรยนต์') }}',
                appUrl: '{{ url('/') }}'
            };
            
            // CSRF Token Refresh Function
            window.refreshCsrfToken = function() {
                return fetch('{{ route('get-csrf-token') }}', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.csrf_token) {
                        // Update meta tag
                        document.querySelector('meta[name="csrf-token"]').setAttribute('content', data.csrf_token);
                        // Update global variable
                        window.Laravel.csrfToken = data.csrf_token;
                        return data.csrf_token;
                    }
                    throw new Error('Invalid CSRF token response');
                })
                .catch(error => {
                    console.error('Failed to refresh CSRF token:', error);
                    // Redirect to login if CSRF refresh fails (likely session expired)
                    window.location.href = '{{ route('login') }}';
                });
            };
        </script>
    </body>
</html>