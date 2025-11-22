import { createHash } from 'node:crypto';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const SECRET_SALT = process.env.SIGIL_SECRET_SALT || "clauneck-secret-salt-change-in-production";
const POST = async ({ request }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const input = body.input;
    if (!input || typeof input !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
    if (!SECRET_SALT || SECRET_SALT.trim() === "") {
      throw new Error("SECRET_SALT is not configured");
    }
    const hash = createHash("sha256").update(normalized + SECRET_SALT).digest("hex");
    return new Response(
      JSON.stringify({ hash }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Hash API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : void 0;
    return new Response(
      JSON.stringify({
        error: "A server error has occurred",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : void 0
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
