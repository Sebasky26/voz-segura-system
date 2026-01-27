// Archivo: src/app/dashboard/denuncias/[id]/page.tsx
// Descripción: Página para ver detalles completos de una denuncia

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
  supervisor?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  evidencias?: Array<{
    id: string;
    nombreOriginal: string;
    tipo: string;
    createdAt: string;
  }>;
}

export default function VerDenunciaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.rol);
    }
  }, []);

  useEffect(() => {
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

    fetchDenuncia();
  }, [id]);

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
            <span className="font-medium">Volver a Mis Denuncias</span>
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
        {/* Header con botón volver */}
        <div className="mb-8">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver a Mis Denuncias</span>
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

            {/* Botones de acción */}
            {userRole === 'DENUNCIANTE' && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/denuncias/${id}/editar`}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Denuncia
                </Link>
              </div>
            )}
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

              {/* Supervisor asignado */}
              {denuncia.supervisor && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Supervisor Asignado</p>
                    <p className="text-base font-semibold text-gray-900">
                      {denuncia.supervisor.nombre} {denuncia.supervisor.apellido}
                    </p>
                    <p className="text-sm text-gray-600">{denuncia.supervisor.email}</p>
                  </div>
                </div>
              )}
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

            {/* Evidencias */}
            {denuncia.evidencias && denuncia.evidencias.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Evidencias Adjuntas ({denuncia.evidencias.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {denuncia.evidencias.map((evidencia) => (
                    <div
                      key={evidencia.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{evidencia.nombreOriginal}</p>
                          <p className="text-sm text-gray-600">
                            Tipo: {evidencia.tipo} • Subido: {new Date(evidencia.createdAt).toLocaleDateString('es-EC')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
