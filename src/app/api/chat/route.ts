import { NextRequest, NextResponse } from 'next/server';

type Message = {
	id: string;
	mensaje: string;
	usuario: { id: string; nombre: string; apellido: string; rol: string };
	createdAt: string;
};

// Almacenamiento en memoria para desarrollo/local
const MESSAGES: Message[] = [];

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const limit = Number(url.searchParams.get('limit') || '50');

	// Filtrado por sala no implementado (placeholder)
	const data = MESSAGES.slice(-limit);

	return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const mensaje = body.mensaje || '';
		// const sala = body.sala || 'general'; // reservado para filtrado por sala

		const usuario = {
			id: body.usuario?.id || 'anon',
			nombre: body.usuario?.nombre || 'Anonimo',
			apellido: body.usuario?.apellido || '',
			rol: body.usuario?.rol || 'DENUNCIANTE',
		};

		const newMsg: Message = {
			id: `${Date.now()}`,
			mensaje,
			usuario,
			createdAt: new Date().toISOString(),
		};

		MESSAGES.push(newMsg);

		return NextResponse.json({ success: true, data: newMsg });
	} catch (error) {
		console.error('Error en POST /api/chat', error);
		return NextResponse.json({ success: false, message: 'Error procesando mensaje' }, { status: 500 });
	}
}

