import { NextApiRequest, NextApiResponse } from "next";
import cors from "nextjs-cors";
import { createContext } from "src/server/trpc/context";
import { appRouter } from "src/server/trpc/router";
import { createOpenApiNextHandler } from "trpc-openapi";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Setup CORS
  await cors(req, res);

  // Handle incoming OpenAPI requests
  return createOpenApiNextHandler({
    router: appRouter,
    createContext,
    onError: undefined,
    responseMeta: undefined,
  })(req, res);
};

export default handler;
