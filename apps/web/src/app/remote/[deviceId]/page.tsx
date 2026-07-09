'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ACCommand, DeviceDto } from '@casa/shared-types';
import { useAuth } from '@/lib/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { useRealtimeDevices } from '@/lib/use-realtime-devices';
import { ACRemoteControl } from '@/components/devices/ACRemoteControl';

export default function RemoteControlPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const loadDevice = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiClient.getDevice(accessToken, deviceId);
      setDevice(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o dispositivo.');
    }
  }, [accessToken, deviceId]);

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  useRealtimeDevices(accessToken, (event) => {
    if (event.deviceId !== deviceId) return;
    setDevice((prev) => (prev ? { ...prev, state: event.state, online: event.online, updatedAt: event.updatedAt } : prev));
  });

  async function sendCommand(command: ACCommand) {
    if (!accessToken) return;
    try {
      const updated = await apiClient.sendCommand(accessToken, deviceId, command);
      setDevice(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o comando.');
    }
  }

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      {error && <p className="text-sm text-danger">{error}</p>}

      {!device && !error && <p className="text-sm text-muted">Carregando controle remoto…</p>}

      {device && device.type === 'AC' && <ACRemoteControl device={device} onCommand={sendCommand} />}

      {device && device.type !== 'AC' && <p className="text-sm text-muted">Ainda não há um controle remoto para este tipo de dispositivo.</p>}
    </div>
  );
}
