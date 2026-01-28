'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Redirigir al login después de montar
    router.push('/login');
  }, [router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🛡️ Voz Segura</h1>
          <p className="text-xl mb-8">Sistema de Denuncias Anónimas</p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🛡️ Voz Segura</h1>
        <p className="text-xl mb-8">Sistema de Denuncias Anónimas</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4">Redirigiendo...</p>
      </div>
    </div>
  );
}
