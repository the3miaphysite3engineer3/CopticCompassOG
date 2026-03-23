declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  export type SwaggerUIProps = {
    url: string;
    deepLinking?: boolean;
    defaultModelsExpandDepth?: number;
    displayRequestDuration?: boolean;
    docExpansion?: "list" | "full" | "none";
    filter?: boolean | string;
    tryItOutEnabled?: boolean;
  };

  const SwaggerUI: ComponentType<SwaggerUIProps>;

  export default SwaggerUI;
}
