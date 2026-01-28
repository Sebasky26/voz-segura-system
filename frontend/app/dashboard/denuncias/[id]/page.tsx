// Archivo: src/app/dashboard/denuncias/[id]/page.tsx
// Descripción: Página para ver detalles completos de una denuncia

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface HistorialItem {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
  comentario?: string;
  realizadoPor: string;
  createdAt: string;
}

interface Denuncia {
  id: string;
  codigoAnonimo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  prioridad: string;
  ubicacionGeneral?: string;
  createdAt: string;
  updatedAt: string;
  supervisorId?: string;
  historial?: HistorialItem[];
}

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow' },
  { value: 'EN_REVISION', label: 'En Revisión', color: 'blue' },
  { value: 'APROBADA', label: 'Aprobada', color: 'green' },
  { value: 'RECHAZADA', label: 'Rechazada', color: 'red' },
  { value: 'DERIVADA', label: 'Derivada', color: 'purple' },
  { value: 'CERRADA', label: 'Cerrada', color: 'gray' },
];

export default function VerDenunciaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  
  // Estados para el modal de cambio de estado
  const [showModal, setShowModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentario, setComentario] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.rol);
      setUserId(user.id);
    }
  }, []);

  const fetchDenuncia = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/denuncias/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar la denuncia');
      }

      const data = await response.json();
      setDenuncia(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDenuncia();
  }, [id]);

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    
    setCambiandoEstado(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/denuncias/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          comentario: comentario || undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar estado');
      }

      setMensajeExito(`Estado cambiado a ${nuevoEstado.replace(/_/g, ' ')} exitosamente`);
      setShowModal(false);
      setNuevoEstado('');
      setComentario('');
      
      // Recargar la denuncia para ver el historial actualizado
      await fetchDenuncia();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      EN_REVISION: 'bg-blue-100 text-blue-800 border-blue-300',
      APROBADA: 'bg-green-100 text-green-800 border-green-300',
      DERIVADA: 'bg-purple-100 text-purple-800 border-purple-300',
      CERRADA: 'bg-gray-100 text-gray-800 border-gray-300',
      RECHAZADA: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPrioridadBadge = (prioridad: string) => {
    const styles: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800 border-green-300',
      MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ALTA: 'bg-orange-100 text-orange-800 border-orange-300',
      URGENTE: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[prioridad] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      ACOSO_LABORAL: 'Acoso Laboral',
      DISCRIMINACION: 'Discriminación',
      FALTA_DE_PAGO: 'Falta de Pago',
      ACOSO_SEXUAL: 'Acoso Sexual',
      VIOLACION_DERECHOS: 'Violación de Derechos',
      OTRO: 'Otro',
    };
    return labels[categoria] || categoria;
  };

  // Verificar si el supervisor puede gestionar esta denuncia
  const esSupervisorAsignado = userRole === 'SUPERVISOR' && denuncia?.supervisorId === userId;
  const puedeGestionar = esSupervisorAsignado || userRole === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !denuncia) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver a Denuncias</span>
          </Link>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar</h3>
                <p className="text-red-700">{error || 'Denuncia no encontrada'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 font-medium">{mensajeExito}</p>
            </div>
          </div>
        )}

        {/* Header con botón volver */}
        <div className="mb-8">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver a Denuncias</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <svg className="w-10 h-10 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detalles de la Denuncia
              </h1>
              <p className="text-gray-600 mt-2">Vista completa de la información</p>
            </div>

            {/* Botones de acción según rol */}
            <div className="flex items-center space-x-3">
              {userRole === 'DENUNCIANTE' && (
                <Link
                  href={`/dashboard/denuncias/${id}/editar`}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Denuncia
                </Link>
              )}
              
              {/* Botón para supervisor/admin cambiar estado */}
              {puedeGestionar && denuncia.estado !== 'CERRADA' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Gestionar Estado
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header del card con código y fecha */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">Código de Seguimiento</p>
                <p className="text-2xl font-mono font-bold">{denuncia.codigoAnonimo}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-sm mb-1">Creada el</p>
                <p className="text-lg font-semibold">
                  {new Date(denuncia.createdAt).toLocaleDateString('es-EC', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Estado y Prioridad */}
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${getEstadoBadge(denuncia.estado)} border-2`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{denuncia.estado.replace(/_/g, ' ')}</span>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${getPrioridadBadge(denuncia.prioridad)} border-2`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="font-semibold">Prioridad: {denuncia.prioridad}</span>
              </div>
            </div>

            {/* Título */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{denuncia.titulo}</h2>
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Categoría */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-500">Categoría</p>
                  <p className="text-base font-semibold text-gray-900">{getCategoriaLabel(denuncia.categoria)}</p>
                </div>
              </div>

              {/* Ubicación */}
              {denuncia.ubicacionGeneral && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ubicación General</p>
                    <p className="text-base font-semibold text-gray-900">{denuncia.ubicacionGeneral}</p>
                  </div>
                </div>
              )}

              {/* Fecha de actualización */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(denuncia.updatedAt).toLocaleDateString('es-EC')}
                  </p>
                </div>
              </div>
            </div>

            {/* Descripción completa */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descripción Detallada
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {denuncia.descripcion}
                </p>
              </div>
            </div>

            {/* Historial de cambios */}
            {denuncia.historial && denuncia.historial.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Historial de Cambios ({denuncia.historial.length})
                </h3>
                <div className="space-y-3">
                  {denuncia.historial.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start p-4 bg-gray-50 rounded-xl border-l-4 border-indigo-500"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadge(item.estadoAnterior)}`}>
                            {item.estadoAnterior.replace(/_/g, ' ')}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadge(item.estadoNuevo)}`}>
                            {item.estadoNuevo.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {item.comentario && (
                          <p className="text-gray-700 text-sm mt-2 italic">&quot;{item.comentario}&quot;</p>
                        )}
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(item.createdAt).toLocaleString('es-EC')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para cambiar estado */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Cambiar Estado
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Seleccionar estado...</option>
                  {ESTADOS.filter(e => e.value !== denuncia.estado).map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  placeholder="Agregar un comentario sobre este cambio..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>

              {/* Botones de acción rápida para aprobar/rechazar */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setNuevoEstado('APROBADA')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    nuevoEstado === 'APROBADA' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  ✓ Aprobar
                </button>
                <button
                  onClick={() => setNuevoEstado('RECHAZADA')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    nuevoEstado === 'RECHAZADA' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  ✗ Rechazar
                </button>
                <button
                  onClick={() => setNuevoEstado('EN_REVISION')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    nuevoEstado === 'EN_REVISION' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  ⟳ Revisar
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNuevoEstado('');
                    setComentario('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCambiarEstado}
                  disabled={!nuevoEstado || cambiandoEstado}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cambiandoEstado ? 'Guardando...' : 'Guardar Cambio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
