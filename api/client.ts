// API Client for SGI ERP Backend
// Handles authentication, requests, and real-time sync

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiError {
    error: string;
    message: string;
}

class ApiClient {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage
        this.token = localStorage.getItem('sgi_token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('sgi_token', token);
        } else {
            localStorage.removeItem('sgi_token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = 'Ocorreu um erro na comunicação com o servidor.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Fallback if response is not JSON
                    if (response.status === 401) errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
                    if (response.status === 403) errorMessage = 'Não tem permissão para realizar esta ação.';
                    if (response.status === 404) errorMessage = 'O recurso solicitado não foi encontrado.';
                }
                throw new Error(errorMessage);
            }

            // Successfully received response
            // Handle 204 No Content
            if (response.status === 204) {
                return {} as T;
            }

            return response.json();
        } catch (error: any) {
            // Rethrow fetch errors or our custom errors
            if (error.message === 'Failed to fetch') {
                throw new Error('Não foi possível ligar ao servidor. Verifique a sua ligação.');
            }
            throw error;
        }
    }

    // Auth endpoints
    async login(email: string, password: string) {
        const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async register(name: string, email: string, password: string, role?: string) {
        const data = await this.request<{ token: string; user: any }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
        this.setToken(data.token);
        return data;
    }

    async me() {
        return this.request<{ user: any }>('/api/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // Generic CRUD helpers
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint);
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async patch<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Agenda-specific API (priority sync)
    agenda = {
        list: (params?: { startDate?: string; endDate?: string; tipo?: string }) => {
            const query = new URLSearchParams(params as any).toString();
            return this.get<any[]>(`/api/agenda${query ? `?${query}` : ''}`);
        },
        get: (id: string) => this.get<any>(`/api/agenda/${id}`),
        create: (data: any) => this.post<any>('/api/agenda', data),
        update: (id: string, data: any) => this.put<any>(`/api/agenda/${id}`, data),
        delete: (id: string) => this.delete<any>(`/api/agenda/${id}`),
        confirm: (id: string) => this.post<any>(`/api/agenda/${id}/confirm`, {}),
        syncChanges: (since: string) =>
            this.get<{ events: any[]; syncTimestamp: string }>(
                `/api/agenda/sync/changes?since=${encodeURIComponent(since)}`
            ),
    };

    // Proposals
    proposals = {
        list: () => this.get<any[]>('/api/proposals'),
        get: (id: string) => this.get<any>(`/api/proposals/${id}`),
        create: (data: any) => this.post<any>('/api/proposals', data),
        update: (id: string, data: any) => this.put<any>(`/api/proposals/${id}`, data),
        adjudicate: (id: string, data: any) =>
            this.post<any>(`/api/proposals/${id}/adjudicate`, data),
        delete: (id: string) => this.delete<any>(`/api/proposals/${id}`),
    };

    // Projects
    projects = {
        list: () => this.get<any[]>('/api/projects'),
        get: (id: string) => this.get<any>(`/api/projects/${id}`),
        create: (data: any) => this.post<any>('/api/projects', data),
        update: (id: string, data: any) => this.put<any>(`/api/projects/${id}`, data),
        updateProgress: (id: string, progress: number) =>
            this.patch<any>(`/api/projects/${id}/progress`, { percentualProgresso: progress }),
        delete: (id: string) => this.delete<any>(`/api/projects/${id}`),
    };

    // Work Orders
    workOrders = {
        list: (params?: { projectId?: string; status?: string }) => {
            const query = new URLSearchParams(params as any).toString();
            return this.get<any[]>(`/api/work-orders${query ? `?${query}` : ''}`);
        },
        get: (id: string) => this.get<any>(`/api/work-orders/${id}`),
        create: (data: any) => this.post<any>('/api/work-orders', data),
        update: (id: string, data: any) => this.put<any>(`/api/work-orders/${id}`, data),
        updateStatus: (id: string, status: string) =>
            this.patch<any>(`/api/work-orders/${id}/status`, { status }),
        validateSST: (id: string) =>
            this.patch<any>(`/api/work-orders/${id}/sst-validate`, {}),
        delete: (id: string) => this.delete<any>(`/api/work-orders/${id}`),
    };

    // Teams
    teams = {
        list: () => this.get<any[]>('/api/teams'),
        get: (id: string) => this.get<any>(`/api/teams/${id}`),
        create: (data: any) => this.post<any>('/api/teams', data),
        update: (id: string, data: any) => this.put<any>(`/api/teams/${id}`, data),
        addMember: (id: string, userId: string) =>
            this.post<any>(`/api/teams/${id}/members`, { userId }),
        removeMember: (id: string, userId: string) =>
            this.delete<any>(`/api/teams/${id}/members/${userId}`),
        delete: (id: string) => this.delete<any>(`/api/teams/${id}`),
    };

    // Materials
    materials = {
        list: () => this.get<any[]>('/api/materials'),
        critical: () => this.get<any[]>('/api/materials/critical'),
        get: (id: string) => this.get<any>(`/api/materials/${id}`),
        create: (data: any) => this.post<any>('/api/materials', data),
        update: (id: string, data: any) => this.put<any>(`/api/materials/${id}`, data),
        movement: (id: string, data: {
            tipo: 'ENTRADA' | 'SAIDA';
            quantidade: number;
            documentoRef?: string;
            localizacao?: string;
            responsavelId?: string;
            dataReferencia?: string;
            documentacaoAdicional?: string;
        }) => this.post<any>(`/api/materials/${id}/movement`, data),
        batchMovement: (data: {
            tipo: 'ENTRADA' | 'SAIDA';
            items: { materialId: string; quantidade: number }[];
            documentoRef?: string;
            localizacao?: string;
            responsavelId?: string;
            dataReferencia?: string;
            documentacaoAdicional?: string;
        }) => this.post<any>('/api/materials/batch-movement', data),
        delete: (id: string) => this.delete<any>(`/api/materials/${id}`),
    };

    // Assets
    assets = {
        list: () => this.get<any[]>('/api/assets'),
        maintenanceDue: () => this.get<any[]>('/api/assets/maintenance-due'),
        get: (id: string) => this.get<any>(`/api/assets/${id}`),
        create: (data: any) => this.post<any>('/api/assets', data),
        update: (id: string, data: any) => this.put<any>(`/api/assets/${id}`, data),
        updateStatus: (id: string, status: string) =>
            this.patch<any>(`/api/assets/${id}/status`, { statusOperacional: status }),
        assign: (id: string, userId: string, localizacao?: string) =>
            this.patch<any>(`/api/assets/${id}/assign`, { responsavelAtualId: userId, localizacao }),
        delete: (id: string) => this.delete<any>(`/api/assets/${id}`),
    };

    // Notifications
    notifications = {
        list: (unreadOnly?: boolean) =>
            this.get<any[]>(`/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
        count: () => this.get<{ unreadCount: number }>('/api/notifications/count'),
        markRead: (id: string) => this.patch<any>(`/api/notifications/${id}/read`, {}),
        markAllRead: () => this.post<any>('/api/notifications/read-all', {}),
    };

    // Clients
    clients = {
        list: () => this.get<any[]>('/api/clients'),
        get: (id: string) => this.get<any>(`/api/clients/${id}`),
        create: (data: any) => this.post<any>('/api/clients', data),
        update: (id: string, data: any) => this.put<any>(`/api/clients/${id}`, data),
        delete: (id: string) => this.delete<any>(`/api/clients/${id}`),
    };

    // Users
    users = {
        list: () => this.get<any[]>('/api/users'),
        get: (id: string) => this.get<any>(`/api/users/${id}`),
        update: (id: string, data: any) => this.patch<any>(`/api/users/${id}`, data),
    };

    // Timesheets
    timesheets = {
        list: (params?: { userId?: string; workOrderId?: string }) => {
            const query = new URLSearchParams(params as any).toString();
            return this.get<any[]>(`/api/timesheets${query ? `?${query}` : ''}`);
        },
        my: (month?: number, year?: number) => {
            const query = month && year ? `?month=${month}&year=${year}` : '';
            return this.get<{ timesheets: any[]; totalHours: number }>(`/api/timesheets/my${query}`);
        },
        create: (data: any) => this.post<any>('/api/timesheets', data),
        update: (id: string, data: any) => this.put<any>(`/api/timesheets/${id}`, data),
        delete: (id: string) => this.delete<any>(`/api/timesheets/${id}`),
    };

    // SST (Safety)
    sst = {
        incidents: {
            list: () => this.get<any[]>('/api/sst/incidents'),
            create: (data: any) => this.post<any>('/api/sst/incidents', data),
            updateStatus: (id: string, status: string, planoAcaoCorretiva?: string) =>
                this.patch<any>(`/api/sst/incidents/${id}/status`, { status, planoAcaoCorretiva }),
        },
        aprs: {
            list: () => this.get<any[]>('/api/sst/aprs'),
            create: (data: any) => this.post<any>('/api/sst/aprs', data),
            approve: (id: string) => this.patch<any>(`/api/sst/aprs/${id}/approve`, {}),
        },
        workPermits: {
            list: () => this.get<any[]>('/api/sst/work-permits'),
            create: (data: any) => this.post<any>('/api/sst/work-permits', data),
        }
    };

    contractors = {
        list: () => this.get<any[]>('/api/contractors'),
        create: (data: any) => this.post<any>('/api/contractors', data),
        updateInduction: (id: string, data: any) => this.patch<any>(`/api/contractors/${id}/induction`, data),
        updateEPI: (id: string, data: any) => this.patch<any>(`/api/contractors/${id}/epi`, data),
        delete: (id: string) => this.delete<any>(`/api/contractors/${id}`),
    };
}

// Singleton instance
export const api = new ApiClient();
export default api;
