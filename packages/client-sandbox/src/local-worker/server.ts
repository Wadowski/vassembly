import http from 'node:http';

import { ValidationError } from '@vassembly/errors';

import type { ExecuteParams } from '../types';

import { executeScript } from './executeScript';
import { removeWorkspace } from './workspaceVolume';

export interface StartLocalSandboxWorkerParams {
  port: number;
}

const readJsonBody = async (request: http.IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf-8');

  if (raw.length === 0) {
    throw new ValidationError('Request body is required');
  }

  return JSON.parse(raw) as unknown;
};

const sendJson = ({
  response,
  statusCode,
  body,
}: {
  response: http.ServerResponse;
  statusCode: number;
  body: unknown;
}): void => {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
};

const handleExecute = async ({
  request,
  response,
}: {
  request: http.IncomingMessage;
  response: http.ServerResponse;
}): Promise<void> => {
  const body = (await readJsonBody(request)) as ExecuteParams;
  const result = await executeScript(body);
  sendJson({ response, statusCode: 200, body: result });
};

const handleDeleteWorkspace = async ({
  workspaceId,
  response,
}: {
  workspaceId: string;
  response: http.ServerResponse;
}): Promise<void> => {
  await removeWorkspace({ workspaceId });
  response.writeHead(204);
  response.end();
};

export const startLocalSandboxWorker = ({
  port,
}: StartLocalSandboxWorkerParams): http.Server => {
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://localhost:${port}`);
      const method = request.method ?? 'GET';

      if (method === 'POST' && url.pathname === '/execute') {
        await handleExecute({ request, response });
        return;
      }

      if (method === 'DELETE' && url.pathname.startsWith('/workspace/')) {
        const workspaceId = url.pathname.slice('/workspace/'.length);

        if (workspaceId.length === 0) {
          throw new ValidationError('Workspace id is required');
        }

        await handleDeleteWorkspace({ workspaceId, response });
        return;
      }

      sendJson({ response, statusCode: 404, body: { error: 'Not found' } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendJson({ response, statusCode: 400, body: { error: message } });
    }
  });

  server.listen(port);
  return server;
};

const DEFAULT_WORKER_PORT = 4010;

const isMainModule = process.argv[1]?.endsWith('server.ts') ?? false;

if (isMainModule) {
  startLocalSandboxWorker({ port: DEFAULT_WORKER_PORT });
}
