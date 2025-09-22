import { Hono } from "hono";
import { cors, rateLimit, requestId, timing } from "./middleware/common";
import { health } from "./routes/health";
import { auth } from "./routes/auth";
import { forms } from "./routes/forms";
import { submissions } from "./routes/submissions";
import type { Claims } from "./types";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_ISSUER: string;
  JWT_HS256_SECRET: string;
};

export type Variables = {
  claims: Claims;
  reqId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const allow = [
  "http://localhost:3000",
  "http://localhost:5173", 
  "https://dd30c420.clientportal-3pk.pages.dev"
];

app.use("*", requestId);
app.use("*", timing);
app.use("*", cors(allow));
app.use("*", rateLimit(120, 60));

app.route("/", health);
app.route("/", auth);
app.route("/", forms);
app.route("/", submissions);

export default app;
