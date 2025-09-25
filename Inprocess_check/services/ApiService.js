// services/ApiService.js
import { Platform } from 'react-native';

const ENV_BASE =
    process.env.EXPO_PUBLIC_API_BASE ||
    process.env.REACT_APP_API_BASE ||
    process.env.API_BASE ||
    null;

class ApiService {
    constructor() {
        this.baseURL =
            ENV_BASE ||
            Platform.select({
                web: 'https://103.38.50.149:5003/api',
                ios: 'https://103.38.50.149:5003/api',
                android: 'https://103.38.50.149:5003/api',
                default: 'https://103.38.50.149:5003/api',
            });
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data !== null && data !== undefined) {
            config.body = JSON.stringify(data);
        }

        const resp = await fetch(url, config);
        const text = await resp.text();
        let result = {};
        try { result = text ? JSON.parse(text) : {}; } catch { result = { raw: text }; }
        if (!resp.ok) {
            const message = result?.message || `HTTP error ${resp.status}`;
            throw new Error(message);
        }
        return result;
    }

    // In ApiService.js (add this method)
    async getLogs(params = {}) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) searchParams.append(key, params[key]);
        });
        return this.apiCall(`/parameter-log?${searchParams.toString()}`);
    }


    // Health/Stats
    healthCheck() { return this.apiCall('/health'); }
    getStats() { return this.apiCall('/stats'); }

    // Parameters (Parameter_Master)
    getParameters() { return this.apiCall('/parameters'); }
    getParameterById(id) { return this.apiCall(`/parameters/${id}`); }
    createParameter(parameter) { return this.apiCall('/parameters', 'POST', parameter); }
    updateParameter(id, parameter) { return this.apiCall(`/parameters/${id}`, 'PUT', parameter); }
    deleteParameter(id) { return this.apiCall(`/parameters/${id}`, 'DELETE'); }

    // Parameter Logs
    getRecentLogs(top = 50) {
        return this.apiCall(`/parameter-log?top=${encodeURIComponent(top)}`);
    }
    createLogsBulk(items) {
        return this.apiCall('/parameter-log/bulk', 'POST', { items });
    }
    createLog(item) {
        return this.apiCall('/parameter-log', 'POST', item);
    }
    deleteAllLogs() {
        return this.apiCall('/parameter-log', 'DELETE');
    }

    // Configuration (Line & Shift data)
    getConfigurations() {
        return this.apiCall('/configurations');
    }

    // NEW: Query logs with filters (for downloads)
    queryLogs(params = {}) {
        const searchParams = new URLSearchParams();

        // Add all non-empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                searchParams.append(key, params[key]);
            }
        });

        return this.apiCall(`/parameter-log/query?${searchParams.toString()}`);
    }
}

export default new ApiService();
