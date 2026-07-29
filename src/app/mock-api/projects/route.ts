import {
  jsonMockResponse,
  selectProjectCollectionResponse,
} from "@/infrastructure/mock/responses";

export function GET(request: Request): Response {
  return jsonMockResponse(selectProjectCollectionResponse(request));
}
