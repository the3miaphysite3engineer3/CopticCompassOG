"use client";

import dynamic from "next/dynamic";
import type { SwaggerUIProps } from "swagger-ui-react";

const SwaggerUI = dynamic<SwaggerUIProps>(() => import("swagger-ui-react"), {
  ssr: false,
});

type SwaggerDocsClientProps = {
  specUrl: string;
};

export function SwaggerDocsClient({ specUrl }: SwaggerDocsClientProps) {
  return (
    <SwaggerUI
      url={specUrl}
      deepLinking
      defaultModelsExpandDepth={-1}
      displayRequestDuration
      docExpansion="list"
      filter
      tryItOutEnabled={false}
    />
  );
}
