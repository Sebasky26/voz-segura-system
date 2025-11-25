"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Edit, Mail, User as UserIcon } from "lucide-react";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  createdAt: string;
}

export default function SupervisoresPage() {
  const router = useRouter();
  const [supervisores, setSupervisores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: "ACTIVO" as "ACTIVO" | "INACTIVO",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.rol !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchSupervisores();
  }, [router]);

  const fetchSupervisores = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/usuarios?rol=SUPERVISOR", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupervisores(data);
      }
    } catch (error) {
      console.error("Error al cargar supervisores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Si estamos editando, llamar handleUpdate en lugar de crear
    if (editingId) {
      await handleUpdate();
      return;
    }

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          rol: "SUPERVISOR",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Supervisor creado exitosamente");
        setFormData({ nombre: "", apellido: "", email: "", password: "", estado: "ACTIVO" });
        setShowForm(false);
        fetchSupervisores();
      } else {
        setError(data.error || "Error al crear supervisor");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Error al conectar con el servidor");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          email: data.email,
          password: "",
          estado: data.estado,
        });
        setEditingId(id);
        setShowForm(true);
      } else {
        setError("Error al cargar datos del supervisor");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Error al conectar con el servidor");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      const token = localStorage.getItem("token");
      
      // Si no hay contraseña, no la enviamos
      const dataToSend: {
        nombre: string;
        apellido: string;
        email: string;
        password?: string;
        estado: "ACTIVO" | "INACTIVO";
      } = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        estado: formData.estado,
      };
      
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      
      const response = await fetch(`/api/usuarios/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess("Supervisor actualizado exitosamente");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          estado: "ACTIVO",
        });
        fetchSupervisores();
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar supervisor");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Error al conectar con el servidor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-emerald-600" />
              <h1 className="text-4xl font-bold text-gray-900">Gestionar Supervisores</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
          <p className="text-gray-600">
            Administra las cuentas de supervisores del sistema
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            {success}
          </div>
        )}

        {/* Botón Nuevo Supervisor */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ nombre: "", apellido: "", email: "", password: "", estado: "ACTIVO" });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Supervisor
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "Editar Supervisor" : "Crear Nuevo Supervisor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="supervisor@vozsegura.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={editingId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Dejar vacío si no desea cambiar la contraseña
                  </p>
                )}
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  {editingId ? "Actualizar Supervisor" : "Crear Supervisor"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ nombre: "", apellido: "", email: "", password: "", estado: "ACTIVO" });
                    setError("");
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Supervisores */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-linear-to-r from-emerald-600 to-emerald-700">
            <h2 className="text-2xl font-bold text-white">
              Supervisores Activos ({supervisores.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {supervisores.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay supervisores registrados
              </div>
            ) : (
              supervisores.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <UserIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {supervisor.nombre} {supervisor.apellido}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Mail className="w-4 h-4" />
                          {supervisor.email}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Registrado: {new Date(supervisor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(supervisor.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar supervisor"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
