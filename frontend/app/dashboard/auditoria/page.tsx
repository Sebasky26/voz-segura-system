'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LogEntry {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  tabla: string;
  detalles: string;
  timestamp: string;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    accion: '',
    tabla: '',
    busqueda: '',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/logs/audit', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar logs');

      const json = await response.json();
      const data = json.data || json;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filtros.accion && log.accion !== filtros.accion) return false;
    if (filtros.tabla && log.tabla !== filtros.tabla) return false;
    if (
      filtros.busqueda &&
      !log.usuarioNombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
      !log.detalles.toLowerCase().includes(filtros.busqueda.toLowerCase())
    )
      return false;
    return true;
  });

  const acciones = [...new Set(logs.map((l) => l.accion))];
  const tablas = [...new Set(logs.map((l) => l.tabla))];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Auditoría del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Visualiza todas las acciones realizadas en el sistema
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Usuario o detalle..."
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros({ ...filtros, busqueda: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acción
              </label>
              <select
                value={filtros.accion}
                onChange={(e) =>
                  setFiltros({ ...filtros, accion: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todas</option>
                {acciones.map((accion) => (
                  <option key={accion} value={accion}>
                    {accion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tabla
              </label>
              <select
                value={filtros.tabla}
                onChange={(e) =>
                  setFiltros({ ...filtros, tabla: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todas</option>
                {tablas.map((tabla) => (
                  <option key={tabla} value={tabla}>
                    {tabla}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                &nbsp;
              </label>
              <button
                onClick={() =>
                  setFiltros({ accion: '', tabla: '', busqueda: '' })
                }
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay registros de auditoría</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Tabla
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {log.usuarioNombre}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.accion === 'CREATE'
                              ? 'bg-green-100 text-green-700'
                              : log.accion === 'UPDATE'
                              ? 'bg-blue-100 text-blue-700'
                              : log.accion === 'DELETE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.tabla}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                        {log.detalles}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Total de Registros</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredLogs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Creaciones</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {filteredLogs.filter((l) => l.accion === 'CREATE').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Actualizaciones</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {filteredLogs.filter((l) => l.accion === 'UPDATE').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Eliminaciones</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {filteredLogs.filter((l) => l.accion === 'DELETE').length}
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-red-600 hover:text-red-700 font-medium">
            ← Volver al Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
