import { NextRequest, NextResponse } from 'next/server';

// Minimal handler to satisfy Next.js types while socket server is handled elsewhere
export async function GET(_request: NextRequest) {
	const ua = _request.headers.get('user-agent') || null;
	return NextResponse.json({ success: true, message: 'Socket endpoint (placeholder)', ua });
}

export async function POST(_request: NextRequest) {
	const ua = _request.headers.get('user-agent') || null;
	return NextResponse.json({ success: true, message: 'Socket POST placeholder', ua });
}
