// API Client - Cliente centralizado para comunicación con API Gateway
// Toda comunicación HTTP del frontend pasa por aquí

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL del API Gateway (desde Load Balancer o directo)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si el token expiró (401), redirigir al login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Log de errores en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH SERVICE - Autenticación y usuarios
// ============================================

export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // Register
  register: async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    direccion?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await apiClient.post('/auth/verify');
    return response.data;
  },

  // Reset password request
  resetPasswordRequest: async (email: string) => {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  },

  // Reset password confirm
  resetPasswordConfirm: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password/confirm', {
      token,
      newPassword,
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// ============================================
// USERS SERVICE - Gestión de usuarios
// ============================================

export const usersApi = {
  // Listar usuarios
  list: async (params?: {
    rol?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/auth/users', { params });
    return response.data;
  },

  // Obtener usuario por ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/auth/users/${id}`);
    return response.data;
  },

  // Crear usuario (admin)
  create: async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
    telefono?: string;
    direccion?: string;
  }) => {
    const response = await apiClient.post('/auth/users', data);
    return response.data;
  },

  // Actualizar usuario
  update: async (id: string, data: Partial<{
    nombre: string;
    apellido: string;
    telefono: string;
    direccion: string;
    activo: boolean;
  }>) => {
    const response = await apiClient.put(`/auth/users/${id}`, data);
    return response.data;
  },

  // Cambiar rol (admin)
  changeRole: async (id: string, rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO') => {
    const response = await apiClient.patch(`/auth/users/${id}/role`, { rol });
    return response.data;
  },

  // Desactivar usuario (admin)
  deactivate: async (id: string) => {
    const response = await apiClient.patch(`/auth/users/${id}/deactivate`);
    return response.data;
  },

  // Eliminar usuario (admin)
  delete: async (id: string) => {
    const response = await apiClient.delete(`/auth/users/${id}`);
    return response.data;
  },
};

// ============================================
// DENUNCIAS SERVICE - Gestión de denuncias
// ============================================

export const denunciasApi = {
  // Listar denuncias
  list: async (params?: {
    prioridad?: string;
    categoria?: string;
    supervisorId?: string;
    ubicacion?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/denuncias', { params });
    return response.data;
  },

  // Obtener denuncia por ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/denuncias/${id}`);
    return response.data;
  },

  // Crear denuncia
  create: async (data: {
    titulo: string;
    descripcion: string;
    categoria: string;
    ubicacion?: string;
    prioridad?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  }) => {
    const response = await apiClient.post('/denuncias', data);
    return response.data;
  },

  // Actualizar denuncia
  update: async (id: string, data: Partial<{
    titulo: string;
    descripcion: string;
    categoria: string;
    ubicacion: string;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  }>) => {
    const response = await apiClient.put(`/denuncias/${id}`, data);
    return response.data;
  },

  // Asignar supervisor
  assignSupervisor: async (id: string, supervisorId: string) => {
    const response = await apiClient.patch(`/denuncias/${id}/supervisor`, {
      supervisorId,
    });
    return response.data;
  },

  // Cambiar estado
  changeStatus: async (id: string, prioridad: string, comentario?: string) => {
    const response = await apiClient.patch(`/denuncias/${id}/estado`, {
      prioridad,
      comentario,
    });
    return response.data;
  },

  // Agregar comentario
  addComment: async (id: string, comentario: string) => {
    const response = await apiClient.post(`/denuncias/${id}/comentario`, {
      comentario,
    });
    return response.data;
  },

  // Eliminar denuncia
  delete: async (id: string) => {
    const response = await apiClient.delete(`/denuncias/${id}`);
    return response.data;
  },

  // Obtener historial
  getHistory: async (id: string) => {
    const response = await apiClient.get(`/denuncias/${id}/historial`);
    return response.data;
  },

  // Obtener estadísticas (admin/supervisor)
  getStats: async () => {
    const response = await apiClient.get('/denuncias/stats');
    return response.data;
  },
};

// ============================================
// EVIDENCIAS SERVICE - Gestión de archivos
// ============================================

export const evidenciasApi = {
  // Subir evidencia
  upload: async (denunciaId: string, file: File, descripcion?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('denunciaId', denunciaId);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await apiClient.post('/denuncias/evidencias', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Listar evidencias de una denuncia
  list: async (denunciaId: string) => {
    const response = await apiClient.get('/denuncias/evidencias', {
      params: { denunciaId },
    });
    return response.data;
  },

  // Descargar evidencia
  download: async (id: string) => {
    const response = await apiClient.get(`/denuncias/evidencias/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Eliminar evidencia
  delete: async (id: string) => {
    const response = await apiClient.delete(`/denuncias/evidencias/${id}`);
    return response.data;
  },
};

// ============================================
// REGLAS SERVICE - Reglas de asignación
// ============================================

export const reglasApi = {
  // Listar reglas
  list: async (params?: { activa?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get('/denuncias/reglas', { params });
    return response.data;
  },

  // Obtener regla por ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/denuncias/reglas/${id}`);
    return response.data;
  },

  // Crear regla
  create: async (data: {
    categoria: string;
    supervisorId: string;
    prioridad: number;
    condiciones?: any;
  }) => {
    const response = await apiClient.post('/denuncias/reglas', data);
    return response.data;
  },

  // Actualizar regla
  update: async (id: string, data: Partial<{
    categoria: string;
    supervisorId: string;
    prioridad: number;
    condiciones: any;
    activa: boolean;
  }>) => {
    const response = await apiClient.put(`/denuncias/reglas/${id}`, data);
    return response.data;
  },

  // Activar/desactivar regla
  toggleActive: async (id: string, activa: boolean) => {
    const response = await apiClient.patch(`/denuncias/reglas/${id}/toggle`, {
      activa,
    });
    return response.data;
  },

  // Eliminar regla
  delete: async (id: string) => {
    const response = await apiClient.delete(`/denuncias/reglas/${id}`);
    return response.data;
  },
};

// ============================================
// LOGS SERVICE - Auditoría y logs
// ============================================

export const logsApi = {
  // Buscar logs de auditoría (admin)
  search: async (params?: {
    usuarioId?: string;
    accion?: string;
    servicio?: string;
    tabla?: string;
    exitoso?: boolean;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/logs/audit', { params });
    return response.data;
  },

  // Obtener estadísticas de logs (admin)
  getStats: async () => {
    const response = await apiClient.get('/logs/stats');
    return response.data;
  },

  // Limpiar logs antiguos (admin)
  cleanup: async (diasAntiguedad: number = 90) => {
    const response = await apiClient.delete('/logs/audit/cleanup', {
      params: { diasAntiguedad },
    });
    return response.data;
  },
};

// ============================================
// METRICS SERVICE - Métricas de negocio
// ============================================

export const metricsApi = {
  // Consultar métricas (admin)
  search: async (params?: {
    nombre?: string;
    servicio?: string;
    categoria?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/metrics/business', { params });
    return response.data;
  },

  // Dashboard de métricas (admin)
  getDashboard: async () => {
    const response = await apiClient.get('/metrics/business/dashboard');
    return response.data;
  },
};

// ============================================
// CONFIG SERVICE - Configuraciones
// ============================================

export const configApi = {
  // Listar configuraciones (admin)
  list: async (params?: { servicio?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/config', { params });
    return response.data;
  },

  // Obtener configuración específica
  get: async (clave: string, servicio?: string) => {
    const response = await apiClient.get(`/config/${clave}`, {
      params: { servicio },
    });
    return response.data;
  },

  // Crear configuración (admin)
  create: async (data: {
    clave: string;
    valor: string;
    descripcion?: string;
    servicio?: string;
  }) => {
    const response = await apiClient.post('/config', data);
    return response.data;
  },

  // Actualizar configuración (admin)
  update: async (id: string, data: { valor: string; descripcion?: string }) => {
    const response = await apiClient.put(`/config/${id}`, data);
    return response.data;
  },

  // Eliminar configuración (admin)
  delete: async (id: string) => {
    const response = await apiClient.delete(`/config/${id}`);
    return response.data;
  },
};

// ============================================
// HEALTH SERVICE - Health checks
// ============================================

export const healthApi = {
  // Health check de todos los servicios
  checkAll: async () => {
    const response = await apiClient.get('/health/all');
    return response.data;
  },

  // Health check de un servicio específico
  checkService: async (service: string) => {
    const response = await apiClient.get(`/health/${service}`);
    return response.data;
  },
};

// Export default
export default apiClient;