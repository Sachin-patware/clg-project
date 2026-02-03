import API_BASE_URL from '@/config';

/**
 * Enhanced fetch wrapper that always includes credentials and handles base URL.
 * Mandatory for cross-domain authentication between Vercel and Render.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    // Ensure endpoint starts with a slash
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Merge headers
    const headers = {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // CRITICAL: This ensures cookies are sent across domains
    });

    return response;
}
