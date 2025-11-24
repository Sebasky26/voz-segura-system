import Link from 'next/link';
import { ShieldCheckIcon, LockIcon, MessageSquareIcon, FileTextIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Voz Segura</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Protegemos tu Voz
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma segura de denuncias anónimas que protege tu identidad
            desde el primer momento
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg"
            >
              Crear Denuncia
            </Link>
            <Link
              href="/login"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 font-semibold text-lg"
            >
              Ingresar al Sistema
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <LockIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Anonimato Real</h3>
            <p className="text-gray-600">
              Tu identidad está protegida con códigos anónimos únicos
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <ShieldCheckIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Seguridad Total</h3>
            <p className="text-gray-600">
              Cifrado de extremo a extremo y autenticación robusta
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <MessageSquareIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat en Tiempo Real</h3>
            <p className="text-gray-600">
              Comunícate de forma segura con supervisores
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <FileTextIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Seguimiento</h3>
            <p className="text-gray-600">
              Rastrea el estado de tu denuncia en todo momento
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600">100%</div>
              <div className="text-gray-600 mt-2">Confidencial</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">24/7</div>
              <div className="text-gray-600 mt-2">Disponibilidad</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">Seguro</div>
              <div className="text-gray-600 mt-2">Cifrado bcrypt</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-indigo-600 rounded-lg p-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para alzar tu voz?
          </h3>
          <p className="text-indigo-100 text-lg mb-8">
            Únete a nuestra plataforma y denuncia de forma segura
          </p>
          <Link
            href="/register"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-semibold text-lg inline-block"
          >
            Comenzar Ahora
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Voz Segura - Escuela Politécnica Nacional</p>
            <p className="mt-2 text-sm">Aplicaciones Web Avanzadas - Grupo 7</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
