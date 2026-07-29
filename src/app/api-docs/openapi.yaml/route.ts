import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contractPath = resolve(process.cwd(), "contracts/evm/openapi.yaml");

export async function GET(): Promise<Response> {
  const contract = await readFile(contractPath, "utf8");
  return new Response(contract, {
    headers: {
      "cache-control": "no-store",
      "content-type":
        "application/vnd.oai.openapi;version=3.1.0;charset=utf-8",
    },
  });
}
