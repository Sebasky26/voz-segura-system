'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Denuncia {
  id: string;
  titulo: string;
  categoria: string;
  estado: string;
  supervisorId: string | null;
  supervisorNombre?: string;
  createdAt: string;
}

interface Supervisor {
  id: string;
  nombre: string;
  apellido: string;
}

export default function AsignarSupervisoresPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDenuncia, setSelectedDenuncia] = useState<string | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [filtros, setFiltros] = useState({
    estado: '',
    conSupervisor: '', // '', 'sin', 'con'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch denuncias
      const denunciasResponse = await fetch('http://localhost:8000/api/denuncias', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (denunciasResponse.ok) {
        const json = await denunciasResponse.json();
        const data = json.data || json;
        setDenuncias(Array.isArray(data) ? data : []);
      }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarSupervisor = async () => {
    if (!selectedDenuncia || !selectedSupervisor) {
      setError('Selecciona una denuncia y un supervisor');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/denuncias/${selectedDenuncia}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supervisorId: selectedSupervisor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al asignar supervisor');
      }

      alert('Supervisor asignado correctamente');
      setSelectedDenuncia(null);
      setSelectedSupervisor('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const filteredDenuncias = denuncias.filter((d) => {
    if (filtros.estado && d.estado !== filtros.estado) return false;
    if (filtros.conSupervisor === 'sin' && d.supervisorId) return false;
    if (filtros.conSupervisor === 'con' && !d.supervisorId) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Asignar Supervisores</h1>
            <p className="text-gray-600 mt-2">Asigna supervisores a denuncias específicas</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Denuncias List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Denuncias</h2>

                {/* Filtros */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los estados</option>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_REVISION">En revisión</option>
                      <option value="APROBADA">Aprobada</option>
                      <option value="RECHAZADA">Rechazada</option>
                    </select>

                    <select
                      value={filtros.conSupervisor}
                      onChange={(e) => setFiltros({ ...filtros, conSupervisor: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las denuncias</option>
                      <option value="sin">Sin supervisor</option>
                      <option value="con">Con supervisor</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando denuncias...</div>
              ) : filteredDenuncias.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay denuncias</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900"></th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Título</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Categoría</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supervisor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDenuncias.map((denuncia) => (
                        <tr
                          key={denuncia.id}
                          onClick={() => setSelectedDenuncia(denuncia.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedDenuncia === denuncia.id
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="radio"
                              checked={selectedDenuncia === denuncia.id}
                              onChange={() => setSelectedDenuncia(denuncia.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {denuncia.titulo.substring(0, 40)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {denuncia.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              denuncia.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                              denuncia.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-700' :
                              denuncia.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {denuncia.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {denuncia.supervisorNombre || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Asignar Supervisor */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignar Supervisor</h3>

              {selectedDenuncia ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Denuncia seleccionada
                    </label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                      {denuncias.find((d) => d.id === selectedDenuncia)?.titulo.substring(0, 30)}...
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supervisor
                    </label>
                    <select
                      value={selectedSupervisor}
                      onChange={(e) => setSelectedSupervisor(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona un supervisor</option>
                      {supervisores.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.nombre} {sup.apellido}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAsignarSupervisor}
                    disabled={!selectedSupervisor}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Asignar
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded text-center text-gray-600 text-sm">
                  Selecciona una denuncia para asignar un supervisor
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Volver al Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
