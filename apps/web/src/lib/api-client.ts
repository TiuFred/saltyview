import type {
  AssignDeviceTagsDto,
  AuthTokensDto,
  AuthenticatedUserDto,
  CreateDeviceDto,
  CreateTagDto,
  DeviceCommand,
  DeviceDto,
  DeviceLogDto,
  ProviderDeviceDto,
  TagDto,
  UpdateDeviceIconDto,
  UpdateDeviceNameDto,
  UpdateTagDto,
  UserSummaryDto,
} from '@casa/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Erro inesperado');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  listUsers: () => request<UserSummaryDto[]>('/auth/users'),

  login: (email: string, password: string) =>
    request<AuthTokensDto>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  pinLogin: (name: string, pin: string) =>
    request<AuthTokensDto>('/auth/pin-login', { method: 'POST', body: JSON.stringify({ name, pin }) }),

  refresh: (refreshToken: string) =>
    request<AuthTokensDto>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: (token: string) => request<AuthenticatedUserDto>('/auth/me', {}, token),

  listDevices: (token: string) => request<DeviceDto[]>('/devices', {}, token),

  listAvailableLgDevices: (token: string) => request<ProviderDeviceDto[]>('/devices/lg-available', {}, token),

  listAvailableSmartThingsDevices: (token: string) => request<ProviderDeviceDto[]>('/devices/smartthings-available', {}, token),

  createDevice: (token: string, payload: CreateDeviceDto) =>
    request<DeviceDto>('/devices', { method: 'POST', body: JSON.stringify(payload) }, token),

  updateDeviceName: (token: string, deviceId: string, payload: UpdateDeviceNameDto) =>
    request<DeviceDto>(`/devices/${deviceId}/name`, { method: 'PATCH', body: JSON.stringify(payload) }, token),

  updateDeviceIcon: (token: string, deviceId: string, payload: UpdateDeviceIconDto) =>
    request<DeviceDto>(`/devices/${deviceId}/icon`, { method: 'PATCH', body: JSON.stringify(payload) }, token),

  setDeviceTags: (token: string, deviceId: string, payload: AssignDeviceTagsDto) =>
    request<DeviceDto>(`/devices/${deviceId}/tags`, { method: 'PUT', body: JSON.stringify(payload) }, token),

  removeDevice: (token: string, deviceId: string) => request<void>(`/devices/${deviceId}`, { method: 'DELETE' }, token),

  listTags: (token: string) => request<TagDto[]>('/tags', {}, token),

  createTag: (token: string, payload: CreateTagDto) =>
    request<TagDto>('/tags', { method: 'POST', body: JSON.stringify(payload) }, token),

  updateTag: (token: string, tagId: string, payload: UpdateTagDto) =>
    request<TagDto>(`/tags/${tagId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),

  getTagUsage: (token: string, tagId: string) => request<{ deviceCount: number }>(`/tags/${tagId}/usage`, {}, token),

  deleteTag: (token: string, tagId: string) => request<void>(`/tags/${tagId}`, { method: 'DELETE' }, token),

  getDevice: (token: string, deviceId: string) => request<DeviceDto>(`/devices/${deviceId}`, {}, token),

  refreshDevice: (token: string, deviceId: string) =>
    request<DeviceDto>(`/devices/${deviceId}/refresh`, { method: 'POST' }, token),

  sendCommand: (token: string, deviceId: string, command: DeviceCommand) =>
    request<DeviceDto>(`/devices/${deviceId}/commands`, { method: 'POST', body: JSON.stringify(command) }, token),

  deviceLogs: (token: string, deviceId: string) => request<DeviceLogDto[]>(`/devices/${deviceId}/logs`, {}, token),
};
