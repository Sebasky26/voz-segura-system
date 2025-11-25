// Archivo: src/app/dashboard/denuncias/page.tsx
// Descripción: Pantalla principal con operaciones CRUD de denuncias
// Rúbrica: 15% - Operaciones CRUD (Create, Read, Update, Delete)

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon,
  SearchIcon,
  FileTextIcon,
  AlertCircle,
  Edit2Icon,
  Trash2Icon,
  EyeIcon,
  FilterIcon,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface Denuncia {
  id: string;
  codigoAnonimo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  prioridad: string;
  createdAt: string;
  supervisor?: { nombre: string; apellido: string };
  _count: { evidencias: number };
}

export default function DenunciasPage() {
  const router = useRouter();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const fetchDenuncias = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filtroEstado
        ? `/api/denuncias?estado=${filtroEstado}`
        : '/api/denuncias';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar denuncias');
      }

      const data = await response.json();
      setDenuncias(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  // Obtener rol del usuario
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.rol);
    }
  }, []);

  // Cargar denuncias
  useEffect(() => {
    fetchDenuncias();
  }, [fetchDenuncias]);

  const handleDelete = async (id: string, titulo: string) => {
    const confirmacion = window.confirm(
      `⚠️ CONFIRMACIÓN DE ELIMINACIÓN\n\n¿Estás seguro de que deseas eliminar la siguiente denuncia?\n\n"${titulo}"\n\n⚠️ Esta acción NO se puede deshacer.\n⚠️ Se perderán todos los datos asociados (evidencias, comentarios, etc.)\n\n¿Deseas continuar?`
    );
    
    if (!confirmacion) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/denuncias/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al eliminar');
      }

      // Actualizar lista
      setDenuncias(denuncias.filter((d) => d.id !== id));
      alert('Denuncia eliminada exitosamente');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const denunciasFiltradas = denuncias.filter((d) =>
    d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.codigoAnonimo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      EN_REVISION: 'bg-blue-100 text-blue-800',
      APROBADA: 'bg-green-100 text-green-800',
      DERIVADA: 'bg-purple-100 text-purple-800',
      CERRADA: 'bg-gray-100 text-gray-800',
      RECHAZADA: 'bg-red-100 text-red-800',
    };
    return styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadBadge = (prioridad: string) => {
    const styles = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      URGENTE: 'bg-red-100 text-red-800',
    };
    return styles[prioridad as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando denuncias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón volver */}
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
                <FileTextIcon className="w-10 h-10 mr-3 text-indigo-600" />
                {userRole === 'ADMIN' || userRole === 'SUPERVISOR'
                  ? 'Gestión de Denuncias'
                  : 'Mis Denuncias'}
              </h1>
              <p className="text-gray-600 mt-2">
                {userRole === 'ADMIN' || userRole === 'SUPERVISOR'
                  ? 'Supervisa y gestiona todas las denuncias del sistema'
                  : 'Consulta el estado de tus denuncias anónimas'}
              </p>
            </div>

            {/* Botón crear denuncia */}
            {userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && (
              <Link
                href="/dashboard/denuncias/crear"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nueva Denuncia
              </Link>
            )}
          </div>
        </div>

        {/* Alerta de información según rol */}
        {userRole === 'ADMIN' || userRole === 'SUPERVISOR' ? (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Modo Administrador</p>
                <p className="text-sm text-blue-700 mt-1">
                  Estás viendo todas las denuncias del sistema. Puedes gestionarlas y asignarlas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Denuncias Anónimas</p>
                <p className="text-sm text-green-700 mt-1">
                  Tu identidad está protegida. Solo tú puedes ver tus denuncias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filtro estado */}
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="APROBADA">Aprobada</option>
                <option value="CERRADA">Cerrada</option>
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

      {/* Lista de denuncias */}
      {denunciasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay denuncias</h3>
          <p className="text-gray-500">Comienza creando una nueva denuncia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {denunciasFiltradas.map((denuncia) => (
            <div
              key={denuncia.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Código y fecha */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      {denuncia.codigoAnonimo}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(denuncia.createdAt).toLocaleDateString('es-EC')}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {denuncia.titulo}
                  </h3>

                  {/* Descripción truncada */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {denuncia.descripcion}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(denuncia.estado)}`}
                    >
                      {denuncia.estado}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadBadge(denuncia.prioridad)}`}
                    >
                      {denuncia.prioridad}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {denuncia.categoria.replace(/_/g, ' ')}
                    </span>
                    {denuncia._count.evidencias > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {denuncia._count.evidencias} evidencia(s)
                      </span>
                    )}
                  </div>

                  {/* Supervisor asignado */}
                  {denuncia.supervisor && (
                    <p className="text-xs text-gray-500 mt-3">
                      Asignado a: {denuncia.supervisor.nombre} {denuncia.supervisor.apellido}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-start space-x-2 ml-4">
                  <button
                    onClick={() => router.push(`/dashboard/denuncias/${denuncia.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="👁️ Ver detalles completos de la denuncia"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/denuncias/${denuncia.id}/editar`)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="✏️ Editar información de la denuncia"
                  >
                    <Edit2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(denuncia.id, denuncia.titulo)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar denuncia (acción permanente)"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Resumen */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {denunciasFiltradas.length} de {denuncias.length} denuncias
        </div>
      </div>
    </div>
  );
}