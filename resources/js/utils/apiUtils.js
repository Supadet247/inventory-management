/**
 * Utility functions for handling API calls with CSRF token management
 */

/**
 * Get the current CSRF token from meta tag or window
 */
export const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content || window.Laravel?.csrfToken || '';
};

/**
 * Refresh CSRF token and update the meta tag
 */
export const refreshCsrfToken = async () => {
    try {
        const response = await fetch(route('get-csrf-token'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.csrf_token) {
            // Update meta tag
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', data.csrf_token);
            }
            
            // Update global variable if available
            if (window.Laravel) {
                window.Laravel.csrfToken = data.csrf_token;
            }
            
            return data.csrf_token;
        } else {
            throw new Error('Invalid CSRF token response');
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
        // If CSRF refresh fails, likely session expired
        window.location.href = route('login');
        throw error;
    }
};

/**
 * Enhanced fetch function with automatic CSRF token handling
 */
export const apiRequest = async (url, options = {}) => {
    const maxRetries = 1;
    let attempt = 0;

    const makeRequest = async () => {
        const csrfToken = getCsrfToken();
        
        const defaultHeaders = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const requestOptions = {
            credentials: 'same-origin',
            ...options,
            headers: defaultHeaders
        };

        try {
            const response = await fetch(url, requestOptions);
            
            // Check if the error is CSRF token mismatch
            if (response.status === 419 || response.statusText === 'Page Expired') {
                throw new Error('CSRF_TOKEN_MISMATCH');
            }
            
            return response;
        } catch (error) {
            if (error.message === 'CSRF_TOKEN_MISMATCH' && attempt < maxRetries) {
                attempt++;
                console.log(`CSRF token mismatch detected, attempting refresh (attempt ${attempt}/${maxRetries})`);
                
                // Refresh CSRF token and retry
                await refreshCsrfToken();
                return makeRequest();
            }
            
            throw error;
        }
    };

    return makeRequest();
};

/**
 * Shorthand for GET requests
 */
export const apiGet = (url, options = {}) => {
    return apiRequest(url, { method: 'GET', ...options });
};

/**
 * Shorthand for POST requests
 */
export const apiPost = (url, data = {}, options = {}) => {
    return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    });
};

/**
 * Shorthand for PATCH requests
 */
export const apiPatch = (url, data = {}, options = {}) => {
    return apiRequest(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options
    });
};

/**
 * Shorthand for DELETE requests
 */
export const apiDelete = (url, options = {}) => {
    return apiRequest(url, { method: 'DELETE', ...options });
};

/**
 * Check if user is authenticated and session is valid
 */
export const checkAuthStatus = async () => {
    try {
        const response = await apiGet(route('dashboard'));
        return response.ok;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
};

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error, customMessage = null) => {
    console.error('API Error:', error);
    
    if (error.message === 'CSRF_TOKEN_MISMATCH') {
        return 'เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่';
    }
    
    if (error.message.includes('Failed to fetch')) {
        return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    
    return customMessage || 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';
};