// Archivo: src/app/dashboard/denuncias/[id]/editar/page.tsx
// Descripción: Página para editar una denuncia existente
// Permite modificar título, descripción, categoría y prioridad

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
} from 'lucide-react';

export default function EditarDenunciaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    prioridad: '',
    ubicacionGeneral: '',
  });

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
        const denuncia = data.data;

        setForm({
          titulo: denuncia.titulo || '',
          descripcion: denuncia.descripcion || '',
          categoria: denuncia.categoria || '',
          prioridad: denuncia.prioridad || '',
          ubicacionGeneral: denuncia.ubicacionGeneral || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDenuncia();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    // Validaciones
    if (form.titulo.length < 10) {
      setError('El título debe tener al menos 10 caracteres');
      setSaving(false);
      return;
    }

    if (form.descripcion.length < 50) {
      setError('La descripción debe tener al menos 50 caracteres');
      setSaving(false);
      return;
    }

    if (!form.categoria) {
      setError('Debes seleccionar una categoría');
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
        throw new Error(data.message || 'Error al actualizar');
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(`/dashboard/denuncias/${id}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con botón volver */}
        <div className="mb-8">
          <Link
            href={`/dashboard/denuncias/${id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Detalles</span>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <FileTextIcon className="w-10 h-10 mr-3 text-indigo-600" />
            Editar Denuncia
          </h1>
          <p className="text-gray-600 mt-2">Modifica la información de tu denuncia</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensajes */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">¡Denuncia actualizada exitosamente!</p>
                  <p className="text-sm text-green-700 mt-1">Redirigiendo a los detalles...</p>
                </div>
              </div>
            )}

            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-semibold text-gray-700 mb-2">
                Título de la Denuncia *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="Describe brevemente el problema (mínimo 10 caracteres)"
                minLength={10}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{form.titulo.length}/10 caracteres mínimos</p>
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                required
              >
                <option value="">Selecciona una categoría</option>
                <option value="ACOSO_LABORAL">Acoso Laboral</option>
                <option value="DISCRIMINACION">Discriminación</option>
                <option value="FALTA_DE_PAGO">Falta de Pago</option>
                <option value="ACOSO_SEXUAL">Acoso Sexual</option>
                <option value="VIOLACION_DERECHOS">Violación de Derechos</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label htmlFor="prioridad" className="block text-sm font-semibold text-gray-700 mb-2">
                Prioridad *
              </label>
              <select
                id="prioridad"
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                required
              >
                <option value="BAJA">🟢 Baja - No requiere atención inmediata</option>
                <option value="MEDIA">🟡 Media - Requiere atención moderada</option>
                <option value="ALTA">🟠 Alta - Requiere atención pronta</option>
                <option value="URGENTE">🔴 Urgente - Requiere atención inmediata</option>
              </select>
            </div>

            {/* Ubicación General */}
            <div>
              <label htmlFor="ubicacionGeneral" className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación General (opcional)
              </label>
              <input
                type="text"
                id="ubicacionGeneral"
                name="ubicacionGeneral"
                value={form.ubicacionGeneral}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="Ej: Oficina Central, Planta de Producción"
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe detalladamente lo sucedido (mínimo 50 caracteres)"
                minLength={50}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{form.descripcion.length}/50 caracteres mínimos</p>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Información Importante</p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Los campos marcados con * son obligatorios<br />
                    • Tu identidad permanecerá anónima<br />
                    • Los cambios se guardarán en el historial de la denuncia
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
              <Link
                href={`/dashboard/denuncias/${id}`}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving || success}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-5 h-5 mr-2" />
                    Guardar Cambios
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
