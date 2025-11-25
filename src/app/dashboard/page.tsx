"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare, FileText, Plus, BarChart3, ShieldCheck, Users } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<{ rol: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Control</h1>
          <p className="text-gray-600">
            {user?.rol === "ADMIN"
              ? "Gestiona denuncias, supervisores y visualiza logs del sistema"
              : user?.rol === "SUPERVISOR"
              ? "Gestiona las denuncias asignadas y comunícate con denunciantes"
              : "Crea denuncias anónimas y comunícate de forma segura"}
          </p>
        </div>

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Chat (solo para SUPERVISOR y DENUNCIANTE, no para ADMIN) */}
          {user?.rol !== "ADMIN" && (
            <Link
              href="/dashboard/chat"
              className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 transition-colors">
                  <MessageSquare className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat</h2>
              <p className="text-gray-600 text-sm">
                {user?.rol === "SUPERVISOR"
                  ? "Accede al chat desde las denuncias asignadas"
                  : "Chatea de forma segura con el supervisor asignado"}
              </p>
            </Link>
          )}

          {/* Denuncias */}
          <Link
            href="/dashboard/denuncias"
            className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-600 transition-colors">
                <FileText className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.rol === "ADMIN" || user?.rol === "SUPERVISOR" ? "Denuncias" : "Mis Denuncias"}
            </h2>
            <p className="text-gray-600 text-sm">
              {user?.rol === "ADMIN"
                ? "Visualiza y supervisa todas las denuncias del sistema"
                : user?.rol === "SUPERVISOR"
                ? "Gestiona las denuncias asignadas y responde consultas"
                : "Consulta el estado de tus denuncias"}
            </p>
          </Link>

          {/* Crear Denuncia (solo para usuarios normales) */}
          {user?.rol !== "ADMIN" && user?.rol !== "SUPERVISOR" && (
            <Link
              href="/dashboard/denuncias/crear"
              className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-600 transition-colors">
                  <Plus className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva Denuncia</h2>
              <p className="text-gray-600 text-sm">
                Crea una nueva denuncia anónima de forma segura
              </p>
            </Link>
          )}
          
          {/* Gestionar Supervisores (solo para ADMIN) */}
          {user?.rol === "ADMIN" && (
            <Link
              href="/dashboard/supervisores"
              className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-600 transition-colors">
                  <Users className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Supervisores</h2>
              <p className="text-gray-600 text-sm">
                Administra las cuentas de supervisores del sistema
              </p>
            </Link>
          )}
          
          {/* Auditoría del Sistema (solo para Admin) */}
          {user?.rol === "ADMIN" && (
            <Link
              href="/dashboard/auditoria"
              className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-600 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Auditoría</h2>
              <p className="text-gray-600 text-sm">
                Visualiza logs e interacciones del sistema
              </p>
            </Link>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 font-medium">Información importante</p>
              <p className="text-sm text-blue-700 mt-1">
                Tu identidad está protegida en todo momento. Todas las comunicaciones
                son cifradas y tus datos personales nunca son revelados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
