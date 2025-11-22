import type { APIRoute } from 'astro';

// Mark as server-rendered endpoint
export const prerender = false;

// Secret salt - in production, use environment variable
const SECRET_SALT = process.env.SIGIL_SECRET_SALT || 'clauneck-secret-salt-change-in-production';

// Helper function to hash using Web Crypto API (available in Node.js 15+)
async function sha256Hash(text: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	// crypto.subtle is available globally in Node.js 15+
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: APIRoute = async ({ request }): Promise<Response> => {
	try {
		// Parse JSON body directly (Astro handles this reliably)
		let body: { input?: string };
		try {
			body = await request.json();
		} catch (parseError) {
			return new Response(
				JSON.stringify({ error: 'Invalid JSON in request body' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const input = body.input;

		if (!input || typeof input !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Invalid input' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Normalize input
		const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();

		// Ensure SECRET_SALT is defined (check for both undefined and empty string)
		if (!SECRET_SALT || SECRET_SALT.trim() === '') {
			throw new Error('SECRET_SALT is not configured');
		}

		// Hash with secret salt: sha256(input + secret) using Web Crypto API
		const hash = await sha256Hash(normalized + SECRET_SALT);

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
				error: 'A server error has occurred',
				details: errorMessage,
				stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

