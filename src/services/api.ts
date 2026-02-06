const API_URL = import.meta.env.VITE_API_URL;

const trustedOrigins = (import.meta.env.VITE_TRUSTED_ORIGINS || "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);
const isTrustedOrigin = trustedOrigins.includes(window.location.origin);

interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  access_token: string;
  refresh_token: string;
}

interface ValidateResponse {
  valid: boolean;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

type LogoutCallback = () => void;

class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private onLogoutCallback: LogoutCallback | null = null;

  constructor() {
    try {
      const storedToken = localStorage.getItem("token");
      const storedRefresh = localStorage.getItem("refreshToken");
      this.token = storedToken ?? null;
      this.refreshToken = storedRefresh ?? null;
    } catch {
      this.token = null;
      this.refreshToken = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }

  getToken() {
    return this.token;
  }

  canRequest() {
    return !!this.token || isTrustedOrigin;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  onLogout(callback: LogoutCallback) {
    this.onLogoutCallback = callback;
  }

  private processQueue(error: Error | null, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    console.log("Requesting:", endpoint);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Erro na requisição" }));
        console.error("Request failed:", endpoint, error);

        if (response.status === 401) {
          // Without token or refresh token, don't attempt refresh loop
          if (!this.token || !this.refreshToken) {
            throw new Error(error.message || "Unauthorized");
          }

          if (this.isRefreshing) {
            console.log("Refresh in progress, queuing request:", endpoint);
            return new Promise<string>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                console.log("Retrying request with new token:", endpoint);
                (headers as Record<string, string>)["Authorization"] =
                  "Bearer " + token;
                return this.request<T>(endpoint, { ...options, headers });
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          console.log("Token expired, starting refresh...");
          this.isRefreshing = true;

          return new Promise<T>((resolve, reject) => {
            this.refresh()
              .then((refreshResponse) => {
                console.log("Token refreshed successfully.");
                this.setToken(refreshResponse.access_token);
                this.setRefreshToken(refreshResponse.refresh_token);
                (headers as Record<string, string>)["Authorization"] =
                  "Bearer " + refreshResponse.access_token;
                this.processQueue(null, refreshResponse.access_token);
                console.log("Retrying original request:", endpoint);
                resolve(this.request<T>(endpoint, { ...options, headers }));
              })
              .catch((err) => {
                console.error("Refresh failed:", err);
                this.processQueue(
                  err instanceof Error ? err : new Error(String(err)),
                  null,
                );
                this.logout();
                reject(err);
              })
              .finally(() => {
                this.isRefreshing = false;
              });
          });
        }

        throw new Error(error.message || "Erro na requisição");
      }

      return response.json();
    } catch (error: any) {
      console.error("Request failed with error:", error);
      throw new Error(error.message || "Erro na requisição");
    }
  }

  async silentRefresh(): Promise<LoginResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await this.refresh();
      this.setToken(response.access_token);
      this.setRefreshToken(response.refresh_token);
      return response;
    } catch (error) {
      // Don't logout here - let the request mechanism handle token refresh
      // This allows existing valid tokens to be used
      console.error("Silent refresh failed:", error);
      return null;
    }
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    this.setRefreshToken(response.refresh_token);
    return response;
  }

  async refresh(): Promise<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token não fornecido");
    }

    // This request should not use the request method to avoid loops
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh token inválido");
    }

    return response.json();
  }

  async validate(): Promise<ValidateResponse> {
    return this.request("/auth/validate");
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch((error) => {
        console.error("Logout error:", error);
      });
    }
    this.setToken(null);
    this.setRefreshToken(null);
    localStorage.removeItem("user");

    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  // Categories
  async getCategories(): Promise<{ id: number; name: string }[]> {
    return this.request("/categories");
  }

  // Stock (Products)
  async getStock(
    page?: number,
    limit?: number,
    category?: string,
    search?: string,
  ) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    const query = params.toString();
    return this.request(`/stock${query ? `?${query}` : ""}`);
  }

  async getStockStats(): Promise<{
    totalProducts: number;
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
  }> {
    return this.request("/stock/stats");
  }

  async exportStock(category?: string, search?: string): Promise<void> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    const query = params.toString();

    const response = await fetch(
      `${API_URL}/stock/export${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar estoque");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estoque_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async createStock(product: any) {
    return this.request("/stock", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateStock(id: number, product: any) {
    return this.request(`/stock/${id}`, {
      method: "PATCH",
      body: JSON.stringify(product),
    });
  }

  async deleteStock(id: number): Promise<void> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/stock/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro ao excluir" }));
      throw new Error(error.message || "Erro ao excluir");
    }
  }

  // Movements
  async getMovements(
    page?: number,
    limit?: number,
    type?: string,
    productName?: string,
  ) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (type) params.append("type", type);
    if (productName) params.append("productName", productName);
    const query = params.toString();
    return this.request(`/stock_control${query ? `?${query}` : ""}`);
  }

  async exportMovements(type?: string, productName?: string): Promise<void> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (productName) params.append("productName", productName);
    const query = params.toString();

    const response = await fetch(
      `${API_URL}/stock_control/export${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar movimentações");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimentacoes_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async createMovement(movement: any) {
    return this.request("/stock_control", {
      method: "POST",
      body: JSON.stringify(movement),
    });
  }

  // Sales
  async getSales(
    page?: number,
    limit?: number,
    paymentMethod?: string,
    installmentType?: string,
    customer?: string,
    productName?: string,
  ) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (installmentType) params.append("installmentType", installmentType);
    if (customer) params.append("customer", customer);
    if (productName) params.append("productName", productName);
    const query = params.toString();
    return this.request(`/sales${query ? `?${query}` : ""}`);
  }

  async exportSales(
    paymentMethod?: string,
    installmentType?: string,
    customer?: string,
    productName?: string,
  ): Promise<void> {
    const params = new URLSearchParams();
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (installmentType) params.append("installmentType", installmentType);
    if (customer) params.append("customer", customer);
    if (productName) params.append("productName", productName);
    const query = params.toString();

    const response = await fetch(
      `${API_URL}/sales/export${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar vendas");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendas_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async createSale(sale: any) {
    return this.request("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    });
  }

  // Quotes
  async getQuotes(
    page?: number,
    limit?: number,
    customer?: string,
    productName?: string,
    paymentMethod?: string,
    validityStatus?: string,
  ) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (customer) params.append("customer", customer);
    if (productName) params.append("productName", productName);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (validityStatus) params.append("validityStatus", validityStatus);
    const query = params.toString();
    return this.request(`/quotes${query ? `?${query}` : ""}`);
  }

  async exportQuotes(
    customer?: string,
    productName?: string,
    paymentMethod?: string,
    validityStatus?: string,
  ): Promise<void> {
    const params = new URLSearchParams();
    if (customer) params.append("customer", customer);
    if (productName) params.append("productName", productName);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (validityStatus) params.append("validityStatus", validityStatus);
    const query = params.toString();

    const response = await fetch(
      `${API_URL}/quotes/export${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar orçamentos");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orcamentos_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async createQuote(quote: any) {
    return this.request("/quotes", {
      method: "POST",
      body: JSON.stringify(quote),
    });
  }
}

export const api = new ApiService();
