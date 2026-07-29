import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseActivityWrite } from "@/infrastructure/http/request";
import {
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

interface ActivityCollectionContext {
  params: Promise<{ projectId: string }>;
}

export async function POST(
  request: Request,
  context: ActivityCollectionContext,
): Promise<Response> {
  const parsed = await parseActivityWrite(request);
  if (!parsed.ok) {
    return malformedRequest();
  }

  const { projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().createActivity(Number(projectId), parsed.value),
    201,
  );
}
