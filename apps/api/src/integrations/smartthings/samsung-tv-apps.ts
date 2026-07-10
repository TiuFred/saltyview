// IDs de app do capability `custom.launchapp` para TVs Samsung (Tizen).
// Confirmados em 2026-07-10 contra a TV real (QN75QEF1AGXZD) — os IDs numéricos "clássicos"
// (ex: Netflix 11101200001) foram ACEITOS pela API (status COMPLETED) mas não abriam o app de
// verdade na tela; só os IDs alfanuméricos de pacote Tizen abrem de fato. Podem variar por
// modelo/região/firmware — reteste no aparelho se algum app parar de abrir.
export const SAMSUNG_TV_APP_IDS: Record<
  'netflix' | 'youtube' | 'primevideo' | 'disneyplus' | 'globoplay',
  string
> = {
  netflix: 'org.tizen.netflix-app',
  youtube: '9Ur5IzDKqV.TizenYouTube',
  primevideo: 'org.tizen.primevideo',
  disneyplus: 'MCmYXNxgcu.DisneyPlus',
  globoplay: 'org.tizen.globoplayapp',
};
