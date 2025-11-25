// Archivo: src/app/dashboard/denuncias/[id]/page.tsx
// Descripción: Página para ver detalles completos de una denuncia
// El ojito (👁️) te trae aquí para ver toda la información

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  AlertCircle,
  CheckCircle,
  ClockIcon,
  TagIcon,
  FlagIcon,
  ShieldCheck,
  FileIcon,
  Loader2,
} from 'lucide-react';

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
  evidencias: Array<{
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

  useEffect(() => {
    const fetchDenuncia = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/denuncias/${id}`, {
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
    const config = {
      PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      EN_REVISION: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle },
      APROBADA: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      DERIVADA: { bg: 'bg-purple-100', text: 'text-purple-800', icon: ShieldCheck },
      CERRADA: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
      RECHAZADA: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    };
    return config[estado as keyof typeof config] || config.PENDIENTE;
  };

  const getPrioridadBadge = (prioridad: string) => {
    const styles = {
      BAJA: 'bg-green-100 text-green-800 border-green-300',
      MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ALTA: 'bg-orange-100 text-orange-800 border-orange-300',
      URGENTE: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[prioridad as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !denuncia) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Mis Denuncias</span>
          </Link>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
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

  const estadoConfig = getEstadoBadge(denuncia.estado);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header con botón volver */}
        <div className="mb-8">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Mis Denuncias</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <FileTextIcon className="w-10 h-10 mr-3 text-indigo-600" />
                Detalles de la Denuncia
              </h1>
              <p className="text-gray-600 mt-2">Vista completa de la información</p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-3">
              {/* Botón Chat - Solo si hay supervisor asignado */}
              {denuncia.supervisor && (
                <Link
                  href={`/dashboard/denuncias/${id}/chat`}
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium shadow-lg"
                >
                  💬 Chat Anónimo
                </Link>
              )}

              {/* Botón editar - solo para denunciante */}
              <Link
                href={`/dashboard/denuncias/${id}/editar`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-lg"
              >
                ✏️ Editar Denuncia
              </Link>
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
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${estadoConfig.bg} ${estadoConfig.text} border-2`}>
                <EstadoIcon className="w-5 h-5" />
                <span className="font-semibold">{denuncia.estado.replace(/_/g, ' ')}</span>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${getPrioridadBadge(denuncia.prioridad)} border-2`}>
                <FlagIcon className="w-5 h-5" />
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
                <TagIcon className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Categoría</p>
                  <p className="text-base font-semibold text-gray-900">{getCategoriaLabel(denuncia.categoria)}</p>
                </div>
              </div>

              {/* Ubicación */}
              {denuncia.ubicacionGeneral && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <TagIcon className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ubicación General</p>
                    <p className="text-base font-semibold text-gray-900">{denuncia.ubicacionGeneral}</p>
                  </div>
                </div>
              )}

              {/* Fecha de actualización */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <CalendarIcon className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
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
                  <UserIcon className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
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
                <FileTextIcon className="w-5 h-5 mr-2 text-indigo-600" />
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
                  <FileIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  Evidencias Adjuntas ({denuncia.evidencias.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {denuncia.evidencias.map((evidencia) => (
                    <div
                      key={evidencia.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200"
                    >
                      <div className="flex items-center space-x-3">
                        <FileIcon className="w-5 h-5 text-blue-600" />
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
