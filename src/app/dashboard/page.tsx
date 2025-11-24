import Link from 'next/link';

export default function DashboardPage() {
	return (
		<div className="min-h-screen p-8">
			<h1 className="text-3xl font-bold mb-4">Dashboard</h1>
			<p className="text-gray-600 mb-6">Bienvenido al panel de administración.</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
				<Link href="/dashboard/chat" className="p-6 bg-white rounded shadow hover:shadow-md">
					<h2 className="text-xl font-semibold">Chat</h2>
					<p className="text-sm text-gray-500 mt-2">Comunicación en tiempo real</p>
				</Link>

				<Link href="/dashboard/denuncias" className="p-6 bg-white rounded shadow hover:shadow-md">
					<h2 className="text-xl font-semibold">Denuncias</h2>
					<p className="text-sm text-gray-500 mt-2">Gestión y seguimiento de denuncias</p>
				</Link>
			</div>
		</div>
	);
}
