// services/ApiService.js
import { Platform } from "react-native";

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
        web: "https://103.38.50.149:5003/api",
        ios: "https://103.38.50.149:5003/api",
        android: "https://103.38.50.149:5003/api",
        default: "https://103.38.50.149:5003/api",
      });
  }

  async apiCall(endpoint, method = "GET", data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (data !== null && data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const resp = await fetch(url, config);
    const text = await resp.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { raw: text };
    }
    if (!resp.ok) {
      const message = result?.message || `HTTP error ${resp.status}`;
      throw new Error(message);
    }
    return result;
  }

  // Health/Stats
  healthCheck() {
    return this.apiCall("/health");
  }
  getStats() {
    return this.apiCall("/stats");
  }

  // Parameters (Parameter_Master)
  getParameters() {
    return this.apiCall("/parameters");
  }
  getParameterById(id) {
    return this.apiCall(`/parameters/${id}`);
  }
  createParameter(parameter) {
    return this.apiCall("/parameters", "POST", parameter);
  }
  updateParameter(id, parameter) {
    return this.apiCall(`/parameters/${id}`, "PUT", parameter);
  }
  deleteParameter(id) {
    return this.apiCall(`/parameters/${id}`, "DELETE");
  }

  // Parameter Logs
  getRecentLogs(top = 50) {
    return this.apiCall(`/parameter-log?top=${encodeURIComponent(top)}`);
  }
  createLogsBulk(items) {
    return this.apiCall("/parameter-log/bulk", "POST", { items });
  }
  createLog(item) {
    return this.apiCall("/parameter-log", "POST", item);
  }
  deleteAllLogs() {
    return this.apiCall("/parameter-log", "DELETE");
  }

  // Configuration (Line & Shift data)
  getConfigurations() {
    return this.apiCall("/configurations");
  }

  // UPDATED: Single POST queryLogs for filtered logs (date/shift/line body)
  // Matches backend /api/queryLogs POST; for EnterDetailsScreen
  async queryLogs(filters) {
    const { date, shift, line, top = 1000 } = filters || {};

    if (!date || !shift || !line) {
      throw new Error("Missing required filters: date, shift, line");
    }

    try {
      // Use apiCall with POST and body (fixes apiClient issue)
      const response = await this.apiCall("/queryLogs", "POST", {
        date, // YYYY-MM-DD (or YYYY-MM-DDTHH:mm; backend extracts date)
        shift,
        line,
        top,
      });

      const { success, data, count, message } = response;

      if (!success) {
        throw new Error(message || "Query failed");
      }

      // Ensure data is array (handle empty response)
      const dataArray = Array.isArray(data) ? data : [];
      console.log(
        `QueryLogs success: Retrieved ${dataArray.length} logs for ${date}, ${shift}, ${line}`
      );
      return {
        success: true,
        data: dataArray,
        count: dataArray.length,
        message,
      };
    } catch (error) {
      console.error("queryLogs error:", error.message);
      // Re-throw for frontend catch/alert
      throw error;
    }
  }

  // Optional: Keep GET version if used elsewhere (e.g., downloads)
  // queryLogsGet(params = {}) { ... } – rename if needed
  queryLogsGet(params = {}) {
    const searchParams = new URLSearchParams();

    // Add all non-empty parameters
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        searchParams.append(key, params[key]);
      }
    });

    return this.apiCall(`/parameter-log/query?${searchParams.toString()}`);
  }
}

export default new ApiService();
