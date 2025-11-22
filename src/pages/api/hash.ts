import type { APIRoute } from 'astro';
import { createHash } from 'crypto';

// Mark as server-rendered endpoint
export const prerender = false;

// Secret salt - in production, use environment variable
const SECRET_SALT = process.env.SIGIL_SECRET_SALT || 'clauneck-secret-salt-change-in-production';

export const POST: APIRoute = async ({ request }): Promise<Response> => {
	try {
		// Check if request has a body
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return new Response(
				JSON.stringify({ error: 'Content-Type must be application/json' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Parse JSON body with error handling
		let body: { input?: string };
		try {
			const text = await request.text();
			if (!text || text.trim() === '') {
				return new Response(
					JSON.stringify({ error: 'Request body is empty' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}
			body = JSON.parse(text);
		} catch (parseError) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const input: string = body.input;

		if (!input || typeof input !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Invalid input' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Normalize input
		const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();

		// Hash with secret salt: sha256(input + secret)
		const hash = createHash('sha256')
			.update(normalized + SECRET_SALT)
			.digest('hex');

		return new Response(
			JSON.stringify({ hash }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Hash API error:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		return new Response(
			JSON.stringify({ 
				error: 'Internal server error',
				details: errorMessage,
				stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

