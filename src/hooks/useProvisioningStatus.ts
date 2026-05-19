import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchProvisioningStatus, ProvisioningStatus } from '../api';

const WS_BASE_URL =
  (import.meta as any).env?.VITE_WS_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const TERMINAL_STATUSES: ProvisioningStatus['status'][] = ['READY', 'FAILED'];
const POLLING_INTERVAL_MS = 3_000;
const POLLING_BACKOFF_MAX_MS = 15_000;

/**
 * Connects to the provisioning WebSocket namespace and falls back to HTTP
 * polling when the socket is disconnected or unavailable.
 */
export function useProvisioningStatus(provisioningId: string | null) {
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef(POLLING_INTERVAL_MS);
  const wsConnectedRef = useRef(false);

  const isTerminal = status
    ? TERMINAL_STATUSES.includes(status.status)
    : false;

  const poll = useCallback(async () => {
    if (!provisioningId || wsConnectedRef.current) return;
    try {
      const next = await fetchProvisioningStatus(provisioningId);
      setStatus(next);
      pollingIntervalRef.current = POLLING_INTERVAL_MS; // reset backoff on success
      if (!TERMINAL_STATUSES.includes(next.status)) {
        schedulePoll();
      }
    } catch {
      // Exponential backoff up to max
      pollingIntervalRef.current = Math.min(
        pollingIntervalRef.current * 2,
        POLLING_BACKOFF_MAX_MS,
      );
      schedulePoll();
    }
  }, [provisioningId]);

  const schedulePoll = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => void poll(), pollingIntervalRef.current);
  }, [poll]);

  useEffect(() => {
    if (!provisioningId) return;

    // Reset
    setStatus(null);
    wsConnectedRef.current = false;
    pollingIntervalRef.current = POLLING_INTERVAL_MS;

    // ── WebSocket ───────────────────────────────────────────────────────────
    const socket = io(`${WS_BASE_URL}/provisioning`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2_000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      wsConnectedRef.current = true;
      // Cancel any in-flight polling
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      socket.emit('subscribe', { provisioningId });
    });

    socket.on('disconnect', () => {
      wsConnectedRef.current = false;
      // Fall back to polling while disconnected
      if (!isTerminal) {
        schedulePoll();
      }
    });

    socket.on('provisioning:status', (data: ProvisioningStatus) => {
      setStatus(data);
      if (TERMINAL_STATUSES.includes(data.status)) {
        socket.disconnect();
      }
    });

    // Start polling immediately as fallback (WebSocket may not connect right away)
    schedulePoll();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('provisioning:status');
      socket.disconnect();
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [provisioningId]);

  // Stop polling once terminal
  useEffect(() => {
    if (isTerminal && pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, [isTerminal]);

  return status;
}
