export const runtime = "nodejs";

const swaggerDocument = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API EVM</title>
    <link rel="stylesheet" href="/api-docs/assets/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api-docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api-docs/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>
`;

export function GET(): Response {
  return new Response(swaggerDocument, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
