import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const runtime = "nodejs";

const swaggerRoot = resolve(process.cwd(), "node_modules/swagger-ui-dist");
const assets: Readonly<Record<string, string>> = {
  "swagger-ui.css": "text/css; charset=utf-8",
  "swagger-ui-bundle.js": "text/javascript; charset=utf-8",
  "swagger-ui-standalone-preset.js": "text/javascript; charset=utf-8",
};

interface AssetContext {
  params: Promise<{ asset: string }>;
}

export async function GET(
  _request: Request,
  context: AssetContext,
): Promise<Response> {
  const { asset } = await context.params;
  const contentType = assets[asset];
  if (contentType === undefined) {
    return new Response(null, { status: 404 });
  }

  const content = await readFile(join(swaggerRoot, asset));
  return new Response(content, {
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-type": contentType,
    },
  });
}
