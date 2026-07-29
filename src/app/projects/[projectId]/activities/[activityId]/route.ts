import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseActivityWrite } from "@/infrastructure/http/request";
import {
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

interface ActivityRouteContext {
  params: Promise<{ activityId: string; projectId: string }>;
}

export async function PUT(
  request: Request,
  context: ActivityRouteContext,
): Promise<Response> {
  const parsed = await parseActivityWrite(request);
  if (!parsed.ok) {
    return malformedRequest();
  }

  const { activityId, projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().replaceActivity(
      Number(projectId),
      Number(activityId),
      parsed.value,
    ),
    200,
  );
}

export async function DELETE(
  _request: Request,
  context: ActivityRouteContext,
): Promise<Response> {
  const { activityId, projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().deleteActivity(
      Number(projectId),
      Number(activityId),
    ),
    204,
  );
}
