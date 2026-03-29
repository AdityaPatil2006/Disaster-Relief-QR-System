// Reusable API calls

// Determine base URL dynamically or specify fallback
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
    ? 'http://localhost:5000/api' 
    : '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const token = getToken();
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    
    // Merge headers safely
    const headers = { ...defaultOptions.headers, ...(options.headers || {}) };
    const mergedOptions = { ...defaultOptions, ...options, headers };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    const data = await response.json().catch(() => ({}));
    
    if (response.status === 401 || response.status === 403) {
      // Token invalid or expired or unauthorized role
      if (window.location.pathname.indexOf('login.html') === -1) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = 'login.html';
      }
      if (!response.ok) throw new Error(data.error || 'Unauthorized Access');
    }

    if (!response.ok) {
        throw new Error(data.error || 'API Request Failed');
    }
    return { success: true, data };
  } catch (error) {
    console.error('API call error:', error);
    return { success: false, error: error.message };
  }
}

const api = {
    auth: {
        login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) })
    },
    beneficiary: {
        register: (data) => fetchAPI('/beneficiary/register', { method: 'POST', body: JSON.stringify(data) }),
        list: (query = '') => fetchAPI(`/beneficiary/list${query}`),
        get: (qrId) => fetchAPI(`/beneficiary/${qrId}`),
        update: (qrId, data) => fetchAPI(`/beneficiary/${qrId}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (qrId) => fetchAPI(`/beneficiary/${qrId}`, { method: 'DELETE' }),
        stats: () => fetchAPI('/beneficiary/stats/dashboard'),
        timeline: (qrId) => fetchAPI(`/beneficiary/${qrId}/timeline`)
    },
    aid: {
        distribute: (data) => fetchAPI('/aid/distribute', { method: 'POST', body: JSON.stringify(data) }),
        stats: () => fetchAPI('/aid/stats')
    },
    audit: {
        analytics: () => fetchAPI('/audit/analytics'),
        exportCSVBlob: async () => {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/audit/export/csv`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) throw new Error('Export Failed');
            return response.blob();
        }
    }
};
