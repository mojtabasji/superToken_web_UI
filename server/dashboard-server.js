/* Simple standalone SuperTokens Dashboard server (Express) */
const fs = require("fs");
const path = require("path");
// Load env from .env.local if present
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
  } else {
    require("dotenv").config();
  }
} catch {}

// Basic hardening: log unexpected errors and keep process alive when reasonable
process.on("unhandledRejection", (reason) => {
  console.error("[dashboard-server] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[dashboard-server] Uncaught exception:", err);
});

// Optional: relax TLS for Core in dev when using self-signed certs
try {
  if (String(process.env.CORE_INSECURE_TLS).toLowerCase() === "true") {
    const undici = require("undici");
    const agent = new undici.Agent({ connect: { rejectUnauthorized: false } });
    undici.setGlobalDispatcher(agent);
    console.warn("[dashboard-server] CORE_INSECURE_TLS=true — TLS verification disabled for Core calls (DEV ONLY)");
  }
} catch (e) {
  console.warn("[dashboard-server] Unable to set insecure TLS agent:", e);
}

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const SuperTokens = require("supertokens-node");
const { middleware, errorHandler } = require("supertokens-node/framework/express");
const Dashboard = require("supertokens-node/recipe/dashboard");
const Passwordless = require("supertokens-node/recipe/passwordless");
const Session = require("supertokens-node/recipe/session");
const UserRoles = require("supertokens-node/recipe/userroles");

const CORE_URL = process.env.CORE_URL;
const CORE_API_KEY = process.env.CORE_API_KEY || undefined;
const DASHBOARD_PORT = parseInt(process.env.DASHBOARD_PORT || "3434", 10);
const DASHBOARD_API_KEY = process.env.DASHBOARD_API_KEY || "change-me-dashboard";
const SMS_API_URL = process.env.SMS_API_URL || "http://sms.bytecraft.ir";
const SMS_API_TOKEN = process.env.SMS_API_TOKEN || process.env.SMS_API_KEY || "";
const SMS_SENDER = process.env.SMS_SENDER || "SuperTokens";

if (!CORE_URL) {
  console.error("[dashboard-server] Missing CORE_URL env var. Set it in .env.local");
  process.exit(1);
}

SuperTokens.init({
  framework: "express",
  supertokens: {
    connectionURI: CORE_URL,
    apiKey: CORE_API_KEY,
  },
  appInfo: {
    appName: "SuperTokens Admin Dashboard",
    apiDomain: `http://localhost:${DASHBOARD_PORT}`,
    websiteDomain: `http://localhost:${DASHBOARD_PORT}`,
    apiBasePath: "/auth",
    websiteBasePath: "/dashboard",
  },
  recipeList: [
    // Session is required for dashboard features that inspect sessions
    Session.init(),
    // Enable roles/permissions management
    UserRoles.init(),
    // Enable passwordless (PHONE only) and wire a custom SMS sender via HTTP POST
    Passwordless.init({
      contactMethod: "PHONE",
      flowType: "USER_INPUT_CODE",
      override: {
        functions: (original) => ({
          ...original,
          // This will run for both regular FDI flows and the Dashboard's user creation flow
          async consumeCode(input) {
            try {
              console.log("[passwordless.consumeCode] start", {
                tenantId: input.tenantId,
                preAuthSessionId: input.preAuthSessionId,
                deviceId: input.deviceId,
                hasUserInputCode: !!input.userInputCode,
              });
            } catch {}
            const res = await original.consumeCode(input);
            try {
              if (res.status === "OK") {
                console.log("[passwordless.consumeCode] success", {
                  createdNewUser: res.createdNewUser,
                  userId: res.user.id,
                  tenantId: input.tenantId,
                });
                // Example: you can assign default roles, sync profile, etc. here
                // if (process.env.DEFAULT_ROLE) {
                //   await UserRoles.addRoleToUser(res.user.id, process.env.DEFAULT_ROLE);
                // }
              } else {
                console.warn("[passwordless.consumeCode] result", res.status);
              }
            } catch (err) {
              console.error("[passwordless.consumeCode] post-consume hook error", err);
            }
            return res;
          },
        }),
      },
      smsDelivery: {
        service: {
          // input includes phoneNumber, userInputCode, urlWithLinkCode, codeLifetime, tenantId
          sendSms: async (input) => {
            try {
              const phone = input.phoneNumber;
              const code = input.userInputCode;
              const mins = Math.max(1, Math.round((input.codeLifetime || 300000) / 60000));
              const message = code
                ? `Your verification code is ${code}. It expires in ${mins} minute${mins > 1 ? "s" : ""}.`
                : `Open this link to verify: ${input.urlWithLinkCode}`;

              if (!SMS_API_URL) {
                console.warn("[dashboard-server] SMS_API_URL not set. Printing SMS to console:", { phone, message });
                return;
              }

              const headers = { "Content-Type": "application/json" };
              if (SMS_API_TOKEN) {
                // Common pattern; adjust if your service expects a different header
                headers["Authorization"] = `Bearer ${SMS_API_TOKEN}`;
              }

              const body = { phone: phone, message: message, sender: SMS_SENDER };

              const resp = await fetch(SMS_API_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
              });
              if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                console.error("[dashboard-server] SMS send failed", resp.status, text);
              } else {
                console.log("[dashboard-server] SMS sent", { phone });
              }
            } catch (err) {
              console.error("[dashboard-server] SMS send error", err);
            }
          },
        },
      },
    }),
    Dashboard.init({
      // Protect dashboard with an API key
      apiKey: DASHBOARD_API_KEY,
    }),
  ],
});

const app = express();
app.use(
  cors({
    origin: `http://localhost:${DASHBOARD_PORT}`,
    allowedHeaders: ["content-type", ...SuperTokens.getAllCORSHeaders()],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Convenience redirects: map /dashboard[/*] -> /auth/dashboard[/*]
app.use((req, res, next) => {
  if (req.path === "/dashboard" || req.path.startsWith("/dashboard/")) {
    const rest = req.path.length > "/dashboard".length ? req.path.slice("/dashboard".length) : "";
    return res.redirect(302, `/auth/dashboard${rest}`);
  }
  return next();
});

// SuperTokens routes and error handler
app.use(middleware());
app.use(errorHandler());

try {
  const server = app.listen(DASHBOARD_PORT, () => {
    console.log(`[dashboard-server] PID ${process.pid}`);
    console.log(`SuperTokens Dashboard running at:`);
    console.log(`  - http://localhost:${DASHBOARD_PORT}/auth/dashboard (actual mounted path)`);
    console.log(`  - http://localhost:${DASHBOARD_PORT}/dashboard (redirects to the above)`);
  });
  server.on("error", (err) => {
    if (err && (err.code === "EADDRINUSE" || err.code === "EACCES")) {
      console.error(`[dashboard-server] Port ${DASHBOARD_PORT} unavailable (${err.code}). Set DASHBOARD_PORT in .env.local to a free port and restart.`);
      process.exit(1);
    }
    console.error(`[dashboard-server] Server error:`, err);
  });
  // Optional lightweight heartbeat log every 5 minutes (disabled)
  setInterval(() => { /* noop */ }, 300000);
} catch (err) {
  console.error(`[dashboard-server] Fatal error during start:`, err);
  process.exit(1);
}
