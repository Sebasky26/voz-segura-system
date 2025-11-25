"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
	const [step, setStep] = useState<'verify' | 'reset'>('verify');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [errorField, setErrorField] = useState<string>(""); // Campo con error
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	
	// Formulario de verificación
	const [verifyForm, setVerifyForm] = useState({
		email: "",
		telefono: "",
		nombre: "",
		apellido: "",
	});

	// Formulario de nueva contraseña
	const [resetForm, setResetForm] = useState({
		newPassword: "",
		confirmPassword: "",
	});

	// Validación de contraseña en tiempo real
	const [passwordValidation, setPasswordValidation] = useState({
		minLength: false,
		hasUppercase: false,
		hasLowercase: false,
		hasNumber: false,
		hasSpecial: false,
	});

	const handleVerifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVerifyForm({ ...verifyForm, [e.target.name]: e.target.value });
		setError("");
		setErrorField(""); // Limpiar campo con error
	};

	const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setResetForm({ ...resetForm, [name]: value });
		setError("");

		// Validar contraseña en tiempo real
		if (name === 'newPassword') {
			setPasswordValidation({
				minLength: value.length >= 8,
				hasUppercase: /[A-Z]/.test(value),
				hasLowercase: /[a-z]/.test(value),
				hasNumber: /[0-9]/.test(value),
				hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
			});
		}
	};

	const handleVerifySubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		setErrorField("");

		// Validaciones del lado del cliente
		if (!verifyForm.email || !verifyForm.telefono || !verifyForm.nombre || !verifyForm.apellido) {
			setError("Todos los campos son obligatorios");
			setLoading(false);
			return;
		}

		if (!/^[0-9]{10}$/.test(verifyForm.telefono)) {
			setError("El teléfono debe tener exactamente 10 dígitos");
			setErrorField("telefono");
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "verify",
					...verifyForm,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				// Establecer el campo con error si viene del servidor
				if (data.campo) {
					setErrorField(data.campo);
				}
				throw new Error(data.message || "Error al verificar información");
			}

			setSuccess("¡Verificación exitosa! Ahora puedes cambiar tu contraseña.");
			setStep('reset');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(msg || "Error al verificar la información");
		} finally {
			setLoading(false);
		}
	};

	const handleResetSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		// Validaciones del lado del cliente
		const allValid = Object.values(passwordValidation).every(v => v);
		if (!allValid) {
			setError("La contraseña no cumple con todos los requisitos");
			setLoading(false);
			return;
		}

		if (resetForm.newPassword !== resetForm.confirmPassword) {
			setError("Las contraseñas no coinciden");
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reset",
					email: verifyForm.email,
					newPassword: resetForm.newPassword,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Error al cambiar contraseña");
			}

			setSuccess("¡Contraseña cambiada exitosamente! Redirigiendo al login...");
			setTimeout(() => {
				window.location.href = "/login";
			}, 2000);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(msg || "Error al cambiar la contraseña");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
						<ShieldCheck className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Restablecer Contraseña</h1>
					<p className="text-gray-600">
						{step === 'verify' 
							? 'Verifica tu identidad con los datos de tu cuenta'
							: 'Ingresa tu nueva contraseña'}
					</p>
				</div>

				{/* Indicador de pasos */}
				<div className="flex items-center justify-center mb-8">
					<div className="flex items-center">
						<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
							step === 'verify' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'
						}`}>
							{step === 'verify' ? '1' : '✓'}
						</div>
						<div className={`w-20 h-1 ${step === 'reset' ? 'bg-indigo-600' : 'bg-gray-300'}`} />
						<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
							step === 'reset' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
						}`}>
							2
						</div>
					</div>
				</div>

				{/* Card */}
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Mensajes de error general (solo si no hay campo específico con error) */}
					{error && !errorField && (
						<div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
							<div className="flex items-start">
								<AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
								<div>
									<p className="font-semibold text-red-800 text-sm">Error</p>
									<p className="text-red-700 text-sm mt-1">{error}</p>
								</div>
							</div>
						</div>
					)}

					{success && (
						<div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
							<div className="flex items-start">
								<CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 shrink-0" />
								<div>
									<p className="font-semibold text-green-800 text-sm">¡Éxito!</p>
									<p className="text-green-700 text-sm mt-1">{success}</p>
								</div>
							</div>
						</div>
					)}

					{/* Paso 1: Verificación */}
					{step === 'verify' && (
						<form onSubmit={handleVerifySubmit} className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Correo Electrónico *
								</label>
								<input
									type="email"
									name="email"
									value={verifyForm.email}
									onChange={handleVerifyChange}
									placeholder="ejemplo@correo.com"
									required
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
										errorField === 'email' 
											? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
											: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
									}`}
								/>
								{errorField === 'email' && (
									<p className="text-xs text-red-600 mt-1 flex items-center">
										<AlertCircle className="w-3 h-3 mr-1" />
										{error}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Teléfono (10 dígitos) *
								</label>
								<input
									type="tel"
									name="telefono"
									value={verifyForm.telefono}
									onChange={handleVerifyChange}
									placeholder="0987654321"
									required
									maxLength={10}
									pattern="[0-9]{10}"
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
										errorField === 'telefono' 
											? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
											: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
									}`}
								/>
								{errorField === 'telefono' ? (
									<p className="text-xs text-red-600 mt-1 flex items-center">
										<AlertCircle className="w-3 h-3 mr-1" />
										{error}
									</p>
								) : (
									<p className="text-xs text-gray-500 mt-1">Ingresa el número registrado en tu cuenta</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Nombre *
									</label>
									<input
										type="text"
										name="nombre"
										value={verifyForm.nombre}
										onChange={handleVerifyChange}
										placeholder="Juan"
										required
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
											errorField === 'nombre' 
												? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
												: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
										}`}
									/>
									{errorField === 'nombre' && (
										<p className="text-xs text-red-600 mt-1 flex items-center">
											<AlertCircle className="w-3 h-3 mr-1" />
											{error}
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Apellido *
									</label>
									<input
										type="text"
										name="apellido"
										value={verifyForm.apellido}
										onChange={handleVerifyChange}
										placeholder="Pérez"
										required
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
											errorField === 'apellido' 
												? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
												: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
										}`}
									/>
									{errorField === 'apellido' && (
										<p className="text-xs text-red-600 mt-1 flex items-center">
											<AlertCircle className="w-3 h-3 mr-1" />
											{error}
										</p>
									)}
								</div>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? "Verificando..." : "Verificar Identidad"}
							</button>
						</form>
					)}

					{/* Paso 2: Cambiar Contraseña */}
					{step === 'reset' && (
						<form onSubmit={handleResetSubmit} className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Nueva Contraseña *
								</label>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										name="newPassword"
										value={resetForm.newPassword}
										onChange={handleResetChange}
										placeholder="Ingresa tu nueva contraseña"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-12"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>

								{/* Indicadores de validación */}
								<div className="mt-3 space-y-1.5">
									<div className="flex items-center text-xs">
										<span className={`mr-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
											{passwordValidation.minLength ? '✓' : '○'}
										</span>
										<span className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-600'}>
											Mínimo 8 caracteres
										</span>
									</div>
									<div className="flex items-center text-xs">
										<span className={`mr-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
											{passwordValidation.hasUppercase ? '✓' : '○'}
										</span>
										<span className={passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-600'}>
											Al menos una mayúscula
										</span>
									</div>
									<div className="flex items-center text-xs">
										<span className={`mr-2 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
											{passwordValidation.hasLowercase ? '✓' : '○'}
										</span>
										<span className={passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-600'}>
											Al menos una minúscula
										</span>
									</div>
									<div className="flex items-center text-xs">
										<span className={`mr-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
											{passwordValidation.hasNumber ? '✓' : '○'}
										</span>
										<span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-600'}>
											Al menos un número
										</span>
									</div>
									<div className="flex items-center text-xs">
										<span className={`mr-2 ${passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
											{passwordValidation.hasSpecial ? '✓' : '○'}
										</span>
										<span className={passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-600'}>
											Al menos un carácter especial (!@#$%^&*)
										</span>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Confirmar Nueva Contraseña *
								</label>
								<div className="relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										name="confirmPassword"
										value={resetForm.confirmPassword}
										onChange={handleResetChange}
										placeholder="Confirma tu nueva contraseña"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-12"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
								{resetForm.confirmPassword && (
									<p className={`text-xs mt-1 ${
										resetForm.newPassword === resetForm.confirmPassword 
											? 'text-green-600' 
											: 'text-red-600'
									}`}>
										{resetForm.newPassword === resetForm.confirmPassword 
											? '✓ Las contraseñas coinciden' 
											: '✗ Las contraseñas no coinciden'}
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
							</button>
						</form>
					)}

					{/* Link de regreso */}
					<div className="mt-6 text-center">
						<Link 
							href="/login" 
							className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
						>
							← Volver al inicio de sesión
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
