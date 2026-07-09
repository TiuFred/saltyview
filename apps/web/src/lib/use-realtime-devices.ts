'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WS_EVENTS, type DeviceStateUpdatedEvent } from '@casa/shared-types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

export function useRealtimeDevices(token: string | null, onDeviceUpdated: (event: DeviceStateUpdatedEvent) => void) {
  const callbackRef = useRef(onDeviceUpdated);
  callbackRef.current = onDeviceUpdated;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(WS_URL, { auth: { token } });
    socket.on(WS_EVENTS.DEVICE_STATE_UPDATED, (event: DeviceStateUpdatedEvent) => callbackRef.current(event));

    return () => {
      socket.disconnect();
    };
  }, [token]);
}
