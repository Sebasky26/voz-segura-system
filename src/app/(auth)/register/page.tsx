// Archivo: src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({ 
		email: "", 
		password: "", 
		confirmPassword: "",
		nombre: "",
		apellido: "",
		telefono: ""
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		// Validaciones del lado del cliente
		if (form.password !== form.confirmPassword) {
			setError("Las contraseñas no coinciden");
			setLoading(false);
			return;
		}

		if (form.password.length < 8) {
			setError("La contraseña debe tener al menos 8 caracteres");
			setLoading(false);
			return;
		}

		if (!/[A-Z]/.test(form.password)) {
			setError("La contraseña debe incluir al menos una letra MAYÚSCULA");
			setLoading(false);
			return;
		}

		if (!/[a-z]/.test(form.password)) {
			setError("La contraseña debe incluir al menos una letra minúscula");
			setLoading(false);
			return;
		}

		if (!/[0-9]/.test(form.password)) {
			setError("La contraseña debe incluir al menos un número");
			setLoading(false);
			return;
		}

		if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
			setError("La contraseña debe incluir al menos un carácter especial (!@#$%^&*...)");
			setLoading(false);
			return;
		}

		if (form.telefono && !/^[0-9]{10}$/.test(form.telefono)) {
			setError("El teléfono debe tener exactamente 10 dígitos");
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			
			if (!res.ok) {
				// Mostrar errores específicos del servidor
				if (data.errors) {
					const errorMessages = Object.entries(data.errors)
						.map(([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`)
						.join(" | ");
					throw new Error(errorMessages);
				}
				throw new Error(data.message || "Error al registrar usuario");
			}
			
			router.push("/login");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message || "Error desconocido al registrar");
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
						<div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
							<div className="flex items-start">
								<svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
								</svg>
								<div>
									<p className="font-semibold text-red-800 text-sm">Error al registrar</p>
									<p className="text-red-700 text-sm mt-1">{error}</p>
								</div>
							</div>
						</div>
					)}
					
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
								<input 
									name="nombre" 
									placeholder="Tu nombre" 
									value={form.nombre} 
									onChange={handleChange} 
									className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
								<input 
									name="apellido" 
									placeholder="Tu apellido" 
									value={form.apellido} 
									onChange={handleChange} 
									className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
								/>
							</div>
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
							<label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (opcional)</label>
							<input 
								name="telefono" 
								type="tel" 
								placeholder="0999999999" 
								value={form.telefono} 
								onChange={handleChange} 
								maxLength={10}
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
							/>
						</div>
						
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
							<input 
								name="password" 
								type="password" 
								placeholder="Ej: MiClave123!" 
								value={form.password} 
								onChange={handleChange} 
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" 
							/>
							<div className="mt-2 space-y-1">
								<p className="text-xs font-medium text-gray-600">Tu contraseña debe cumplir:</p>
								<ul className="text-xs text-gray-500 space-y-0.5 ml-4">
									<li className="flex items-center">
										<span className={`mr-2 ${form.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
											{form.password.length >= 8 ? '✓' : '○'}
										</span>
										Mínimo 8 caracteres
									</li>
									<li className="flex items-center">
										<span className={`mr-2 ${/[A-Z]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>
											{/[A-Z]/.test(form.password) ? '✓' : '○'}
										</span>
										Una letra MAYÚSCULA
									</li>
									<li className="flex items-center">
										<span className={`mr-2 ${/[a-z]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>
											{/[a-z]/.test(form.password) ? '✓' : '○'}
										</span>
										Una letra minúscula
									</li>
									<li className="flex items-center">
										<span className={`mr-2 ${/[0-9]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>
											{/[0-9]/.test(form.password) ? '✓' : '○'}
										</span>
										Un número
									</li>
									<li className="flex items-center">
										<span className={`mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>
											{/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? '✓' : '○'}
										</span>
										Un carácter especial (!@#$%...)
									</li>
								</ul>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</label>
							<input 
								name="confirmPassword" 
								type="password" 
								placeholder="Repite tu contraseña" 
								value={form.confirmPassword} 
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
