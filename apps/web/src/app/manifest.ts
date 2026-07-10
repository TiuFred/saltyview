import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Casa — Central de Automação',
    short_name: 'Casa',
    description: 'Painel de controle da casa inteligente',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
