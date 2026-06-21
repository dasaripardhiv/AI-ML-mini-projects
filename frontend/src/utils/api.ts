const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fifa_predictor_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const api = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }
    
    return response.json();
  },

  post: async <T>(url: string, body: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }
    
    return response.json();
  },

  put: async <T>(url: string, body: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }
    
    return response.json();
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }
    
    return response.json();
  },
};
