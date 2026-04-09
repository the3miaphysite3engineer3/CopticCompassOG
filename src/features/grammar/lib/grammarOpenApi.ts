import { buildGrammarOpenApiComponents } from "./grammarOpenApiComponents";
import { buildGrammarOpenApiPaths } from "./grammarOpenApiPaths";
import {
  buildGrammarOpenApiInfo,
  createGrammarOpenApiContext,
  GRAMMAR_OPEN_API_TAGS,
  type OpenApiDocument,
} from "./grammarOpenApiShared";

/**
 * Returns the complete OpenAPI document for the published grammar API,
 * including shared metadata, path definitions, and component schemas.
 */
export function getGrammarOpenApiDocument(): OpenApiDocument {
  const context = createGrammarOpenApiContext();

  return {
    openapi: "3.0.3",
    info: buildGrammarOpenApiInfo(context),
    servers: [
      {
        url: "/",
        description: "Current deployment",
      },
    ],
    tags: GRAMMAR_OPEN_API_TAGS,
    externalDocs: {
      description: "Interactive API index",
      url: "/api/v1/grammar",
    },
    paths: buildGrammarOpenApiPaths(context),
    components: buildGrammarOpenApiComponents(context),
  };
}
