/**
 * Minimal local typings for the Swagger UI browser bundle used by the API docs
 * page.
 */
declare module "swagger-ui-dist" {
  export type SwaggerUiDocumentExpansion = "full" | "list" | "none";

  export type SwaggerUiBundleOptions = {
    deepLinking?: boolean;
    defaultModelsExpandDepth?: number;
    displayRequestDuration?: boolean;
    docExpansion?: SwaggerUiDocumentExpansion;
    domNode?: Element | null;
    filter?: boolean | string;
    layout?: string;
    presets?: unknown[];
    tryItOutEnabled?: boolean;
    url?: string;
  };

  export type SwaggerUiInstance = {
    destroy?: () => void;
  };

  export type SwaggerUiBundleFactory = {
    (options: SwaggerUiBundleOptions): SwaggerUiInstance | undefined;
    presets: {
      apis: unknown;
    };
  };

  export type SwaggerUiModule = {
    SwaggerUIBundle: SwaggerUiBundleFactory;
    SwaggerUIStandalonePreset: unknown;
  };

  const swaggerUiModule: SwaggerUiModule;

  export const SwaggerUIBundle: SwaggerUiBundleFactory;
  export const SwaggerUIStandalonePreset: unknown;
  export default swaggerUiModule;
}
