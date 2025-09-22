import { Hono } from "hono";
import { cors, rateLimit, requestId, timing } from "./middleware/common";
import { health } from "./routes/health";
import { auth } from "./routes/auth";
import { forms } from "./routes/forms";
import { submissions } from "./routes/submissions";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_ISSUER: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const allow = ["http://localhost:5173", "https://6dd9face.clientportal-3pk.pages.dev"];

app.use("*", requestId);
app.use("*", timing);
app.use("*", cors(allow));
app.use("*", rateLimit(120, 60));

app.route("/", health);
app.route("/", auth);
app.route("/", forms);
app.route("/", submissions);

export default app;
