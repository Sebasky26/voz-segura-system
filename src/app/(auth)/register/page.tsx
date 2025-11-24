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
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white p-6 rounded shadow">
				<h2 className="text-2xl font-semibold mb-4">Crear cuenta</h2>
				{error && <div className="text-sm text-red-600 mb-2">{error}</div>}
				<form onSubmit={handleSubmit} className="space-y-3">
					<input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
					<input name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
					<input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
					<button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">
						{loading ? "Registrando..." : "Registrar"}
					</button>
				</form>
			</div>
		</div>
	);
}
