'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Regla {
  id: string;
  categoria: string;
  supervisorId: string;
  supervisorNombre?: string;
  descripcion?: string;
}

interface Supervisor {
  id: string;
  nombre: string;
  apellido: string;
}

const CATEGORIAS = ['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO'];

export default function ReglasPage() {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ categoria: '', supervisorId: '', descripcion: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch supervisores
      const supervisoresResponse = await fetch('http://localhost:8000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (supervisoresResponse.ok) {
        const json = await supervisoresResponse.json();
        const data = json.data || json;
        const supervisoresList = Array.isArray(data)
          ? data.filter((u: any) => u.rol === 'SUPERVISOR')
          : [];
        setSupervisores(supervisoresList);
      }

      // Fetch reglas
      const reglasResponse = await fetch('http://localhost:8000/api/denuncias/reglas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reglasResponse.ok) {
        const json = await reglasResponse.json();
        const data = json.data || json;
        setReglas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegla = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/api/denuncias/reglas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoria: formData.categoria,
          supervisorId: formData.supervisorId,
          descripcion: formData.descripcion,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear regla');
      }

      alert('Regla creada correctamente');
      setFormData({ categoria: '', supervisorId: '', descripcion: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
    }
  };

  const handleDeleteRegla = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/denuncias/reglas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al eliminar regla');

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Reglas de Asignación</h1>
              <p className="text-gray-600 mt-2">
                Define qué supervisor atiende cada categoría de denuncia
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              + Nueva Regla
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Reglas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              Cargando reglas...
            </div>
          ) : reglas.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No hay reglas configuradas
            </div>
          ) : (
            reglas.map((regla) => (
              <div key={regla.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{regla.categoria}</h3>
                  <button
                    onClick={() => handleDeleteRegla(regla.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Supervisor</p>
                    <p className="text-sm text-gray-900 font-medium">{regla.supervisorNombre}</p>
                  </div>
                  {regla.descripcion && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Descripción</p>
                      <p className="text-sm text-gray-700">{regla.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Volver al Panel
          </Link>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nueva Regla</h2>
            <form onSubmit={handleCreateRegla} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor
                </label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un supervisor</option>
                  {supervisores.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.nombre} {sup.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
