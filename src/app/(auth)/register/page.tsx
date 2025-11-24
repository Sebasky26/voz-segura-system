// Archivo: src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({ name: "", email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Error al registrar");
			router.push("/dashboard");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 via-teal-50 to-cyan-100 px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">Voz Segura</h1>
					<p className="text-gray-700 mt-2 font-medium">Crear Nueva Cuenta</p>
				</div>
				
				<div className="bg-white p-8 rounded-lg shadow-lg">
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
							{error}
						</div>
					)}
					
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
							<input 
								name="name" 
								placeholder="Ingresa tu nombre" 
								value={form.name} 
								onChange={handleChange} 
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
							/>
						</div>
						
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
							<input 
								name="email" 
								type="email" 
								placeholder="correo@ejemplo.com" 
								value={form.email} 
								onChange={handleChange} 
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
							/>
						</div>
						
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
							<input 
								name="password" 
								type="password" 
								placeholder="Mínimo 8 caracteres" 
								value={form.password} 
								onChange={handleChange} 
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
							/>
						</div>
						
						<button 
							type="submit" 
							disabled={loading} 
							className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-2.5 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Registrando..." : "Crear Cuenta"}
						</button>
					</form>
					
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							¿Ya tienes cuenta?{" "}
							<a href="/login" className="font-medium text-cyan-700 hover:text-cyan-600 transition-colors">
								Inicia sesión
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
