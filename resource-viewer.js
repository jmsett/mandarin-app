// Provider-supported players and a small allowlist of pages audited for framing.
const CHANNELS = {
  '@mandarincorner2': [
    {title: 'Survival Chinese', id: 'PL7VdqFXO0LzeL7NFdftXhHc81WGqtUffe'},
    {title: 'Beginner vocabulary', id: 'PL7VdqFXO0LzeH-Of75XEG5ua1vYpJQA_C'},
    {title: 'HSK 2 vocabulary', id: 'PL7VdqFXO0Lzcng8-g5uATwXcO3EsZMm0k'},
    {title: 'Slow Chinese · intermediate', id: 'PL7VdqFXO0LzfGg59WzkznDmidkUQAEozk'}
  ],
  '@chinesezerotohero': [
    {title: 'HSK 1 grammar', id: 'PLLjttboWd2559NVylFEAy0FJ3STI551KE'},
    {title: 'Introduction to Chinese', id: 'PLLjttboWd2562rsy0mDf2L2na58rncgNC'},
    {title: 'Tone pairs', id: 'PLLjttboWd256BrB2WY2b4vzechzlVJLQd'},
    {title: 'HSK 2 grammar', id: 'PLLjttboWd255_9W59QjdbCGNnnKGIcTP7'}
  ]
};
const PAGES = new Map([
  ['https://www.hackingchinese.com/beginner-chinese-listening-practice-what-to-listen-to-and-how/', 'Hacking Chinese'],
  ['https://mandarincompanion.com/', 'Mandarin Companion'],
  ['https://www.hellochinese.cc/', 'HelloChinese'],
  ['https://www.pleco.com/', 'Pleco'],
  ['https://apps.ankiweb.net/', 'Anki']
]);
const VIDEO_ID = /^[\w-]{11}$/;
const LIST_ID = /^[\w-]{10,80}$/;
function startSeconds(value = '') {
  if (/^\d+$/.test(value)) return Math.min(604800, Number(value));
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return match ? Math.min(604800, Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)) : 0;
}
function youtubePlayer(id, playlist, start = 0) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${id || 'videoseries'}`);
  if (playlist) url.searchParams.set('list', playlist);
  if (start) url.searchParams.set('start', start);
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('rel', '0');
  return url.href;
}
export function getEmbed(raw) {
  if (typeof raw !== 'string' || raw.length > 4096) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(host)) {
    const handle = url.pathname.split('/')[1]?.toLowerCase();
    if (CHANNELS[handle]) {
      return {type: 'collection', provider: 'YouTube', items: CHANNELS[handle].map(item => ({title: item.title, url: `https://www.youtube.com/playlist?list=${item.id}`}))};
    }
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || (/^\/(shorts|embed)\//.test(url.pathname) ? url.pathname.split('/')[2] : '');
    const playlist = url.searchParams.get('list');
    const start = startSeconds(url.searchParams.get('start') || url.searchParams.get('t') || '');
    if (id && VIDEO_ID.test(id)) return {type: 'video', provider: 'YouTube', src: youtubePlayer(id, LIST_ID.test(playlist || '') ? playlist : null, start)};
    if (playlist && LIST_ID.test(playlist)) return {type: 'playlist', provider: 'YouTube', src: youtubePlayer(null, playlist, start)};
    return null;
  }
  if (['podcasts.apple.com', 'embed.podcasts.apple.com'].includes(host) && /^\/[a-z]{2}\/podcast\/[^/]+\/id\d+\/?$/i.test(url.pathname)) {
    const player = new URL(`https://embed.podcasts.apple.com${url.pathname}`);
    const episode = url.searchParams.get('i');
    if (episode && /^\d+$/.test(episode)) player.searchParams.set('i', episode);
    player.searchParams.set('theme', 'dark');
    return {type: 'podcast', provider: 'Apple Podcasts', src: player.href};
  }
  const provider = PAGES.get(url.origin + url.pathname);
  return provider ? {type: 'page', provider, src: url.href} : null;
}
export function resourceAction(url) {
  const embed = getEmbed(url);
  if (!embed) return 'Open website';
  if (embed.type === 'podcast') return 'Listen in app';
  return embed.provider === 'YouTube' ? 'Watch in app' : 'View in app';
}

export function initResourceViewer() {
  const dialog = document.querySelector('#resource-dialog');
  let current = null, loadTimeout = null;
  const clearPlayer = () => {
    clearTimeout(loadTimeout);
    const previous = dialog.querySelector('iframe');
    if (previous) { previous.onload = null; previous.onerror = null; previous.remove(); }
  };
  function updateConnection() {
    const retry = dialog.querySelector('#resource-retry');
    if (retry) retry.disabled = !navigator.onLine;
  }
  function loadPlayer() {
    if (!current || !dialog.open) return;
    clearPlayer();
    const stage = dialog.querySelector('#resource-stage');
    const status = dialog.querySelector('#resource-status');
    const retry = dialog.querySelector('#resource-retry');
    stage.className = `resource-stage resource-${current.embed.type}`;
    stage.replaceChildren();
    retry.hidden = true;
    status.hidden = false;
    if (!navigator.onLine) {
      status.textContent = 'Connect to the internet to load this resource.';
      retry.hidden = false;
      updateConnection();
      return;
    }
    status.textContent = 'Loading…';
    const frame = document.createElement('iframe');
    frame.title = current.title;
    frame.src = current.embed.src;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    if (current.embed.type === 'page') frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
    frame.onload = () => { clearTimeout(loadTimeout); status.hidden = true; retry.hidden = true; };
    frame.onerror = () => {
      clearTimeout(loadTimeout);
      status.textContent = 'Could not load. Retry or open the source website.';
      retry.hidden = false;
      updateConnection();
    };
    stage.append(frame);
    loadTimeout = setTimeout(() => {
      status.textContent = 'Still loading. Retry or open the source website.';
      status.hidden = false;
      retry.hidden = false;
      updateConnection();
    }, 15000);
  }
  function selectResource(url, title) {
    const embed = getEmbed(url);
    if (!embed || embed.type === 'collection') return;
    current = {embed, title};
    const source = dialog.querySelector('#resource-source');
    source.href = url;
    source.textContent = `Open on ${embed.provider} ↗`;
    dialog.querySelector('#resource-provider').textContent = embed.provider;
    loadPlayer();
  }
  function openResource(url, title) {
    const embed = getEmbed(url);
    if (!embed) return;
    clearPlayer();
    const heading = document.createElement('h2');
    heading.id = 'resource-title';
    heading.textContent = title;
    dialog.replaceChildren();
    const header = document.createElement('div');
    header.className = 'resource-heading';
    header.append(heading);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'icon-button';
    close.setAttribute('aria-label', 'Close resource');
    close.textContent = '×';
    close.onclick = () => { clearPlayer(); dialog.close(); };
    header.append(close);
    dialog.append(header);
    let initialUrl = url;
    if (embed.type === 'collection') {
      const label = document.createElement('label');
      label.textContent = 'Playlist';
      const select = document.createElement('select');
      select.id = 'resource-playlist';
      for (const item of embed.items) select.add(new Option(item.title, item.url));
      select.onchange = () => selectResource(select.value, `${title} · ${select.selectedOptions[0].textContent}`);
      label.append(select);
      label.className = 'resource-playlists';
      dialog.append(label);
      initialUrl = embed.items[0].url;
    }
    const stage = document.createElement('div');
    stage.id = 'resource-stage';
    dialog.append(stage);
    const status = document.createElement('p');
    status.id = 'resource-status';
    status.className = 'muted small';
    status.setAttribute('role', 'status');
    dialog.append(status);
    const footer = document.createElement('div');
    footer.className = 'resource-footer';
    const provider = document.createElement('span');
    provider.id = 'resource-provider';
    provider.className = 'muted small';
    const source = document.createElement('a');
    source.id = 'resource-source';
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.className = 'button secondary';
    const retry = document.createElement('button');
    retry.id = 'resource-retry';
    retry.className = 'button secondary';
    retry.textContent = 'Retry';
    retry.onclick = loadPlayer;
    footer.append(provider, retry, source);
    dialog.append(footer);
    if (!dialog.open) dialog.showModal();
    selectResource(initialUrl, title);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-resource-url]');
    if (!link) return;
    event.preventDefault();
    openResource(link.href, link.closest('.resource-card')?.querySelector('h2')?.textContent || link.dataset.resourceTitle || link.textContent.trim());
  });
  dialog.addEventListener('cancel', clearPlayer);
  dialog.addEventListener('close', () => { clearPlayer(); current = null; });
  window.addEventListener('offline', () => {
    if (!dialog.open) return;
    const status = dialog.querySelector('#resource-status');
    status.textContent = 'You’re offline. Reconnect to load or continue playback.';
    status.hidden = false;
    dialog.querySelector('#resource-retry').hidden = false;
    updateConnection();
  });
  window.addEventListener('online', () => {
    updateConnection();
    if (dialog.open) {
      const status = dialog.querySelector('#resource-status');
      status.textContent = 'Connected. Select Retry if needed.';
      status.hidden = false;
    }
  });
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); });
  window.addEventListener('pagehide', clearPlayer);
}
