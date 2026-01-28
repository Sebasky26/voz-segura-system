'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Supervisor {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  createdAt: string;
}

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchSupervisores();
  }, []);

  const fetchSupervisores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar supervisores');

      const json = await response.json();
      const data = json.data || json;
      const supervisoresList = Array.isArray(data)
        ? data.filter((u: any) => u.rol === 'SUPERVISOR' || u.rol === 'ADMIN')
        : [];
      setSupervisores(supervisoresList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al crear supervisor');

      setFormData({ nombre: '', apellido: '', email: '', password: '' });
      setShowCreateModal(false);
      fetchSupervisores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteSupervisor = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este supervisor?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al eliminar supervisor');

      fetchSupervisores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const filteredSupervisores = supervisores.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Supervisores</h1>
              <p className="text-gray-600 mt-2">Administra los supervisores del sistema</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              + Nuevo Supervisor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Supervisores List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando supervisores...</div>
          ) : filteredSupervisores.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay supervisores registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha de Registro</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSupervisores.map((supervisor) => (
                    <tr key={supervisor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {supervisor.nombre} {supervisor.apellido}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{supervisor.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {supervisor.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(supervisor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSupervisor(supervisor.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Volver al Panel
          </Link>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Supervisor</h2>
            <form onSubmit={handleCreateSupervisor} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
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
