'use client';

import { useEffect, useState } from 'react';
import type { CreateDeviceDto, DeviceType, ProviderDeviceDto, TagDto, UserSummaryDto } from '@casa/shared-types';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { ACCommand, DeviceCommand, DeviceDto, TVCommand } from '@casa/shared-types';
import { useAuth } from '@/lib/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { useRealtimeDevices } from '@/lib/use-realtime-devices';
import { TVCard } from '@/components/devices/TVCard';
import { ACCard } from '@/components/devices/ACCard';
import { TagFilterBar } from '@/components/tags/TagFilterBar';
import { TagManagerModal } from '@/components/tags/TagManagerModal';
import { UserPinManagerModal } from '@/components/users/UserPinManagerModal';
import { AddDeviceModal } from '@/components/devices/AddDeviceModal';

export default function DashboardPage() {
  const { user, accessToken, loading, logout } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [availableLgDevices, setAvailableLgDevices] = useState<ProviderDeviceDto[]>([]);
  const [availableSmartThingsDevices, setAvailableSmartThingsDevices] = useState<ProviderDeviceDto[]>([]);
  const [selectedLgDeviceId, setSelectedLgDeviceId] = useState('');
  const [selectedSmartThingsDeviceId, setSelectedSmartThingsDeviceId] = useState('');
  const [smartThingsDeviceType, setSmartThingsDeviceType] = useState<DeviceType>('TV');
  const [deviceName, setDeviceName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [householdUsers, setHouseholdUsers] = useState<UserSummaryDto[]>([]);
  const [pinManagerOpen, setPinManagerOpen] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);

  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!accessToken) {
      setDevices([]);
      setTags([]);
      setHouseholdUsers([]);
      setAvailableLgDevices([]);
      setAvailableSmartThingsDevices([]);
      setSelectedLgDeviceId('');
      setSelectedSmartThingsDeviceId('');
      setDevicesLoading(false);
      return;
    }

    const token = accessToken;

    let cancelled = false;

    async function loadDashboardData() {
      setDevicesLoading(true);

      try {
        const [deviceList, tagList] = await Promise.all([
          apiClient.listDevices(token),
          apiClient.listTags(token),
        ]);

        if (cancelled) {
          return;
        }

        setDevices(deviceList);
        setTags(tagList);
      } catch {
        if (!cancelled) {
          setErrorMessage('Não foi possível carregar os dados do dashboard.');
        }
      } finally {
        if (!cancelled) {
          setDevicesLoading(false);
        }
      }

      if (!isAdmin) {
        if (!cancelled) {
          setHouseholdUsers([]);
          setAvailableLgDevices([]);
          setAvailableSmartThingsDevices([]);
          setSelectedLgDeviceId('');
          setSelectedSmartThingsDeviceId('');
        }
        return;
      }

      try {
        const [users, lgDevices, smartThingsDevices] = await Promise.all([
          apiClient.listUsers(),
          apiClient.listAvailableLgDevices(token),
          apiClient.listAvailableSmartThingsDevices(token),
        ]);

        if (cancelled) {
          return;
        }

        setHouseholdUsers(users);
        setAvailableLgDevices(lgDevices);
        setAvailableSmartThingsDevices(smartThingsDevices);
        setSelectedLgDeviceId((current) => current || lgDevices[0]?.id || '');
        setSelectedSmartThingsDeviceId((current) => current || smartThingsDevices[0]?.id || '');
      } catch {
        if (!cancelled) {
          setErrorMessage('Não foi possível carregar os dados administrativos.');
        }
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAdmin]);

  useRealtimeDevices(accessToken, (event) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === event.deviceId ? { ...device, state: event.state, online: event.online, updatedAt: event.updatedAt } : device,
      ),
    );
  });

  async function reloadDevices() {
    if (!accessToken) return;
    const token = accessToken;
    const list = await apiClient.listDevices(token);
    setDevices(list);
  }

  async function sendCommand(deviceId: string, command: DeviceCommand) {
    if (!accessToken) return;
    const token = accessToken;
    try {
      const updated = await apiClient.sendCommand(token, deviceId, command);
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível enviar o comando. Tente novamente.');
    }
  }

  async function addLgDevice() {
    if (!accessToken || !selectedLgDeviceId) return;
    const token = accessToken;
    const selectedDevice = availableLgDevices.find((device) => device.id === selectedLgDeviceId);
    if (!selectedDevice) return;

    const payload: CreateDeviceDto = {
      name: deviceName.trim() || selectedDevice.name,
      type: 'AC',
      provider: 'LG_THINQ',
      externalId: selectedDevice.id,
    };

    try {
      const created = await apiClient.createDevice(token, payload);
      setDevices((prev) => [...prev, created]);
      setDeviceName('');
      setErrorMessage(null);
      setAddDeviceOpen(false);
      await reloadDevices();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível adicionar o aparelho.');
    }
  }

  async function addSmartThingsDevice() {
    if (!accessToken || !selectedSmartThingsDeviceId) return;
    const token = accessToken;
    const selectedDevice = availableSmartThingsDevices.find((device) => device.id === selectedSmartThingsDeviceId);
    if (!selectedDevice) return;

    const payload: CreateDeviceDto = {
      name: deviceName.trim() || selectedDevice.name,
      type: smartThingsDeviceType,
      provider: 'SMARTTHINGS',
      externalId: selectedDevice.id,
    };

    try {
      const created = await apiClient.createDevice(token, payload);
      setDevices((prev) => [...prev, created]);
      setDeviceName('');
      setErrorMessage(null);
      setAddDeviceOpen(false);
      await reloadDevices();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível adicionar o aparelho.');
    }
  }

  async function renameDevice(deviceId: string, newName: string) {
    if (!accessToken || !isAdmin) return;
    const token = accessToken;
    try {
      const updated = await apiClient.updateDeviceName(token, deviceId, { name: newName.trim() });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível renomear o aparelho.');
    }
  }

  async function changeDeviceIcon(deviceId: string, icon: string) {
    if (!accessToken || !isAdmin) return;
    const token = accessToken;
    try {
      const updated = await apiClient.updateDeviceIcon(token, deviceId, { icon });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível trocar o ícone.');
    }
  }

  async function changeDeviceTags(deviceId: string, tagIds: string[]) {
    if (!accessToken || !isAdmin) return;
    const token = accessToken;
    try {
      const updated = await apiClient.setDeviceTags(token, deviceId, { tagIds });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível atualizar as tags do aparelho.');
    }
  }

  async function removeDeviceFromList(deviceId: string) {
    if (!accessToken || !isAdmin) return;
    const token = accessToken;
    try {
      await apiClient.removeDevice(token, deviceId);
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível remover o aparelho.');
    }
  }

  async function createTag(name: string) {
    if (!accessToken) return;
    const token = accessToken;
    const created = await apiClient.createTag(token, { name });
    setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setErrorMessage(null);
  }

  async function renameTag(tagId: string, name: string) {
    if (!accessToken) return;
    const token = accessToken;
    const updated = await apiClient.updateTag(token, tagId, { name });
    setTags((prev) => prev.map((tag) => (tag.id === tagId ? updated : tag)));
    await reloadDevices();
    setErrorMessage(null);
  }

  async function deleteTag(tagId: string) {
    if (!accessToken) return;
    const token = accessToken;
    await apiClient.deleteTag(token, tagId);
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    setSelectedTagId((prev) => (prev === tagId ? null : prev));
    await reloadDevices();
    setErrorMessage(null);
  }

  async function getTagUsage(tagId: string) {
    if (!accessToken) return { deviceCount: 0 };
    const token = accessToken;
    return apiClient.getTagUsage(token, tagId);
  }

  async function updateUserPin(userId: string, pin: string) {
    if (!accessToken) return;
    const token = accessToken;
    await apiClient.updateUserPin(token, userId, { pin });
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }

  const visibleDevices = devices.filter(
    (device) => selectedTagId === null || device.tags.some((tag) => tag.id === selectedTagId),
  );

  const onlineCount = devices.filter((d) => d.online).length;
  const poweredOnCount = devices.filter((d) => (d.state as { power?: string } | null)?.power === 'on').length;

  if (loading || !user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted">Central de automação da casa</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-surface-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
        >
          Sair
        </button>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card grid grid-cols-2 gap-4 rounded-3xl p-6 sm:grid-cols-4"
      >
        <Stat label="Dispositivos" value={devices.length} />
        <Stat label="Online" value={onlineCount} />
        <Stat label="Ligados" value={poweredOnCount} />
        <Stat label="Offline" value={devices.length - onlineCount} />
      </motion.section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TagFilterBar tags={tags} selectedTagId={selectedTagId} onToggle={toggleTagFilter} onClear={() => setSelectedTagId(null)} />
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAddDeviceOpen(true)}
              className="rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white"
            >
              Adicionar aparelho
            </button>
            <button
              type="button"
              onClick={() => setPinManagerOpen(true)}
              className="rounded-xl border border-surface-border px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
            >
              Gerenciar PINs
            </button>
            <button
              type="button"
              onClick={() => setTagManagerOpen(true)}
              className="rounded-xl border border-surface-border px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
            >
              Gerenciar tags
            </button>
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {devicesLoading && <p className="text-sm text-muted">Carregando dispositivos…</p>}

        {visibleDevices.map((device) =>
          device.type === 'TV' ? (
            <TVCard
              key={device.id}
              device={device}
              onCommand={(command: TVCommand) => sendCommand(device.id, command)}
              onRename={isAdmin ? (name: string) => renameDevice(device.id, name) : undefined}
              onRemove={isAdmin ? () => removeDeviceFromList(device.id) : undefined}
              onChangeIcon={isAdmin ? (icon: string) => changeDeviceIcon(device.id, icon) : undefined}
              allTags={tags}
              onChangeTags={isAdmin ? (tagIds: string[]) => changeDeviceTags(device.id, tagIds) : undefined}
            />
          ) : (
            <ACCard
              key={device.id}
              device={device}
              onCommand={(command: ACCommand) => sendCommand(device.id, command)}
              onRename={isAdmin ? (name: string) => renameDevice(device.id, name) : undefined}
              onRemove={isAdmin ? () => removeDeviceFromList(device.id) : undefined}
              onChangeIcon={isAdmin ? (icon: string) => changeDeviceIcon(device.id, icon) : undefined}
              allTags={tags}
              onChangeTags={isAdmin ? (tagIds: string[]) => changeDeviceTags(device.id, tagIds) : undefined}
            />
          ),
        )}
      </section>

      {isAdmin && (
        <TagManagerModal
          open={tagManagerOpen}
          onClose={() => setTagManagerOpen(false)}
          tags={tags}
          onCreate={createTag}
          onRename={renameTag}
          onDelete={deleteTag}
          getUsage={getTagUsage}
        />
      )}

      {isAdmin && (
        <UserPinManagerModal
          open={pinManagerOpen}
          onClose={() => setPinManagerOpen(false)}
          users={householdUsers}
          onUpdatePin={updateUserPin}
        />
      )}

      {isAdmin && (
        <AddDeviceModal
          open={addDeviceOpen}
          onClose={() => setAddDeviceOpen(false)}
          availableLgDevices={availableLgDevices}
          selectedLgDeviceId={selectedLgDeviceId}
          onSelectLgDeviceId={setSelectedLgDeviceId}
          availableSmartThingsDevices={availableSmartThingsDevices}
          selectedSmartThingsDeviceId={selectedSmartThingsDeviceId}
          onSelectSmartThingsDeviceId={setSelectedSmartThingsDeviceId}
          smartThingsDeviceType={smartThingsDeviceType}
          onSelectSmartThingsDeviceType={setSmartThingsDeviceType}
          deviceName={deviceName}
          onChangeDeviceName={setDeviceName}
          onAddLgDevice={addLgDevice}
          onAddSmartThingsDevice={addSmartThingsDevice}
        />
      )}

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card fixed inset-x-6 bottom-6 mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl px-5 py-3 text-sm shadow-2xl"
          >
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-muted hover:text-foreground">
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
