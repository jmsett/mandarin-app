# Little Mandarin

A minimal, buildless, offline-ready beginner Mandarin PWA. Plain HTML, CSS, and JavaScript; no package installation, account, API key, tracking, or backend.

The recommended approach is a **hybrid**: use this app to make practice consistent and personal, and use established courses, native recordings, dictionaries, and human feedback for their specialist strengths. This is a practical starter companion, not a complete Mandarin curriculum or a proficiency assessment.

## Start locally

From the repository directory:

```sh
python3 -m http.server 8080
```

Open <http://localhost:8080>. JavaScript modules and service workers need HTTP; opening `index.html` directly is insufficient. Production requires HTTPS. Everything is relative to the app directory so GitHub Pages project paths work.

## What works

- Daily practice with 15-, 30-, or 60-minute budgets and independent activity checkmarks.
- Eight original beginner missions over a suggested four-week path: greetings, requests for repetition, courtesy, drinks, prices, directions, introductions, and a short conversation.
- Listen-and-repeat exercises, tone sketches, and short original dialogues.
- Optional microphone recording for playback and self-comparison. Recordings remain in memory, stop after 60 seconds, and are discarded when the lesson closes; they are not uploaded.
- Device Mandarin text-to-speech when a Chinese voice is installed. Native audio is linked externally; **no automated pronunciation scoring**.
- A personal phrase collection with simple spaced review: Again = 10 minutes; Got it = at least 1 day; Easy = at least 3 days; successful intervals grow up to 365 days. This is a transparent starter scheduler, not FSRS or Anki sync.
- Timer-based practice logs, manual entries for outside study, progress history, and local-date activity tracking. Timer sessions are capped at two hours and split across local midnight.
- JSON backup/restore with validation and an explicit replacement confirmation; three-column TSV export for Anki. Create/map Chinese, Pinyin, and English fields when importing.
- A searchable library with all 26 resources from the supplied video and four additional recommendations.
- Install manifest, standard and maskable icons, and a scoped service worker caching only first-party app assets.

## Interface and themes

The interface uses task labels and instructional copy, without slogans or motivational messages. One shared layout supports three saved palettes:

| Theme | Palette |
| --- | --- |
| Dragon (default) | Black, gold, vermilion; inspired by *Enter the Dragon*. |
| Cyberpunk | Graphite, yellow, cyan. |
| Synthwave | Indigo, pink, violet. |

Select a theme in the header or Preferences. The choice is saved in the existing local profile and included in JSON backups. Backups from before themes were added remain compatible and use Dragon by default. The app shell and icons use Dragon as their install-time default; browser chrome follows the selected palette while running.

The requested [`design-mobile-apps` skill](https://github.com/designed-by-ai/skills/tree/main/skills/design-mobile-apps) was installed with `npx skills add https://github.com/designed-by-ai/skills --skill design-mobile-apps --global --agent codex --yes`. Its shared-token, navigation, touch-target, inset, and state-preservation guidance informed this pass. At the user’s request the implementation uses **local styling without Sleek**; no Sleek-generated screens or authenticated design runs were used. The application still ships without npm dependencies.

## A practical beginner routine

Start with **30 minutes a day**, then adjust to a schedule you can sustain:

| Time | Practice | What to do |
| --- | --- | --- |
| 5 min | Sounds | Listen to a native model; imitate a small set of syllables or tone pairs. |
| 10 min | Core lesson | Follow one course sequence, then practise one useful app mission. |
| 5 min | Recall | Say a phrase before revealing it. Add only useful new phrases. |
| 10 min | Listen and speak | Understand a tiny dialogue, imitate it, then try a personal variation. |

Once a week, ask a tutor or patient speaker to check a short introduction and one pronunciation issue. Use a pinyin keyboard early; add handwriting if your goals call for it. Match listening difficulty to what you can understand with context. Native podcasts are optional later material.

Pick **one** core course: Mandarin Corner/textbook-aligned material, or HelloChinese if you prefer an app. Keep Pleco as a dictionary. Use beginner native recordings and easy graded reading such as Du Chinese. A subscription is not required to start; check each provider’s current terms and free content before paying. Don’t try all resources at once.

## Video and research provenance

Source: Brian Wiles, [How to Learn Chinese (Mandarin) On Your Own for FREE](https://www.youtube.com/watch?v=WyehfFj72zY).

On **2026-11-24**, the full 708.928-second audio was downloaded and independently transcribed locally with faster-whisper `base.en` (CPU, int8). The resulting 148 segments were reviewed alongside the automatic English caption track and description. Both transcriptions are machine-generated, not human-verified. The app’s Resource library contains concise timestamped notes. The full third-party transcript and audio are not redistributed.

All 26 description links returned HTTP 200 during the audit. Redirects and page titles were inspected. This confirms reachability, not the correctness, license, regional availability, or price of every resource. Anki’s JavaScript-rendered pages did not expose deck details to the audit; they are explicitly marked unverified. Shortlinks resolve to textbook audio playlists, so they are described as audio rather than complete video courses. Book affiliate parameters and the tutoring affiliate link are replaced with direct links. The sponsor discount is not presented as a current offer.

[resources.json](resources.json) records original/resolved URLs, check date, status, and original editorial notes. It preserves the video’s resource labels without claiming its HSK references describe today’s exam framework. The original description does not include a streaming database link, despite a mention in the captions; none is invented here.

Additional sources consulted:

- [HelloChinese: official product information](https://www.hellochinese.cc/)
- [Pleco: official flashcard documentation](https://iphone.pleco.com/manual/30200/flashtut.html)
- [Du Chinese: official product information](https://duchinese.net/)
- [Hacking Chinese: beginner listening guidance](https://www.hackingchinese.com/beginner-chinese-listening-practice-what-to-listen-to-and-how/)
- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [MDN: PWA installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

## Publish on GitHub Pages

Repository: <https://github.com/jmsett/mandarin-app>

1. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. You need repository admin access for this one-time setting.
2. Push to `main`, or run **Publish Little Mandarin** from the Actions tab after enabling Pages.
3. The workflow uploads only the app files and deploys them to Pages.
4. After a successful deployment, the expected project URL is <https://jmsett.github.io/mandarin-app/>. This is an expected address, not evidence of a completed deployment.

If a first workflow run fails because Pages is not enabled, set the source as above and rerun the workflow. No secrets are required in the repository. Git SSH access alone does not provide GitHub API access to change the Pages setting.

## Offline and updates

Visit once online and let the service worker install. The application shell, original lessons, phrase practice, library metadata, and progress views then work offline. External websites, videos, and podcasts need internet; a device speech voice might also need downloading. This app does not download third-party lessons or native audio for offline playback.

A release must change the `CACHE` version in `sw.js` when app assets change. Installation refreshes and caches the complete shell before activating it. An already-open page keeps its current view and shows **Update** when the new version takes control. Clicking Update logs any running timer and reloads the app. Update checks bypass the browser’s script cache and repeat when returning to the app or reconnecting (at most once per minute). Only older `little-mandarin-shell-*` caches are removed; progress remains in localStorage.

For older installs without an Update button, open <https://jmsett.github.io/mandarin-app/?update=1> while online. This explicitly reloads that tab into the new shell after activation, even if other app tabs are open. It does not clear browser storage or reset progress.

## Data and limitations

Progress belongs to this **browser and origin**, not a GitHub account. It does not sync between devices. Moving from localhost to the published address requires a JSON export/import. Clearing site data, private browsing, or browser storage eviction can remove progress. Download regular backups. Malformed existing data is preserved rather than silently overwritten; restore a valid backup to recover normal editing.

Pinyin shows dictionary tones. Connected-speech changes are discussed in lesson notes. Machine voices vary and should not replace a native model or teacher. The example name/country are placeholders to substitute, not assumptions about the learner. The eight missions form a starter set; a full curriculum, professionally recorded audio, a larger vocabulary bank, and content review by a Mandarin teacher are useful next additions.

## Verify

Browser integration checks use Python Playwright (development only):

```sh
python3 -m venv /tmp/mandarin-qa-env
/tmp/mandarin-qa-env/bin/pip install playwright
/tmp/mandarin-qa-env/bin/playwright install chromium
/tmp/mandarin-qa-env/bin/python tests/browser_test.py
/tmp/mandarin-qa-env/bin/python tests/update_test.py
```

The suite starts its own temporary HTTP server and checks core learner flows, scheduler/data rules, backup handling, microphone cleanup, responsive layouts, and offline use at root and `/mandarin-app/` paths. The update suite also reproduces recovery from a legacy cache while a second tab stays open and checks that ordinary updates preserve unsaved form fields until the user chooses to reload. No development dependencies are shipped.
