import { createHash } from 'crypto';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const SECRET_SALT = process.env.SIGIL_SECRET_SALT || "clauneck-secret-salt-change-in-production";
function createHashSafely(data) {
  try {
    return createHash("sha256").update(data, "utf8").digest("hex");
  } catch (error) {
    console.error("Hash creation failed:", error);
    throw error;
  }
}
const GET = async () => {
  return new Response(
    JSON.stringify({ status: "ok", message: "Hash API is running" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};
const POST = async ({ request }) => {
  try {
    if (!request) {
      return new Response(
        JSON.stringify({ error: "Request object is missing" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let bodyText;
    try {
      bodyText = await request.text();
    } catch (readError) {
      console.error("Failed to read request body:", readError);
      const errorDetails = readError instanceof Error ? readError.message : String(readError);
      return new Response(
        JSON.stringify({ error: "Failed to read request body", details: errorDetails }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let body;
    try {
      if (!bodyText || bodyText.trim() === "") {
        return new Response(
          JSON.stringify({ error: "Request body is empty" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", details: String(parseError) }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const input = body?.input;
    if (!input || typeof input !== "string" || input.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Invalid input: input is required and must be a non-empty string" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: "Invalid input: input cannot be empty after normalization" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let hash;
    try {
      hash = createHashSafely(normalized + SECRET_SALT);
    } catch (hashError) {
      console.error("Hash creation error:", hashError);
      const errorDetails = hashError instanceof Error ? hashError.message : String(hashError);
      return new Response(
        JSON.stringify({
          error: "Failed to create hash",
          details: errorDetails
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({ hash }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Hash API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : void 0;
    const errorName = error instanceof Error ? error.name : "UnknownError";
    try {
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: errorMessage,
          name: errorName,
          ...errorStack ? { stack: errorStack } : {}
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (responseError) {
      console.error("Failed to create error response:", responseError);
      return new Response(
        JSON.stringify({ error: "Internal server error", message: "Unable to process request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
