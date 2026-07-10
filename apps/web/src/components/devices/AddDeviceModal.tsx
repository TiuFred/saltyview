'use client';

import type { DeviceType, ProviderDeviceDto } from '@casa/shared-types';
import { Modal } from '../ui/Modal';

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  availableLgDevices: ProviderDeviceDto[];
  selectedLgDeviceId: string;
  onSelectLgDeviceId: (id: string) => void;
  availableSmartThingsDevices: ProviderDeviceDto[];
  selectedSmartThingsDeviceId: string;
  onSelectSmartThingsDeviceId: (id: string) => void;
  smartThingsDeviceType: DeviceType;
  onSelectSmartThingsDeviceType: (type: DeviceType) => void;
  deviceName: string;
  onChangeDeviceName: (name: string) => void;
  onAddLgDevice: () => void;
  onAddSmartThingsDevice: () => void;
}

export function AddDeviceModal({
  open,
  onClose,
  availableLgDevices,
  selectedLgDeviceId,
  onSelectLgDeviceId,
  availableSmartThingsDevices,
  selectedSmartThingsDeviceId,
  onSelectSmartThingsDeviceId,
  smartThingsDeviceType,
  onSelectSmartThingsDeviceType,
  deviceName,
  onChangeDeviceName,
  onAddLgDevice,
  onAddSmartThingsDevice,
}: AddDeviceModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Adicionar aparelho">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">LG ThinQ</h3>
            <p className="text-xs text-muted">Descubra aparelhos da sua conta LG ThinQ e adicione ao banco.</p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted">Aparelho LG</span>
            <select
              value={selectedLgDeviceId}
              onChange={(event) => onSelectLgDeviceId(event.target.value)}
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
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted">Nome no painel</span>
            <input
              value={deviceName}
              onChange={(event) => onChangeDeviceName(event.target.value)}
              placeholder="Ex.: Ar Quarto"
              className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onAddLgDevice}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar aparelho LG
          </button>
        </div>

        <div className="h-px bg-surface-border" />

        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">Samsung SmartThings</h3>
            <p className="text-xs text-muted">Descubra aparelhos da sua conta SmartThings e adicione ao banco.</p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted">Tipo</span>
            <select
              value={smartThingsDeviceType}
              onChange={(event) => onSelectSmartThingsDeviceType(event.target.value as DeviceType)}
              className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="TV">TV</option>
              <option value="AC">Ar Condicionado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted">Aparelho SmartThings</span>
            <select
              value={selectedSmartThingsDeviceId}
              onChange={(event) => onSelectSmartThingsDeviceId(event.target.value)}
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
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted">Nome no painel</span>
            <input
              value={deviceName}
              onChange={(event) => onChangeDeviceName(event.target.value)}
              placeholder="Ex.: TV Sala"
              className="rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onAddSmartThingsDevice}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar aparelho Samsung
          </button>
        </div>
      </div>
    </Modal>
  );
}
