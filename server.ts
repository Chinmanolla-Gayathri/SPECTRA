import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "SPECTRA",
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      demo_mode: process.env.DEMO_MODE === "true"
    });
  });

  // Serve demo-app explicitly
  app.get("/demo-app", (req, res) => {
    const demoPath = path.join(__dirname, "demo-app", "index.html");
    if (fs.existsSync(demoPath)) {
      res.sendFile(demoPath);
    } else {
      res.status(404).send("Demo app not found");
    }
  });

  // Mount SPECTRA API
  app.use("/api", apiRouter);

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SPECTRA Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
