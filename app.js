import {
  lessons,
  tones,
  extraResources
} from './data.js';
import {
  STORAGE_KEY,
  newState,
  validateState,
  dayKey,
  schedule,
  streak,
  accrueTimer
} from './state.js';
const $ = (s, root = document) => root.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));
const external = (url, label, cls = '') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
let storageError = false,
  loadError = false,
  state;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  state = raw ? validateState(JSON.parse(raw)) : newState();
} catch {
  state = newState();
  loadError = true;
}
// Recover only bounded timer time after a closed/reloaded tab.
if (state.timer) accrueTimer(state);
let resources = [],
  resourceFilter = 'Start here',
  search = '',
  revealed = false,
  reviewed = 0,
  currentCard = null,
  toastTimeout, activeLesson = null,
  lessonMode = 'learn',
  recorder = null,
  recordStream = null,
  recordUrl = null,
  recordTimeout;
const today = () => {
  const key = dayKey();
  return state.days[key] ??= {
    done: [],
    seconds: 0,
    reviews: 0
  };
};

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    storageError = true;
    toast('Browser storage is unavailable. Download a backup to keep your progress.');
    return false;
  }
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 5000);
}

function currentLesson() {
  return lessons.find(l => !state.completed.includes(l.id)) || lessons[lessons.length - 1];
}

function dueCards() {
  return state.cards.filter(c => c.due <= Date.now()).sort((a, b) => a.due - b.due);
}

function dueCount() {
  return dueCards().length;
}

function intro(eyebrow, title, subtitle) {
  return `<div class="page-intro"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><span class="date-chip">${new Date().toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</span></div>`;
}

function stats() {
  return `<div class="stats"><div class="stat"><span class="stat-icon">♧</span><div><strong>${streak(state.days)}<small>days</small></strong><p>Current practice streak</p></div></div><div class="stat"><span class="stat-icon">◷</span><div><strong>${Math.floor(today().seconds/60)}<small>/ ${state.profile.minutes} min</small></strong><p>Practice logged today</p></div></div><div class="stat"><span class="stat-icon">▱</span><div><strong>${dueCount()}<small>phrases</small></strong><p>Ready for review</p></div></div></div>`;
}

function taskList() {
  const m = state.profile.minutes;
  return [{
    id: 'sound',
    title: 'Tune your ear',
    detail: 'Pinyin & tones · listen, then imitate',
    minutes: m / 6
  }, {
    id: 'learn',
    title: 'Learn something useful',
    detail: `${currentLesson().title} · one small lesson`,
    minutes: m / 3
  }, {
    id: 'review',
    title: 'Make it stick',
    detail: `${dueCount()} phrases ready · recall before revealing`,
    minutes: m / 6
  }, {
    id: 'speak',
    title: 'Say it out loud',
    detail: 'Listen, repeat, then try without the script',
    minutes: m / 3
  }];
}

function renderToday() {
  const lesson = currentLesson(),
    done = today().done;
  return `${intro('YOUR DAILY DOSE OF MANDARIN',state.profile.name?`Nǐ hǎo, ${esc(state.profile.name)}.`:'A little better, every day.','You don’t need to learn it all today. Just take the next small step.')}<section class="hero"><div class="hero-copy"><div class="eyebrow">YOUR NEXT SMALL STEP · WEEK ${lesson.week}</div><h2>${esc(lesson.title)}<br>Start a real conversation.</h2><p>${esc(lesson.goal)} A few useful phrases, one moment of confidence.</p><button class="button primary" data-lesson="${lesson.id}">Let’s get started <span>→</span></button><span class="hero-meta">Beginner friendly · ${state.profile.minutes/3} min</span></div><div class="hero-art" aria-hidden="true"><span class="orb"></span><span class="hanzi" lang="zh-Hans">你好</span><span class="art-label">NǏ HǍO</span></div></section>${stats()}<div class="dashboard-grid"><section><div class="section-heading"><h2>Your daily rhythm</h2><small>${done.length} of 4 complete</small></div><div class="routine-list">${taskList().map(t=>`<div class="routine-row"><button class="check ${done.includes(t.id)?'done':''}" data-check="${t.id}" aria-label="${done.includes(t.id)?'Unmark':'Mark'} ${t.title} complete" aria-pressed="${done.includes(t.id)}">${done.includes(t.id)?'✓':''}</button><div class="routine-copy"><h3>${t.title}</h3><p>${t.detail}</p></div><span class="duration">${Number(t.minutes.toFixed(1))} min</span><button class="arrow-button" data-task="${t.id}" aria-label="Start ${t.title}">↗</button></div>`).join('')}</div><p class="daily-note"><span>✧</span> Your rhythm, not a race. Even 15 minutes is a good day.</p></section><aside><section class="panel phrase-panel"><div class="eyebrow">A PHRASE TO TAKE WITH YOU</div><div class="phrase-hanzi" lang="zh-Hans">请再说一遍。</div><p class="pinyin">Qǐng zài shuō yī biàn.</p><p class="translation">Please say it again.</p><button class="audio-button" data-say="请再说一遍。">◖)) Listen & repeat</button><p class="phrase-tip">Your most useful beginner skill? Asking for another try.</p></section><div class="tutor-note"><span class="symbol">☷</span><div><h3>A little human connection goes a long way.</h3><p>Try a short weekly conversation with a patient speaker or tutor. Ask for one specific pronunciation correction.</p><a href="#resources">Find speaking resources ↗</a></div></div></aside></div><div class="bottom-banner"><span>♧</span><p>One home for your routine. Great resources for the rest.<br>Our approach: a personal companion + trusted learning tools.</p><a href="#resources">Explore the library ↗</a></div>`;
}

function renderPath() {
  return `${intro('YOUR FIRST FOUR WEEKS','Small steps. Useful words.','Eight practical missions. Repeat each over several days; move on when you can use it.')}<div class="notice">Start with sounds and tiny conversations. The weeks are a suggested pace, not a proficiency promise. Use one core course alongside this path.</div>${[1,2,3,4].map(w=>`<div class="week-label">WEEK ${w} · ${['GET COMFORTABLE','EVERYDAY MOMENTS','OUT IN THE WORLD','PUT IT TOGETHER'][w-1]}</div><div class="cards-grid">${lessons.filter(l=>l.week===w).map((l,i)=>`<article class="panel lesson-card"><span class="tag">${state.completed.includes(l.id)?'✓ Practised':`MISSION ${String((w-1)*2+i+1).padStart(2,'0')}`}</span><h2>${l.title}</h2><p>${l.goal}</p><button class="button secondary" data-lesson="${l.id}">${state.completed.includes(l.id)?'Practise again':'Open lesson'} →</button></article>`).join('')}</div>`).join('')}<div class="notice spaced">Alongside these missions: take the first matching beginner lessons in your chosen course. Once a week, check whether you can introduce yourself without reading.</div>`;
}

function renderPractice() {
  if (!currentCard || !dueCards().some(c => c.id === currentCard.id)) {
    currentCard = dueCards()[0] || null;
    revealed = false;
  }
  const c = currentCard;
  return `${intro('RECALL · REPEAT · REMEMBER','Make a few phrases yours.','Try saying the Mandarin before you reveal it. An honest “again” helps more than a lucky guess.')}<div class="practice-layout"><section class="panel flashcard"><span class="eyebrow">${dueCount()} READY · ${reviewed} REVIEWED THIS SESSION</span>${c?`<p class="prompt">${esc(c.english)}</p>${revealed?`<div class="revealed"><div class="phrase-hanzi" lang="zh-Hans">${esc(c.hanzi)}</div><p class="pinyin">${esc(c.pinyin)}</p><button class="audio-button" data-say="${esc(c.hanzi)}">◖)) Hear device voice</button></div><div class="rating-buttons">${['again','good','easy'].map(r=>`<button class="button rating-${r}" data-rate="${r}">${{again:'Again',good:'Got it',easy:'Easy'}[r]}<small>${intervalLabel(schedule(c,r).due)}</small></button>`).join('')}</div>`:`<p class="muted small">Say it out loud. It’s okay to take your time.</p><button class="button primary" id="reveal">Reveal phrase →</button>`}`:`<div class="phrase-hanzi">✓</div><h2>You’re all caught up.</h2><p class="muted">${nextReviewLabel()}</p><a class="button primary" href="#path">Try a useful lesson →</a>`}</section><aside class="panel"><h2>Add your own phrase</h2><p class="muted small">Keep phrases you actually want to use. Check new phrases with a teacher or dictionary.</p><form id="phrase-form" class="form-stack"><label>Chinese<input required name="hanzi" maxlength="200" placeholder="你好。" lang="zh-Hans"></label><label>Pinyin<input required name="pinyin" maxlength="200" placeholder="Nǐ hǎo."></label><label>Meaning<input required name="english" maxlength="200" placeholder="Hello."></label><button class="button primary" type="submit">Add to my phrases +</button></form><hr><button class="text-button" id="export-tsv">Export all ${state.cards.length} phrases for Anki ↗</button><p class="muted small spaced">Simple spaced review: again in 10 minutes, got it in at least a day, easy in at least three. Intervals grow as you recall.</p></aside></div><p class="muted small spaced">Pinyin shows dictionary tones. Connected speech can sound different. Device speech is a rehearsal aid; use native recordings to check it.</p>`;
}

function intervalLabel(due) {
  const min = Math.round((due - Date.now()) / 60000);
  return min < 60 ? `${min} min` : `${Math.round(min/1440)} day${Math.round(min/1440)===1?'':'s'}`;
}

function nextReviewLabel() {
  const next = state.cards.reduce((v, c) => Math.min(v, c.due), Infinity);
  return Number.isFinite(next) ? `Next review: ${new Date(next).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}. Come back then, or practise a lesson.` : 'Add a personal phrase or open a lesson to get started.';
}

function renderResources() {
  const filtered = resources.filter(r => (resourceFilter === 'All' || r.level === resourceFilter || r.category === resourceFilter) && `${r.title} ${r.note} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
  return `${intro('LESS SEARCHING · MORE LEARNING','Your small, useful toolkit.','Choose one course, one dictionary, and something easy to listen to. Add more when you need it.')}<div class="notice">Recommended hybrid: this app for your daily rhythm and phrases; a core course for structure; native audio and people for listening and feedback. Resources open on their own websites.</div><details><summary>The video behind this toolkit · source notes & timestamps</summary><p>Brian Wiles, ${external('https://www.youtube.com/watch?v=WyehfFj72zY','How to Learn Chinese (Mandarin) On Your Own for FREE')}. Audio was independently transcribed with Whisper base.en and compared with automatic English captions on November 24, 2026. All 26 description links were checked. Transcription is machine-generated, not human-verified.</p><ul><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=30s','00:30 · Core course')} · Choose a consistent learning sequence.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=83s','01:23 · Pronunciation')} · Start pinyin and tones early; seek feedback.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=212s','03:32 · Vocabulary')} · Review with Anki and use Pleco for lookups.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=323s','05:23 · Listening')} · Add harder audio as comprehension grows.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=467s','07:46 · Reading')} · Keep vocabulary aligned; use graded material.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=571s','09:31 · Writing')} · Handwriting is optional; learn pinyin input.</li><li>${external('https://www.youtube.com/watch?v=WyehfFj72zY&t=638s','10:38 · Routine')} · Practise consistently; consider weekly tutoring.</li></ul><p>Our adaptation: a 30-minute beginner routine, easy listening from day one, and optional handwriting. The video’s HSK 1–6 references describe its materials, not a claim about today’s exam framework. Pricing and regional availability can change. Affiliate redirects are replaced with direct links.</p></details><div class="filters" role="group" aria-label="Filter resources">${['Start here','All','Courses','Pronunciation','Listening','Reading','Speaking','Tools','Books','Writing','Later','Optional'].map(f=>`<button class="filter ${resourceFilter===f?'active':''}" data-filter="${f}" aria-pressed="${resourceFilter===f}">${f}</button>`).join('')}</div><label for="resource-search" class="small muted">Find a resource</label><input id="resource-search" class="search-input" type="search" placeholder="Search this toolkit…" value="${esc(search)}"><div id="resource-results" class="cards-grid">${resourceCards(filtered)}</div><p class="muted small spaced">26 links from the video, plus four recommendations. A successful page response does not verify every lesson, shared deck, price, or license. No third-party content is copied into this app.</p>`;
}

function resourceCards(items) {
  return items.length ? items.map(r => `<article class="panel resource-card"><div class="resource-meta"><span class="tag">${r.category}</span><span class="tag ${r.level==='Later'?'warm':''}">${r.level}</span></div><h2>${esc(r.title)}</h2><p>${esc(r.note)}</p><small class="muted">${esc(r.cost)} · ${esc(r.origin)}</small>${external(r.url,'Open resource')}</article>`).join('') : '<p class="empty">No matches. Try another search or filter.</p>';
}

function renderProgress() {
  const totalSeconds = Object.values(state.days).reduce((n, d) => n + d.seconds, 0);
  const reviews = Object.values(state.days).reduce((n, d) => n + d.reviews, 0);
  const history = Array.from({length: 7}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const seconds = state.days[dayKey(date)]?.seconds || 0;
    const width = Math.min(65, (seconds / 60 / state.profile.minutes) * 65);
    const label = date.toLocaleDateString('en', {weekday: 'short', day: 'numeric'});
    return `<div class="history-row"><time datetime="${dayKey(date)}">${label}</time><span class="bar" style="width:${width}%"></span><span class="minutes">${Math.floor(seconds / 60)} min</span></div>`;
  }).join('');
  const progress = (state.completed.length / lessons.length) * 100;
  return `${intro('NOTICE THE SMALL WINS', 'Practice adds up.', 'Track the work you’ve done, then see what you can do with it.')}${stats()}
    <div class="cards-grid">
      <section class="panel">
        <h2>Your last seven days</h2>${history}
        <p class="muted small">Minutes come from your timer or an entry below. Checkmarks record completed activities separately.</p>
      </section>
      <section class="panel">
        <h2>Your beginner journey</h2>
        <p class="muted">${state.completed.length} of ${lessons.length} missions practised</p>
        <div class="progress-track" role="progressbar" aria-label="Missions practised" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${state.completed.length}"><div style="width:${progress}%"></div></div>
        <p class="muted small">${Math.floor(totalSeconds / 60)} total minutes · ${reviews} phrase reviews · ${state.cards.length} saved phrases</p>
        <h3 class="spaced">A useful weekly check</h3>
        <ul class="checklist"><li>Can I introduce myself without a script?</li><li>Can I understand a familiar question?</li><li>Can I ask someone to say it again?</li><li>What one sound should I ask a speaker to check?</li></ul>
      </section>
      <section class="panel">
        <h2>Practised somewhere else?</h2>
        <p class="muted small">Log today’s course, listening, or conversation time.</p>
        <form id="log-form" class="form-stack"><label>Minutes<input type="number" name="minutes" min="1" max="180" required placeholder="10"></label><button class="button primary">Log practice</button></form>
      </section>
      <section class="panel">
        <h2>Keep your progress safe</h2>
        <p class="muted small">Progress is stored on this device, in this browser. Export regularly so you can move it to another device.</p>
        <button class="button secondary" id="progress-export">Download backup ↓</button>
        <p class="muted small spaced">These numbers describe practice, not a measured language level. Real conversations are your most useful checkpoint.</p>
      </section>
    </div>`;
}

function render() {
  const page = ['today', 'path', 'practice', 'resources', 'progress'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';
  document.querySelectorAll('[data-page]').forEach(a => {
    if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $('#breadcrumb').textContent = {
    today: 'Your daily practice',
    path: 'Your beginner journey',
    practice: 'Your personal phrase collection',
    resources: 'Your learning toolkit',
    progress: 'Your practice, over time'
  } [page];
  $('#main').innerHTML = (storageError || loadError ? `<div class="notice storage-warning">${loadError?'Saved data could not be loaded. Existing browser data has been left intact. Restore a valid backup before making changes.':'Progress cannot be saved in this browser. Download a backup before closing.'}</div>` : '') + ({
    today: renderToday,
    path: renderPath,
    practice: renderPractice,
    resources: renderResources,
    progress: renderProgress
  } [page])();
  bindPage();
}

function bindPage() {
  document.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.lesson));
  document.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
  document.querySelectorAll('[data-check]').forEach(b => b.onclick = () => {
    const done = today().done,
      id = b.dataset.check;
    today().done = done.includes(id) ? done.filter(x => x !== id) : [...done, id];
    if (persist()) render();
  });
  document.querySelectorAll('[data-task]').forEach(b => b.onclick = () => {
    if (b.dataset.task === 'review') {
      location.hash = 'practice';
      return;
    }
    openLesson(currentLesson().id, b.dataset.task);
  });
  $('#reveal')?.addEventListener('click', () => {
    revealed = true;
    render();
  });
  document.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => rate(b.dataset.rate));
  $('#phrase-form')?.addEventListener('submit', e => {
    e.preventDefault();
    if (state.cards.length >= 3000) {
      toast('Your phrase collection is full. Export it for Anki.');
      return;
    }
    const f = new FormData(e.target),
      phrase = {
        id: crypto.randomUUID(),
        hanzi: f.get('hanzi').trim(),
        pinyin: f.get('pinyin').trim(),
        english: f.get('english').trim(),
        source: 'personal',
        due: 0,
        interval: 0,
        reviews: 0
      };
    if (!phrase.hanzi || !phrase.pinyin || !phrase.english) {
      toast('Please fill in all three fields.');
      return;
    }
    if (state.cards.some(c => c.hanzi === phrase.hanzi)) {
      toast('That phrase is already in your collection.');
      return;
    }
    state.cards.push(phrase);
    if (persist()) {
      toast('Phrase added. Try recalling it now.');
      render();
    }
  });
  $('#export-tsv')?.addEventListener('click', exportTSV);
  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    resourceFilter = b.dataset.filter;
    render();
    $(`[data-filter="${resourceFilter}"]`)?.focus();
  });
  $('#resource-search')?.addEventListener('input', e => {
    search = e.target.value;
    const f = resources.filter(r => (resourceFilter === 'All' || r.level === resourceFilter || r.category === resourceFilter) && `${r.title} ${r.note} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
    $('#resource-results').innerHTML = resourceCards(f);
  });
  $('#progress-export')?.addEventListener('click', exportBackup);
  $('#log-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const n = Number(new FormData(e.target).get('minutes'));
    if (!Number.isInteger(n) || n < 1 || n > 180) return;
    today().seconds = Math.min(86400, today().seconds + n * 60);
    if (persist()) {
      render();
      toast('Practice time saved.');
    }
  });
}

function persist() {
  if (loadError) {
    toast('Restore a valid backup first to protect your existing saved data.');
    return false;
  }
  return save();
}

function rate(rating) {
  if (!revealed || !currentCard) return;
  const i = state.cards.findIndex(c => c.id === currentCard.id);
  state.cards[i] = schedule(state.cards[i], rating);
  today().reviews++;
  reviewed++;
  currentCard = null;
  revealed = false;
  persist();
  render();
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    toast('Device speech is unavailable. Use the pronunciation resources for native audio.');
    return;
  }
  const voices = speechSynthesis.getVoices(),
    voice = voices.find(v => /^zh[-_]CN/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang));
  if (!voice) {
    toast('No Mandarin voice found. Install a Chinese voice in your device settings, or use the resource library.');
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice.lang;
  u.voice = voice;
  u.rate = .8;
  u.onerror = () => toast('This voice could not play. Check device voice downloads or use native audio in the library.');
  speechSynthesis.speak(u);
}

function phraseHTML(p) {
  return `<div class="lesson-phrase"><div><strong lang="zh-Hans">${esc(p[0])}</strong><span class="pinyin">${esc(p[1])}</span><small>${esc(p[2])}</small></div><button class="audio-button" data-say="${esc(p[0])}" aria-label="Hear ${esc(p[2])}">◖))</button></div>`;
}

function openLesson(id, mode = 'learn') {
  activeLesson = lessons.find(l => l.id === id) || lessons[0];
  lessonMode = mode;
  const l = activeLesson,
    dialog = $('#lesson-dialog');
  stopRecording();
  dialog.innerHTML = `<div class="dialog-heading"><div><div class="eyebrow">WEEK ${l.week} · ${mode==='sound'?'SOUNDS FIRST':mode==='speak'?'LISTEN & SPEAK':'A SMALL PRACTICAL LESSON'}</div><h2>${mode==='sound'?'Get to know the tones':esc(l.title)}</h2></div><button class="icon-button close-dialog" aria-label="Close lesson">×</button></div><p class="muted">${esc(l.goal)}</p>${mode==='sound'?`<p>Listen to each syllable. Hum the pitch, then repeat the syllable. The neutral tone is short and unstressed; it has no fixed pitch.</p><div class="tone-grid">${tones.map(t=>`<button class="tone" data-say="${t.text}"><svg width="65" height="45" viewBox="0 0 100 90" aria-hidden="true"><path d="${t.path}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg><strong>${t.pinyin}</strong><span>${t.label}</span></button>`).join('')}</div><p class="muted small">These curves are teaching sketches. A third tone is often low in connected speech rather than a full dip and rise. Use a native model for comparison.</p>${external('https://www.youtube.com/watch?v=FlaJ12tmtu4&t=31s','Open the native pronunciation guide','button secondary')}`:''}${mode==='speak'?`<div class="notice">Listen once for meaning. Read if you need help, listen again, then imitate one line at a time. Try the exchange without looking.</div>${l.dialogue.map(p=>phraseHTML([p[0],'',p[1]])).join('')}<details><summary>Show the phrase pinyin</summary>${l.phrases.map(phraseHTML).join('')}</details>`:l.phrases.map(phraseHTML).join('')}<p class="muted small spaced">${esc(l.note)}</p><div class="lesson-exercise"><strong>Try it in real life</strong><p>${esc(l.challenge)}</p></div>${mode==='learn'?`<details><summary>Quick recall: ${esc(l.question)}</summary><p lang="zh-Hans">${esc(l.answer)}</p></details>`:''}<div class="timer-block"><div><div class="eyebrow">FOCUSED PRACTICE</div><span class="timer-value" id="timer-value">00:00</span></div><button class="button secondary" id="timer-toggle">${state.timer?'Pause & log':'Start timer'}</button></div>${mode==='speak'?`<button class="button secondary" id="record">Record yourself ◉</button><audio id="playback" controls hidden></audio><p class="muted small spaced">Recording stays in memory and is discarded when you close this lesson. Listen for differences; there is no automatic pronunciation score.</p>`:''}<p class="muted small">Audio here uses a device voice when available. Native recordings in the library are the better pronunciation model.</p><div class="button-row"><button class="button primary" id="finish-lesson">${mode==='learn'?'I practised this · save phrases':'Mark activity complete'} ✓</button><button class="button secondary close-dialog">Close</button></div>`;
  dialog.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
  dialog.querySelectorAll('.close-dialog').forEach(b => b.onclick = () => dialog.close());
  $('#timer-toggle').onclick = toggleTimer;
  $('#finish-lesson').onclick = finishLesson;
  $('#record')?.addEventListener('click', toggleRecording);
  if (!dialog.open) dialog.showModal();
  updateTimer();
}

function toggleTimer() {
  if (state.timer) {
    accrueTimer(state);
    persist();
    $('#timer-toggle').textContent = 'Start timer';
    render();
  } else {
    state.timer = {
      started: Date.now(),
      task: lessonMode === 'learn' ? 'learn' : lessonMode
    };
    persist();
    $('#timer-toggle').textContent = 'Pause & log';
  }
  updateTimer();
}

function updateTimer() {
  const el = $('#timer-value');
  if (!el) return;
  const seconds = state.timer ? Math.min(7200, Math.max(0, Math.floor((Date.now() - state.timer.started) / 1000))) : 0;
  el.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

function finishLesson() {
  if (state.timer) accrueTimer(state);
  const task = lessonMode;
  if (!today().done.includes(task)) today().done.push(task);
  if (task === 'learn') {
    if (!state.completed.includes(activeLesson.id)) state.completed.push(activeLesson.id);
    for (const [i, p] of activeLesson.phrases.entries()) {
      const id = `${activeLesson.id}-${i}`;
      if (!state.cards.some(c => c.id === id) && state.cards.length < 3000) state.cards.push({
        id,
        hanzi: p[0],
        pinyin: p[1],
        english: p[2],
        source: activeLesson.id,
        due: 0,
        interval: 0,
        reviews: 0
      });
    }
  }
  if (persist()) {
    toast(task === 'learn' ? 'Mission practised. Its phrases are in your review collection.' : 'Practice saved. A small step forward.');
    $('#lesson-dialog').close();
    render();
  }
}
async function toggleRecording() {
  const button = $('#record');
  if (recorder?.state === 'recording') {
    stopRecording(false);
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    toast('Recording is unavailable in this browser. Try your device’s voice recorder.');
    return;
  }
  button.disabled = true;
  button.textContent = 'Waiting for microphone…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    if (!$('#lesson-dialog').open || !document.contains(button)) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }
    recordStream = stream;
    const chunks = [],
      localRecorder = new MediaRecorder(stream);
    recorder = localRecorder;
    localRecorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };
    localRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (!$('#lesson-dialog').open || !document.contains(button)) return;
      if (recordUrl) URL.revokeObjectURL(recordUrl);
      recordUrl = URL.createObjectURL(new Blob(chunks, {
        type: localRecorder.mimeType
      }));
      $('#playback').src = recordUrl;
      $('#playback').hidden = false;
      button.textContent = 'Record again ◉';
      button.classList.remove('recording');
    };
    localRecorder.start();
    button.disabled = false;
    button.textContent = 'Stop recording ■';
    button.classList.add('recording');
    recordTimeout = setTimeout(() => stopRecording(false), 60000);
  } catch {
    recordStream?.getTracks().forEach(t => t.stop());
    button.disabled = false;
    button.textContent = 'Record yourself ◉';
    toast('Microphone could not be opened. Check browser permissions or use your device recorder.');
  }
}

function stopRecording(discard = true) {
  clearTimeout(recordTimeout);
  if (recorder?.state === 'recording') {
    if (discard) recorder.onstop = null;
    recorder.stop();
  }
  recordStream?.getTracks().forEach(t => t.stop());
  recordStream = null;
  recorder = null;
  if (discard && recordUrl) {
    URL.revokeObjectURL(recordUrl);
    recordUrl = null;
  }
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {
      type
    })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportBackup() {
  const copy = structuredClone(state);
  if (copy.timer) accrueTimer(copy);
  download(`little-mandarin-${dayKey()}.json`, JSON.stringify(copy, null, 2), 'application/json');
  toast('Backup downloaded. Keep it somewhere safe.');
}

function exportTSV() {
  const clean = s => s.replace(/[\t\r\n]/g, ' ');
  const lines = ['#separator:Tab', '#html:false', '#columns:Chinese\tPinyin\tEnglish', ...state.cards.map(c => [c.hanzi, c.pinyin, c.english].map(clean).join('\t'))];
  download('little-mandarin-phrases.tsv', lines.join('\n'), 'text/tab-separated-values;charset=utf-8');
  toast('Export downloaded. Map Chinese, Pinyin, and English fields in Anki.');
}
$('#profile-settings').onclick = () => $('#settings-button').click();
$('#settings-button').onclick = () => {
  $('#name').value = state.profile.name;
  $('#minutes').value = state.profile.minutes;
  $('#settings').showModal();
};
$('#settings .close-dialog').onclick = () => $('#settings').close();
$('#settings-form').onsubmit = e => {
  e.preventDefault();
  state.profile.name = $('#name').value.trim();
  state.profile.minutes = Number($('#minutes').value);
  if (persist()) {
    $('#settings').close();
    render();
    toast('Your preferences are saved.');
  }
};
$('#export').onclick = exportBackup;
$('#import').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5e6) throw Error('This file is too large. Choose a backup under 5 MB.');
    const imported = validateState(JSON.parse(await file.text()));
    if (!confirm(`Restore ${imported.cards.length} phrases and ${Object.keys(imported.days).length} days of history? This replaces current progress. Download a backup first if you want to keep it.`)) return;
    imported.timer = null;
    state = imported;
    loadError = false;
    currentCard = null;
    if (save()) {
      $('#settings').close();
      render();
      toast('Backup restored. Welcome back.');
    }
  } catch (error) {
    toast(error.message === 'Unexpected end of JSON input' ? 'This backup is not valid JSON.' : `Could not restore: ${error.message}`);
  } finally {
    e.target.value = '';
  }
};
$('#lesson-dialog').addEventListener('close', () => {
  stopRecording();
  if (state.timer) {
    accrueTimer(state);
    persist();
  }
  window.speechSynthesis?.cancel();
  render();
});
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
  $('#main').focus({
    preventScroll: true
  });
});
let activeDate = dayKey();
setInterval(() => {
  updateTimer();
  if (state.timer && Date.now() - state.timer.started >= 7200000) {
    accrueTimer(state);
    persist();
    render();
    if ($('#timer-toggle')) $('#timer-toggle').textContent = 'Start timer';
    toast('Timer paused after two hours.');
  }
  if (dayKey() !== activeDate) {
    activeDate = dayKey();
    render();
  }
}, 1000);
window.addEventListener('pagehide', () => {
  stopRecording();
  if (!loadError) save();
});

function connectivity() {
  $('#connection').innerHTML = `<i></i> ${navigator.onLine?'Local-first':'Offline'}`;
}
window.addEventListener('online', connectivity);
window.addEventListener('offline', connectivity);
connectivity();
let installPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  $('#install').hidden = false;
});
$('#install').onclick = async () => {
  if (installPrompt) {
    await installPrompt.prompt();
    installPrompt = null;
    $('#install').hidden = true;
  }
};
window.addEventListener('appinstalled', () => {
  $('#install').hidden = true;
  toast('App installed. A little Mandarin, whenever you like.');
});
try {
  const response = await fetch('./resources.json');
  if (!response.ok) throw Error();
  resources = [...await response.json(), ...extraResources];
} catch {
  resources = extraResources;
  toast('The complete library could not load. Reload online to restore all video links.');
}
render();
if (!loadError) save();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => toast('Offline setup failed. The app still works online; reload to try again.'));
}
