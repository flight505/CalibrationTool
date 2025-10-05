export type WebSearchStatus = 'in_progress' | 'searching' | 'completed';

export interface DOECallError extends Error {
  code?: string;
  status?: number;
  requestId?: string;
  cause?: unknown;
}

export interface DOEStreamHandlers<T> {
  onEvent?: (event: unknown) => void;
  onTextDelta?: (delta: string) => void;
  onWebSearchStatus?: (status: WebSearchStatus) => void;
  onCompleted?: (result: T) => void;
  onError?: (error: DOECallError) => void;
}
