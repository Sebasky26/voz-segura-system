// Archivo: src/app/dashboard/denuncias/[id]/estado/page.tsx
// Descripción: Página para que el Supervisor cambie el estado de la denuncia
// Solo supervisores asignados pueden acceder

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileTextIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  SaveIcon,
  ShieldCheck,
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
}

export default function CambiarEstadoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [userRole, setUserRole] = useState('');

  const [form, setForm] = useState({
    estado: '',
    comentario: '',
  });

  useEffect(() => {
    // Verificar rol
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.rol);
      
      if (user.rol !== 'SUPERVISOR') {
        router.push('/dashboard/denuncias');
        return;
      }
    }

    fetchDenuncia();
  }, [id, router]);

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
      setForm({ estado: data.data.estado, comentario: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    if (!form.estado) {
      setError('Debes seleccionar un estado');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/denuncias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al actualizar el estado');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/denuncias');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando denuncia...</p>
        </div>
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-red-800">{error || 'Denuncia no encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/denuncias"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Denuncias</span>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <ShieldCheck className="w-10 h-10 mr-3 text-indigo-600" />
            Cambiar Estado de Denuncia
          </h1>
          <p className="text-gray-600 mt-2">
            Como supervisor, puedes actualizar el estado del caso
          </p>
        </div>

        {/* Información de la denuncia */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Caso</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Código</p>
              <p className="font-mono font-semibold">{denuncia.codigoAnonimo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado Actual</p>
              <p className="font-semibold">{denuncia.estado.replace(/_/g, ' ')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Título</p>
              <p className="font-semibold">{denuncia.titulo}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nuevo Estado *
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Seleccionar estado...</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="APROBADA">Aprobada</option>
                <option value="DERIVADA">Derivada</option>
                <option value="CERRADA">Cerrada</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comentario (opcional)
              </label>
              <textarea
                name="comentario"
                value={form.comentario}
                onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Agrega notas sobre este cambio de estado..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Este comentario quedará registrado en el historial de la denuncia
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">Estado actualizado exitosamente. Redirigiendo...</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/dashboard/denuncias"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving || success}
                className="inline-flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-5 h-5 mr-2" />
                    Actualizar Estado
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
