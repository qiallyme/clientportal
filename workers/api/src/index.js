import { Hono } from "hono";
import { cors, rateLimit, requestId, timing } from "./middleware/common";
import { health } from "./routes/health";
import { auth } from "./routes/auth";
import { forms } from "./routes/forms";
import { submissions } from "./routes/submissions";
const app = new Hono();
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
