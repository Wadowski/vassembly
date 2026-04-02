import { createServer } from "./createServer";
import type { StartServerProps } from "./types";

export const startServer = async ({ routes, port }: StartServerProps) => {
  const server = await createServer({
    routes,
  });

  server.listen({ port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server is running on ${address}`);
  });
};