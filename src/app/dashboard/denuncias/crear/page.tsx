// Archivo: src/app/dashboard/denuncias/crear/page.tsx
// Descripción: Formulario para crear nueva denuncia
// Rúbrica: 15% - CRUD Create

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileTextIcon, ArrowLeftIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function CrearDenunciaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    prioridad: 'MEDIA',
    ubicacionGeneral: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBack = () => {
    router.push('/dashboard/denuncias');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validaciones del lado del cliente
    if (form.titulo.length < 10) {
      setError('El título debe tener al menos 10 caracteres');
      setLoading(false);
      return;
    }

    if (form.descripcion.length < 50) {
      setError('La descripción debe tener al menos 50 caracteres');
      setLoading(false);
      return;
    }

    if (!form.categoria) {
      setError('Debes seleccionar una categoría');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      
      console.log('🔍 Debug crear denuncia:');
      console.log('  - Token existe:', !!token);
      console.log('  - Usuario en localStorage:', userString ? JSON.parse(userString) : 'No existe');
      
      if (!token) {
        console.error('❌ No hay token, redirigiendo a login');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/denuncias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.message || 'Error al crear la denuncia');
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/denuncias');
      }, 2000);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Volver a Mis Denuncias</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileTextIcon className="w-8 h-8 mr-3 text-indigo-600" />
          Nueva Denuncia
        </h1>
        <p className="text-gray-600 mt-2">
          Crea una denuncia anónima de forma segura. Tu identidad está protegida.
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">¡Denuncia creada exitosamente!</p>
              <p className="text-green-700 text-sm mt-1">Redirigiendo...</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la denuncia *
            </label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Acoso laboral recurrente en oficina principal"
              required
              minLength={10}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 10 caracteres ({form.titulo.length}/10)
            </p>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecciona una categoría</option>
              <option value="ACOSO_LABORAL">Acoso Laboral</option>
              <option value="ACOSO_SEXUAL">Acoso Sexual</option>
              <option value="DISCRIMINACION">Discriminación</option>
              <option value="FALTA_DE_PAGO">Falta de Pago</option>
              <option value="VIOLACION_DERECHOS">Violación de Derechos</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad *
            </label>
            <select
              name="prioridad"
              value={form.prioridad}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="BAJA">Baja - No urgente</option>
              <option value="MEDIA">Media - Atención regular</option>
              <option value="ALTA">Alta - Requiere pronta atención</option>
              <option value="URGENTE">Urgente - Atención inmediata</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Indica el nivel de urgencia de tu denuncia
            </p>
          </div>

          {/* Ubicación General */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación General (opcional)
            </label>
            <input
              type="text"
              name="ubicacionGeneral"
              value={form.ubicacionGeneral}
              onChange={handleChange}
              placeholder="Ej: Oficina Central, Planta de Producción, Sucursal Norte"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcional: Indica dónde ocurrieron los hechos para un mejor seguimiento
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción detallada *
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={8}
              placeholder="Describe la situación con el mayor detalle posible. Incluye: ¿Qué pasó? ¿Cuándo? ¿Dónde? ¿Quiénes estuvieron involucrados?"
              required
              minLength={50}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 50 caracteres ({form.descripcion.length}/50). Cuanto más detallada sea tu denuncia, mejor podremos ayudarte.
            </p>
          </div>

          {/* Nota de anonimato */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 font-medium">Tu denuncia es completamente anónima</p>
                <p className="text-sm text-blue-700 mt-1">
                  Se generará un código único para que puedas dar seguimiento sin revelar tu identidad.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando denuncia...' : 'Crear Denuncia'}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
