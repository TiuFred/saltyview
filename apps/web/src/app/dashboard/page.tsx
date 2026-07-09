'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CreateDeviceDto, DeviceType, ProviderDeviceDto, TagDto } from '@casa/shared-types';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    setIsAdmin(user?.email === 'admin@example.com');
  }, [user]);

  const loadDevices = useCallback(async () => {
    if (!accessToken) return;
    const list = await apiClient.listDevices(accessToken);
    setDevices(list);
    setDevicesLoading(false);
  }, [accessToken]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const loadTags = useCallback(async () => {
    if (!accessToken) return;
    try {
      const list = await apiClient.listTags(accessToken);
      setTags(list);
    } catch {
      setErrorMessage('Não foi possível carregar as tags.');
    }
  }, [accessToken]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const loadAvailableLgDevices = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    try {
      const list = await apiClient.listAvailableLgDevices(accessToken);
      setAvailableLgDevices(list);
      if (list[0]) {
        setSelectedLgDeviceId(list[0].id);
      }
    } catch {
      setErrorMessage('Não foi possível listar aparelhos LG ThinQ.');
    }
  }, [accessToken, isAdmin]);

  const loadAvailableSmartThingsDevices = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    try {
      const list = await apiClient.listAvailableSmartThingsDevices(accessToken);
      setAvailableSmartThingsDevices(list);
      if (list[0]) {
        setSelectedSmartThingsDeviceId(list[0].id);
      }
    } catch {
      setErrorMessage('Não foi possível listar aparelhos SmartThings.');
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void loadAvailableLgDevices();
    void loadAvailableSmartThingsDevices();
  }, [loadAvailableLgDevices, loadAvailableSmartThingsDevices]);

  useRealtimeDevices(accessToken, (event) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === event.deviceId ? { ...device, state: event.state, online: event.online, updatedAt: event.updatedAt } : device,
      ),
    );
  });

  async function sendCommand(deviceId: string, command: DeviceCommand) {
    if (!accessToken) return;
    try {
      const updated = await apiClient.sendCommand(accessToken, deviceId, command);
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível enviar o comando. Tente novamente.');
    }
  }

  async function addLgDevice() {
    if (!accessToken || !selectedLgDeviceId) return;
    const selectedDevice = availableLgDevices.find((device) => device.id === selectedLgDeviceId);
    if (!selectedDevice) return;

    const payload: CreateDeviceDto = {
      name: deviceName.trim() || selectedDevice.name,
      type: 'AC',
      provider: 'LG_THINQ',
      externalId: selectedDevice.id,
    };

    try {
      const created = await apiClient.createDevice(accessToken, payload);
      setDevices((prev) => [...prev, created]);
      setDeviceName('');
      setErrorMessage(null);
      await loadDevices();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível adicionar o aparelho.');
    }
  }

  async function addSmartThingsDevice() {
    if (!accessToken || !selectedSmartThingsDeviceId) return;
    const selectedDevice = availableSmartThingsDevices.find((device) => device.id === selectedSmartThingsDeviceId);
    if (!selectedDevice) return;

    const payload: CreateDeviceDto = {
      name: deviceName.trim() || selectedDevice.name,
      type: smartThingsDeviceType,
      provider: 'SMARTTHINGS',
      externalId: selectedDevice.id,
    };

    try {
      const created = await apiClient.createDevice(accessToken, payload);
      setDevices((prev) => [...prev, created]);
      setDeviceName('');
      setErrorMessage(null);
      await loadDevices();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível adicionar o aparelho.');
    }
  }

  async function renameDevice(deviceId: string, newName: string) {
    if (!accessToken || !isAdmin) return;
    try {
      const updated = await apiClient.updateDeviceName(accessToken, deviceId, { name: newName.trim() });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível renomear o aparelho.');
    }
  }

  async function changeDeviceIcon(deviceId: string, icon: string) {
    if (!accessToken || !isAdmin) return;
    try {
      const updated = await apiClient.updateDeviceIcon(accessToken, deviceId, { icon });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível trocar o ícone.');
    }
  }

  async function changeDeviceTags(deviceId: string, tagIds: string[]) {
    if (!accessToken || !isAdmin) return;
    try {
      const updated = await apiClient.setDeviceTags(accessToken, deviceId, { tagIds });
      setDevices((prev) => prev.map((device) => (device.id === deviceId ? updated : device)));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível atualizar as tags do aparelho.');
    }
  }

  async function removeDeviceFromList(deviceId: string) {
    if (!accessToken || !isAdmin) return;
    try {
      await apiClient.removeDevice(accessToken, deviceId);
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível remover o aparelho.');
    }
  }

  async function createTag(name: string) {
    if (!accessToken) return;
    const created = await apiClient.createTag(accessToken, { name });
    setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function renameTag(tagId: string, name: string) {
    if (!accessToken) return;
    const updated = await apiClient.updateTag(accessToken, tagId, { name });
    setTags((prev) => prev.map((tag) => (tag.id === tagId ? updated : tag)));
    await loadDevices();
  }

  async function deleteTag(tagId: string) {
    if (!accessToken) return;
    await apiClient.deleteTag(accessToken, tagId);
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    await loadDevices();
  }

  async function getTagUsage(tagId: string) {
    if (!accessToken) return { deviceCount: 0 };
    return apiClient.getTagUsage(accessToken, tagId);
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  const visibleDevices = devices.filter(
    (device) => selectedTagIds.length === 0 || device.tags.some((tag) => selectedTagIds.includes(tag.id)),
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
        <TagFilterBar tags={tags} selectedTagIds={selectedTagIds} onToggle={toggleTagFilter} onClear={() => setSelectedTagIds([])} />
        {isAdmin && (
          <button
            type="button"
            onClick={() => setTagManagerOpen(true)}
            className="rounded-xl border border-surface-border px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
          >
            Gerenciar tags
          </button>
        )}
      </div>

      {isAdmin && (
        <section className="glass-card rounded-3xl p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Adicionar aparelho LG</h2>
              <p className="text-sm text-muted">Descubra aparelhos da sua conta LG ThinQ e adicione ao banco.</p>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="lg-device-select">Aparelho LG</label>
              <select
                id="lg-device-select"
                value={selectedLgDeviceId}
                onChange={(event) => setSelectedLgDeviceId(event.target.value)}
                className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
              >
                {availableLgDevices.length === 0 ? (
                  <option value="">Nenhum aparelho encontrado</option>
                ) : (
                  availableLgDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="lg-device-name">Nome no painel</label>
              <input
                id="lg-device-name"
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                placeholder="Ex.: Ar Quarto"
                className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addLgDevice}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Adicionar aparelho Samsung</h2>
              <p className="text-sm text-muted">Descubra aparelhos da sua conta SmartThings e adicione ao banco.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="smartthings-device-type">Tipo</label>
              <select
                id="smartthings-device-type"
                value={smartThingsDeviceType}
                onChange={(event) => setSmartThingsDeviceType(event.target.value as DeviceType)}
                className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
              >
                <option value="TV">TV</option>
                <option value="AC">Ar Condicionado</option>
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="smartthings-device-select">Aparelho SmartThings</label>
              <select
                id="smartthings-device-select"
                value={selectedSmartThingsDeviceId}
                onChange={(event) => setSelectedSmartThingsDeviceId(event.target.value)}
                className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
              >
                {availableSmartThingsDevices.length === 0 ? (
                  <option value="">Nenhum aparelho encontrado</option>
                ) : (
                  availableSmartThingsDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="smartthings-device-name">Nome no painel</label>
              <input
                id="smartthings-device-name"
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                placeholder="Ex.: TV Sala"
                className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addSmartThingsDevice}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Adicionar
            </button>
          </div>
        </section>
      )}

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
