// Archivo: src/app/dashboard/auditoria/page.tsx
// Descripción: Página de auditoría para administradores
// Solo el ADMIN puede ver los logs del sistema

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';

interface AuditLog {
  id: string;
  accion: string;
  tabla: string | null;
  registroId: string | null;
  recurso: string | null;
  detalles: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  exitoso: boolean;
  createdAt: string;
  usuario: {
    id: string;
    email: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
  } | null;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // Filtros
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Verificar rol de usuario
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.rol);
      
      // Solo admin puede acceder
      if (user.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
    }

    fetchLogs();
  }, [router, filtroAccion, filtroTabla, filtroUsuario]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let url = '/api/auditoria?limit=100';
      if (filtroAccion) url += `&accion=${filtroAccion}`;
      if (filtroTabla) url += `&tabla=${filtroTabla}`;
      if (filtroUsuario) url += `&usuarioId=${filtroUsuario}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar logs de auditoría');
      }

      const data = await response.json();
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter((log) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.accion.toLowerCase().includes(searchLower) ||
      log.tabla?.toLowerCase().includes(searchLower) ||
      log.usuario?.email.toLowerCase().includes(searchLower) ||
      log.ipAddress?.toLowerCase().includes(searchLower)
    );
  });

  const getAccionBadge = (accion: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      LOGIN: { bg: 'bg-green-100', text: 'text-green-800' },
      LOGOUT: { bg: 'bg-gray-100', text: 'text-gray-800' },
      LOGIN_FALLIDO: { bg: 'bg-red-100', text: 'text-red-800' },
      CREAR_DENUNCIA: { bg: 'bg-blue-100', text: 'text-blue-800' },
      MODIFICAR_DENUNCIA: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      ELIMINAR_DENUNCIA: { bg: 'bg-red-100', text: 'text-red-800' },
      CAMBIO_ESTADO_DENUNCIA: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ENVIAR_MENSAJE: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      VER_MENSAJES: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      VER_DENUNCIA: { bg: 'bg-teal-100', text: 'text-teal-800' },
      LISTAR_DENUNCIAS: { bg: 'bg-blue-100', text: 'text-blue-800' },
      CONSULTA_AUDITORIA: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    return config[accion] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getRolBadge = (rol: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      ADMIN: { bg: 'bg-red-100', text: 'text-red-800' },
      SUPERVISOR: { bg: 'bg-blue-100', text: 'text-blue-800' },
      DENUNCIANTE: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    return config[rol] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando logs de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <ShieldCheck className="w-10 h-10 mr-3 text-indigo-600" />
                Auditoría del Sistema
              </h1>
              <p className="text-gray-600 mt-2">
                Monitorea todas las actividades e interacciones del sistema
              </p>
            </div>
            <div className="bg-red-100 rounded-xl p-4 border-2 border-red-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Solo Administradores</p>
                  <p className="text-xs text-red-600">Acceso restringido</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta informativa */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <Eye className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Información de Privacidad</p>
              <p className="text-sm text-blue-700 mt-1">
                Los logs muestran actividad del sistema pero NO incluyen datos personales de denunciantes anónimos.
                Solo se registran acciones, fechas, IPs y roles de usuarios.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filtro acción */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las acciones</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="LOGIN_FALLIDO">Login Fallido</option>
                <option value="CREAR_DENUNCIA">Crear Denuncia</option>
                <option value="MODIFICAR_DENUNCIA">Modificar Denuncia</option>
                <option value="ELIMINAR_DENUNCIA">Eliminar Denuncia</option>
                <option value="CAMBIO_ESTADO_DENUNCIA">Cambio Estado</option>
                <option value="ENVIAR_MENSAJE">Enviar Mensaje</option>
                <option value="VER_MENSAJES">Ver Mensajes</option>
              </select>
            </div>

            {/* Filtro tabla */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filtroTabla}
                onChange={(e) => setFiltroTabla(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las tablas</option>
                <option value="Usuario">Usuario</option>
                <option value="Denuncia">Denuncia</option>
                <option value="MensajeChat">Chat</option>
                <option value="AuditoriaLog">Auditoría</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Total de Registros</p>
            <p className="text-3xl font-bold text-blue-600">{logs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-100">
            <p className="text-sm text-gray-600 mb-1">Exitosos</p>
            <p className="text-3xl font-bold text-green-600">
              {logs.filter(l => l.exitoso).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-100">
            <p className="text-sm text-gray-600 mb-1">Fallidos</p>
            <p className="text-3xl font-bold text-red-600">
              {logs.filter(l => !l.exitoso).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-100">
            <p className="text-sm text-gray-600 mb-1">Usuarios Únicos</p>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(logs.filter(l => l.usuario).map(l => l.usuario!.id)).size}
            </p>
          </div>
        </div>

        {/* Tabla de logs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  logsFiltrados.map((log) => {
                    const accionBadge = getAccionBadge(log.accion);
                    const rolBadge = log.usuario ? getRolBadge(log.usuario.rol) : null;

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {new Date(log.createdAt).toLocaleDateString('es-EC')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleTimeString('es-EC')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.usuario ? (
                            <div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {log.usuario.email}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rolBadge?.bg} ${rolBadge?.text}`}>
                                  {log.usuario.rol}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sistema</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${accionBadge.bg} ${accionBadge.text}`}>
                            {log.accion.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.tabla || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.exitoso ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Exitoso
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ✗ Fallido
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {logsFiltrados.length} de {logs.length} registros
        </div>
      </div>
    </div>
  );
}
