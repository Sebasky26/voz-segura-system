"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Obtener datos del usuario del localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Voz Segura</h1>
                <p className="text-xs text-gray-500">Sistema de Denuncias Anónimas</p>
              </div>
            </div>

            {/* Usuario y cerrar sesión */}
            {user && (
              <div className="flex items-center space-x-4">
                {/* Información del usuario */}
                <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-2 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      ¡Bienvenido!
                    </p>
                    <p className="text-xs text-gray-600">
                      {user.rol === "ADMIN"
                        ? "Administrador"
                        : user.rol === "SUPERVISOR"
                        ? "Supervisor"
                        : "Usuario"}
                    </p>
                  </div>
                </div>

                {/* Botón de cerrar sesión */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main>{children}</main>
    </div>
  );
}
