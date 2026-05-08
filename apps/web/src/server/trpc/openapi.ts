import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "./router";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "fund API",
  description: "HTTP API for fund",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api",
  docsUrl: "https://github.com/jlalmes/trpc-openapi",
  tags: ["fund"],
});
