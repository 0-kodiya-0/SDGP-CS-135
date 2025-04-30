const API_CONFIG = {
    baseURL:  import.meta.env.REACT_APP_API_BASE_URL|| 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
} as const;

export default API_CONFIG