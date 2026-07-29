import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseProjectWrite } from "@/infrastructure/http/request";
import {
  applicationResultResponse,
  jsonSuccess,
  malformedRequest,
  notFound,
} from "@/infrastructure/http/response";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

async function projectId(context: ProjectRouteContext): Promise<number> {
  return Number((await context.params).projectId);
}

export async function GET(
  _request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const analysis = await getEvmUseCases().getProjectAnalysis(
    await projectId(context),
  );

  return analysis === null ? notFound() : jsonSuccess(analysis, 200);
}

export async function PUT(
  request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const parsed = await parseProjectWrite(request);
  if (!parsed.ok) {
    return malformedRequest();
  }

  return applicationResultResponse(
    await getEvmUseCases().replaceProject(
      await projectId(context),
      parsed.value,
    ),
    200,
  );
}

export async function DELETE(
  _request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  return applicationResultResponse(
    await getEvmUseCases().deleteProject(await projectId(context)),
    204,
  );
}
