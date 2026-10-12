// A timeout or a browser error does not establish that money transfer failed.
export async function checkOnlinePayment(fetchResult, { signal, now = Date.now, wait = abortableWait, timeoutMs = 10 * 60 * 1000, intervalMs = 15000 } = {}) {
  const started = now();
  let result = null;
  do {
    signal?.throwIfAborted();
    try {
      result = await fetchResult(signal);
      // Successful provider status still requires the normal admin confirmation.
      if (result.ok === true || result.status === "captured" || result.payout?.status === "processed") return { result, pending: false };
    } catch (error) {
      signal?.throwIfAborted();
      result = null;
      // Invalid input/auth must be corrected, rather than retried silently.
      if ([400, 401, 403].includes(error.response?.status)) throw error;
    }
    const remaining = timeoutMs - (now() - started);
    if (remaining <= 0) break;
    await wait(Math.min(intervalMs, remaining), signal);
  } while (true);
  const status = result?.payout?.status || result?.status;
  return { result, pending: !["failed", "reversed", "rejected", "cancelled"].includes(status) };
}

function abortableWait(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const finish = () => { signal?.removeEventListener("abort", abort); resolve(); };
    const timer = setTimeout(finish, ms);
    const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(signal.reason); };
    signal?.addEventListener("abort", abort, { once: true });
  });
}
