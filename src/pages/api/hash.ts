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
	// Ensure we always return a valid Response, even if something crashes
	try {
		// Validate request exists
		if (!request) {
			return new Response(
				JSON.stringify({ error: 'Request object is missing' }),
				{ 
					status: 400, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

		// Read request body as text first (more reliable in serverless)
		let bodyText: string;
		try {
			bodyText = await request.text();
		} catch (readError) {
			console.error('Failed to read request body:', readError);
			const errorDetails = readError instanceof Error ? readError.message : String(readError);
			return new Response(
				JSON.stringify({ error: 'Failed to read request body', details: errorDetails }),
				{ 
					status: 400, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

		// Parse JSON body
		let body: { input?: string };
		try {
			if (!bodyText || bodyText.trim() === '') {
				return new Response(
					JSON.stringify({ error: 'Request body is empty' }),
					{ 
						status: 400, 
						headers: { 'Content-Type': 'application/json' } 
					}
				);
			}
			body = JSON.parse(bodyText);
		} catch (parseError) {
			console.error('JSON parse error:', parseError);
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body', details: String(parseError) }),
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
		let hash: string;
		try {
			hash = createHash('sha256')
				.update(normalized + SECRET_SALT)
				.digest('hex');
		} catch (hashError) {
			console.error('Hash creation error:', hashError);
			return new Response(
				JSON.stringify({ 
					error: 'Failed to create hash', 
					details: String(hashError) 
				}),
				{ 
					status: 500, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}

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
		const errorName = error instanceof Error ? error.name : 'UnknownError';
		
		// Always return valid JSON, even on error
		try {
			return new Response(
				JSON.stringify({ 
					error: 'Internal server error',
					message: errorMessage,
					name: errorName,
					...(errorStack ? { stack: errorStack } : {})
				}),
				{ 
					status: 500, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		} catch (responseError) {
			// If even creating the response fails, log and return minimal response
			console.error('Failed to create error response:', responseError);
			return new Response(
				JSON.stringify({ error: 'Internal server error', message: 'Unable to process request' }),
				{ 
					status: 500, 
					headers: { 'Content-Type': 'application/json' } 
				}
			);
		}
	}
};

