import { Router, Request, Response } from "express";
import openApiSpec from "../docs/openapi.json";

export const docsRouter = Router();

docsRouter.get("/openapi.json", (_req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
});

docsRouter.get("/", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stellar-Guard API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
    .topbar { display: none; }
    .swagger-ui { background: #0f172a; color: #f8fafc; }
    .swagger-ui .info .title { color: #38bdf8; }
    .swagger-ui .scheme-container { background: #1e293b; box-shadow: none; border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});
