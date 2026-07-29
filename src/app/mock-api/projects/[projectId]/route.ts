import {
  jsonMockResponse,
  selectProjectResponse,
} from "@/infrastructure/mock/responses";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const { projectId } = await context.params;
  return jsonMockResponse(selectProjectResponse(request, projectId));
}
