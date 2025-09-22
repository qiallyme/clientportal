export const requestId = async (c, next) => {
    const id = crypto.randomUUID();
    c.set("reqId", id);
    await next();
    c.res.headers.set("x-request-id", id);
};
export const timing = async (c, next) => {
    const t0 = Date.now();
    await next();
    c.res.headers.set("x-runtime-ms", String(Date.now() - t0));
};
export const cors = (origins) => {
    return async (c, next) => {
        const origin = c.req.header("origin") ?? "";
        if (origins.includes(origin)) {
            c.header("access-control-allow-origin", origin);
            c.header("vary", "origin");
            c.header("access-control-allow-headers", "authorization,content-type");
            c.header("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
        }
        if (c.req.method === "OPTIONS")
            return new Response(null, { status: 204 });
        await next();
    };
};
// naive in-memory limiter per request scope (Durable recommended for prod)
const hits = new Map();
export const rateLimit = (limit = 60, windowSec = 60) => {
    return async (c, next) => {
        const ip = c.req.header("cf-connecting-ip") ?? "0";
        const now = Math.floor(Date.now() / 1000);
        const key = `${ip}:${now}`;
        const rec = hits.get(key) ?? { n: 0, ts: now };
        rec.n++;
        hits.set(key, rec);
        if (rec.n > limit)
            return c.text("Too Many Requests", 429);
        await next();
    };
};
