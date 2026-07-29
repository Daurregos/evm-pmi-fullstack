import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseProjectWrite } from "@/infrastructure/http/request";
import {
  jsonSuccess,
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

export async function GET(): Promise<Response> {
  return jsonSuccess(await getEvmUseCases().listProjects(), 200);
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseProjectWrite(request);
  if (!parsed.ok) {
    return malformedRequest();
  }

  return useCaseResponse(
    await getEvmUseCases().createProject(parsed.value),
    201,
  );
}
