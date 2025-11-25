"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Supervisor = {
  id: string;
  email: string;
  estado: string;
};

type Regla = {
  id: string;
  nombre: string;
  categoria: string;
  supervisorId: string;
  prioridad: number;
  activa: boolean;
  createdAt: string;
  supervisor?: Supervisor;
};

const categorias = [
  { value: "ACOSO_LABORAL", label: "Acoso Laboral" },
  { value: "DISCRIMINACION", label: "Discriminación" },
  { value: "FALTA_DE_PAGO", label: "Falta de Pago" },
  { value: "ACOSO_SEXUAL", label: "Acoso Sexual" },
  { value: "VIOLACION_DERECHOS", label: "Violación de Derechos" },
  { value: "OTRO", label: "Otro" },
];

const nivelesUrgencia = [
  { value: "URGENTE", label: "Urgente", prioridad: 3 },
  { value: "ALTA", label: "Alta", prioridad: 2 },
  { value: "MEDIA", label: "Media", prioridad: 1 },
  { value: "BAJA", label: "Baja", prioridad: 0 },
];

export default function ReglasPage() {
  const router = useRouter();
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Formulario
  const [categoria, setCategoria] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [urgencia, setUrgencia] = useState("MEDIA");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatos() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Cargar reglas
      const resReglas = await fetch("/api/reglas-supervisor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resReglas.ok) throw new Error("Error al cargar reglas");
      const dataReglas = await resReglas.json();
      setReglas(dataReglas);

      // Cargar supervisores
      const resSupervisores = await fetch("/api/usuarios?rol=SUPERVISOR", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resSupervisores.ok) throw new Error("Error al cargar supervisores");
      const dataSupervisores = await resSupervisores.json();
      setSupervisores(dataSupervisores.filter((s: Supervisor) => s.estado === "ACTIVO"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function crearRegla() {
    if (!categoria || !supervisorId) {
      setError("Debe seleccionar categoría y supervisor");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const nivelUrgencia = nivelesUrgencia.find(n => n.value === urgencia);
      
      const url = editandoId 
        ? `/api/reglas-supervisor/${editandoId}` 
        : "/api/reglas-supervisor";
      
      const method = editandoId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoria,
          supervisorId,
          prioridad: nivelUrgencia?.prioridad ?? 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar regla");
      }

      // Recargar datos
      await cargarDatos();
      
      // Resetear formulario
      setCategoria("");
      setSupervisorId("");
      setUrgencia("MEDIA");
      setEditandoId(null);
      setMostrarFormulario(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleRegla(id: string, activa: boolean) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/reglas-supervisor/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activa: !activa }),
      });

      if (!response.ok) throw new Error("Error al actualizar regla");

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  async function editarRegla(regla: Regla) {
    setCategoria(regla.categoria);
    setSupervisorId(regla.supervisorId);
    const nivel = nivelesUrgencia.find(n => n.prioridad === regla.prioridad);
    setUrgencia(nivel?.value || "MEDIA");
    setEditandoId(regla.id);
    setMostrarFormulario(true);
  }

  async function eliminarRegla(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta regla?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/reglas-supervisor/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar regla");

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header unificado con botón de regreso estándar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>
            <div className="h-8 w-px bg-gray-300" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reglas de Asignación
              </h1>
              <p className="text-gray-600 mt-1">
                Define qué supervisor atiende cada categoría según su prioridad
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Botón para crear nueva regla */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditandoId(null);
              setCategoria("");
              setSupervisorId("");
              setUrgencia("MEDIA");
              setMostrarFormulario(!mostrarFormulario);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {mostrarFormulario ? "Cancelar" : "➥ Nueva Regla"}
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editandoId ? "Editar Regla" : "Crear Nueva Regla"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Categoría *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={guardando}
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nivel de Prioridad *
                </label>
                <select
                  value={urgencia}
                  onChange={(e) => setUrgencia(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={guardando}
                >
                  {nivelesUrgencia.map((nivel) => (
                    <option key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Supervisor *
                </label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={guardando}
                >
                  <option value="">Seleccionar...</option>
                  {supervisores.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={crearRegla}
                disabled={guardando || !categoria || !supervisorId}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {guardando ? "Guardando..." : editandoId ? "Actualizar Regla" : "Crear Regla"}
              </button>
              <button
                onClick={() => {
                  setMostrarFormulario(false);
                  setEditandoId(null);
                  setCategoria("");
                  setSupervisorId("");
                  setUrgencia("MEDIA");
                }}
                disabled={guardando}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de reglas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado Regla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reglas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay reglas configuradas
                  </td>
                </tr>
              ) : (
                reglas.map((regla) => (
                  <tr key={regla.id} className={!regla.activa ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4">
                      {categorias.find((c) => c.value === regla.categoria)?.label ||
                        regla.categoria}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        regla.prioridad === 3 ? "bg-red-100 text-red-800" :
                        regla.prioridad === 2 ? "bg-orange-100 text-orange-800" :
                        regla.prioridad === 1 ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {nivelesUrgencia.find(n => n.prioridad === regla.prioridad)?.label || "Media"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {regla.supervisor?.email || "Supervisor eliminado"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          regla.activa
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {regla.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarRegla(regla)}
                          className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleRegla(regla.id, regla.activa)}
                          className={`px-3 py-1 rounded text-sm ${
                            regla.activa
                              ? "bg-yellow-500 text-white hover:bg-yellow-600"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {regla.activa ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => eliminarRegla(regla.id)}
                          className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 text-lg">ℹ️ Información del Sistema</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Puedes crear hasta <strong>4 reglas por categoría</strong> (una por cada nivel de prioridad: BAJA, MEDIA, ALTA, URGENTE)</li>
            <li>• Solo puede haber <strong>una regla activa</strong> por cada combinación de categoría + prioridad</li>
            <li>• Las denuncias se asignan automáticamente según la categoría y nivel de prioridad</li>
            <li>• Ejemplo: Acoso Laboral + URGENTE → Supervisor A, Acoso Laboral + MEDIA → Supervisor B</li>
            <li>• Si no hay regla para un caso específico, se usa balance de carga entre supervisores activos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
