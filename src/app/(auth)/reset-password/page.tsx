"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Error al solicitar reinicio");
			setMessage("Si existe una cuenta, se ha enviado un enlace al correo.");
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setMessage(msg || "Error desconocido");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white p-6 rounded shadow">
				<h2 className="text-2xl font-semibold mb-4">Restablecer contraseña</h2>
				{message && <div className="text-sm text-gray-700 mb-2">{message}</div>}
				<form onSubmit={handleSubmit} className="space-y-3">
					<input name="email" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
					<button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">
						{loading ? "Enviando..." : "Enviar enlace"}
					</button>
				</form>
			</div>
		</div>
	);
}
