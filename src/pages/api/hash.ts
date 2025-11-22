import type { APIRoute } from 'astro';
import { createHash } from 'crypto';

// Mark as server-rendered endpoint
export const prerender = false;

// Secret salt - in production, use environment variable
const SECRET_SALT = process.env.SIGIL_SECRET_SALT || 'clauneck-secret-salt-change-in-production';

// Health check endpoint
export const GET: APIRoute = async (): Promise<Response> => {
	return new Response(
		JSON.stringify({ status: 'ok', message: 'Hash API is running' }),
		{ 
			status: 200, 
			headers: { 'Content-Type': 'application/json' } 
		}
	);
};

export const POST: APIRoute = async ({ request }): Promise<Response> => {
	try {
		// Parse JSON body - Astro handles this more safely
		let body: { input?: string };
		try {
			body = await request.json();
		} catch (parseError) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body' }),
				{ 
					status: 400, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

		const input: string | undefined = body?.input;

		if (!input || typeof input !== 'string' || input.trim() === '') {
			return new Response(
				JSON.stringify({ error: 'Invalid input: input is required and must be a non-empty string' }),
				{ 
					status: 400, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

		// Normalize input
		const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();

		if (!normalized) {
			return new Response(
				JSON.stringify({ error: 'Invalid input: input cannot be empty after normalization' }),
				{ 
					status: 400, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

		// Hash with secret salt: sha256(input + secret)
		const hash = createHash('sha256')
			.update(normalized + SECRET_SALT)
			.digest('hex');

		return new Response(
			JSON.stringify({ hash }),
			{ 
				status: 200, 
				headers: { 
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache, no-store, must-revalidate'
				} 
			}
		);
	} catch (error) {
		console.error('Hash API error:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		return new Response(
			JSON.stringify({ 
				error: 'Internal server error',
				message: errorMessage,
				...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {})
			}),
			{ 
				status: 500, 
				headers: { 'Content-Type': 'application/json' } 
			}
		);
	}
};

