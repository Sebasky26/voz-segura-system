// Archivo: src/app/dashboard/chat/page.tsx
// Descripción: Página informativa del chat - redirige a denuncias
// El chat funcional está en /dashboard/denuncias/[id]/chat

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareIcon, ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();

  // Redirigir automáticamente a denuncias después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/denuncias');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Volver al Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <MessageSquareIcon className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chat Anónimo por Denuncia
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            El chat está disponible dentro de cada denuncia individual.
          </p>
          
          <div className="bg-indigo-50 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-indigo-900 mb-3">Cómo acceder al chat:</h2>
            <ol className="text-left text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="font-bold text-indigo-600 mr-2">1.</span>
                <span>Ve a la sección de Denuncias</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-indigo-600 mr-2">2.</span>
                <span>Selecciona una denuncia específica</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-indigo-600 mr-2">3.</span>
                <span>Haz clic en el botón "Chat Anónimo" (solo si hay supervisor asignado)</span>
              </li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Redirigiendo a Denuncias en 3 segundos...
          </p>

          <button
            onClick={() => router.push('/dashboard/denuncias')}
            className="inline-flex items-center px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
          >
            <MessageSquareIcon className="w-5 h-5 mr-2" />
            Ir a Denuncias Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
