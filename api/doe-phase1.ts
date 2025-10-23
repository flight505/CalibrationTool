import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callPhase1LLM } from '../src/lib/utils/openai';
import type { Phase1RequestPayload } from '../src/utils/doe/doeTypes';
import type { DOECallError } from '../src/lib/utils/doeLLMCommon';

function send(res: VercelResponse, message: unknown) {
  res.write(`data: ${JSON.stringify(message)}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});

  const { payload, location } = rawBody as {
    payload?: Phase1RequestPayload;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };

  if (!payload) {
    res.status(400).json({ error: 'Missing payload' });
    return;
  }

  let errorSent = false;

  try {
    await callPhase1LLM({
      payload,
      stream: false, // Disabled to avoid OpenAI organization verification requirement
      location,
      handlers: {
        onWebSearchStatus: (status) => send(res, { kind: 'status', status }),
        onTextDelta: (delta) => send(res, { kind: 'delta', delta }),
        onEvent: (event) => send(res, { kind: 'event', event }),
        onCompleted: (result) => send(res, { kind: 'completed', result }),
        onError: (error: DOECallError) => {
          errorSent = true;
          send(res, {
            kind: 'error',
            error: {
              message: error.message,
              code: error.code,
              requestId: error.requestId
            }
          });
        }
      }
    });
  } catch (error) {
    if (!errorSent) {
      const err = error as Error;
      send(res, {
        kind: 'error',
        error: {
          message: err.message || 'Unexpected error invoking GPT-5.'
        }
      });
    }
  } finally {
    res.end();
  }
}
