/**
 * Google Apps Script Bridge
 * Allows React sidebar to call GAS functions via postMessage
 */

let callbackCounter = 0;
const pendingCallbacks = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();

// Methods that need longer timeouts (export operations involve cold starts + processing)
const LONG_TIMEOUT_METHODS = new Set([
  'exportEpub', 'exportPdf', 'exportDocx', 'exportTxt', 'exportHtml',
  'exportMarkdown', 'exportAzw3', 'exportKfx', 'exportAzw', 'exportMobi',
  'exportBoxSetEpub', 'exportLowContent',
]);

const EXPORT_TIMEOUT_MS = 300_000; // 5 minutes for exports (cold start + generation)
const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes for regular calls

// Listen for responses from the GAS bridge (Sidebar.html)
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;

    if (data?.type === 'GAS_RESULT') {
      const cb = pendingCallbacks.get(data.callbackId);
      if (cb) {
        clearTimeout(cb.timer);
        cb.resolve(data.result);
        pendingCallbacks.delete(data.callbackId);
      }
    }

    if (data?.type === 'GAS_ERROR') {
      const cb = pendingCallbacks.get(data.callbackId);
      if (cb) {
        clearTimeout(cb.timer);
        cb.reject(new Error(data.error || 'Unknown GAS error'));
        pendingCallbacks.delete(data.callbackId);
      }
    }
  });
}

/**
 * Call a Google Apps Script function from the React sidebar.
 *
 * @param method - The GAS function name (e.g., 'exportEpub', 'getWordCount')
 * @param args - Arguments to pass to the function
 * @returns Promise resolving to the function's return value
 *
 * @example
 * const result = await callGas<{ downloadUrl: string }>('exportEpub', { theme: {} });
 */
export function callGas<T>(method: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackId = `cb_${++callbackCounter}_${Date.now()}`;
    const timeoutMs = LONG_TIMEOUT_METHODS.has(method) ? EXPORT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
    const timeoutSec = Math.round(timeoutMs / 1000);

    const timer = setTimeout(() => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        reject(new Error(`Request to ${method} timed out after ${timeoutSec} seconds. The server may be waking up from sleep — please try again.`));
      }
    }, timeoutMs);

    pendingCallbacks.set(callbackId, {
      resolve: resolve as (v: unknown) => void,
      reject,
      timer,
    });

    // Send message to parent (Sidebar.html) which forwards to google.script.run
    window.parent.postMessage(
      {
        type: 'GAS_CALL',
        method,
        args,
        callbackId,
      },
      '*'
    );
  });
}

/**
 * Warm up the backend server to avoid cold-start timeouts.
 * Call this proactively when user opens the addon or navigates to export panel.
 */
export async function warmupBackend(): Promise<boolean> {
  try {
    const res = await fetch('https://bookify-ixxa.onrender.com/health', {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check if running inside Google Apps Script sidebar
 */
export function isInGasSidebar(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin restriction means we're in an iframe
  }
}
