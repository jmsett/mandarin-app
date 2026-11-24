"""Real-browser checks. Run with the Playwright Python environment; no npm needed."""
import http.server
from pathlib import Path
import threading
import time
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
KEY = 'little-mandarin-v1'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def translate_path(self, path):
        if path.startswith('/mandarin-app/'):
            path = path[len('/mandarin-app'):]
        return super().translate_path(path)
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}'

def stored(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        context = browser.new_context(viewport={'width':1440, 'height':1050}, permissions=['microphone'])
        context.add_init_script("""window.__testStreams=[];const originalGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await originalGetUserMedia(...args);window.__testStreams.push(stream);return stream;};""")
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE)
        expect(page.locator('h1')).to_have_text('Today')
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        cdp = context.new_cdp_session(page)
        assert not cdp.send('Page.getAppManifest').get('errors')
        assert not cdp.send('Page.getInstallabilityErrors')['installabilityErrors']
        page.screenshot(path='/tmp/mandarin-desktop.png', full_page=True)
        assert len(stored(page)['cards']) == 4
        assert page.locator('html').get_attribute('data-theme') == 'dragon'
        for theme in ['cyberpunk', 'synthwave', 'dragon']:
            page.locator('#theme-picker').select_option(theme)
            assert stored(page)['profile']['theme'] == theme
            page.reload()
            expect(page.locator('#theme-picker')).to_have_value(theme)
            assert page.locator('html').get_attribute('data-theme') == theme
            assert page.locator('meta[name="theme-color"]').get_attribute('content') == page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()")
        assert not page.locator('.hero-art, .daily-note, .tutor-note, .bottom-banner').count()

        page.locator('[data-lesson="hello"]').click()
        expect(page.locator('#lesson-dialog')).to_be_visible()
        page.clock.install()
        page.locator('#timer-toggle').click()
        page.clock.fast_forward(65000)
        # Recovery of a saved timer and persistence of the actual elapsed minute.
        page.reload()
        assert sum(d['seconds'] for d in stored(page)['days'].values()) >= 65
        page.locator('[data-lesson="hello"]').click()
        page.locator('#finish-lesson').click()
        assert stored(page)['completed'] == ['hello']
        page.goto(BASE+'/#path')
        page.locator('[data-lesson="repair"]').click()
        page.locator('#finish-lesson').click()
        assert len(stored(page)['cards']) == 7
        page.goto(BASE+'/#practice')
        page.locator('#reveal').click()
        page.locator('[data-rate="good"]').click()
        assert sum(c['reviews'] for c in stored(page)['cards']) == 1
        assert sum(d['reviews'] for d in stored(page)['days'].values()) == 1
        assert any(c['due'] > time.time()*1000+23*3600000 for c in stored(page)['cards'])
        page.locator('[name="hanzi"]').fill('我喜欢咖啡。')
        page.locator('[name="pinyin"]').fill('Wǒ xǐhuan kāfēi.')
        page.locator('[name="english"]').fill('I like coffee.')
        page.locator('#phrase-form button').click()
        assert len(stored(page)['cards']) == 8
        with page.expect_download() as dl:
            page.locator('#export-tsv').click()
        assert '#columns:Chinese\tPinyin\tEnglish' in Path(dl.value.path()).read_text()
        page.goto(BASE+'/#resources')
        expect(page.locator('.resource-card')).to_have_count(11)
        page.get_by_role('button',name='All',exact=True).click()
        expect(page.locator('.resource-card')).to_have_count(30)
        page.locator('#resource-search').fill('BuSang')
        expect(page.locator('.resource-card')).to_have_count(1)
        page.get_by_role('button',name='Start here',exact=True).click()
        expect(page.locator('.resource-card')).to_have_count(0)
        page.locator('#resource-search').fill('')
        expect(page.locator('.resource-card')).to_have_count(11)
        page.locator('#profile-settings').click()
        page.locator('#name').fill('<img src=x onerror=alert(1)>')
        page.locator('#minutes').select_option('15')
        page.locator('input[name="theme"][value="synthwave"]').check()
        page.locator('#settings-form button[type="submit"]').click()
        assert stored(page)['profile']['minutes'] == 15
        expect(page.locator('#theme-picker')).to_have_value('synthwave')
        page.goto(BASE)
        assert page.locator('h1 img').count() == 0
        assert stored(page)['profile']['name'] == '<img src=x onerror=alert(1)>'
        page.locator('#profile-settings').click()
        with page.expect_download() as dl:
            page.locator('#export').click()
        backup=Path(dl.value.path()).read_bytes()
        page.once('dialog',lambda d:d.accept())
        page.locator('#import').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':backup})
        expect(page.locator('#settings')).not_to_be_visible()
        original=stored(page)
        page.locator('#profile-settings').click()
        page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"version":42}'})
        expect(page.locator('#toast')).to_contain_text('Could not restore')
        assert stored(page)==original
        page.locator('#settings .close-dialog').click()
        page.goto(BASE+'/#progress')
        page.locator('#log-form input').fill('12')
        page.locator('#log-form button').click()
        assert sum(d['seconds'] for d in stored(page)['days'].values()) >= 785
        page.goto(BASE)
        page.locator('[data-task="speak"]').click()
        page.locator('#record').click()
        expect(page.locator('#record')).to_have_text('Stop recording ■')
        page.locator('#record').click()
        expect(page.locator('#playback')).to_be_visible()
        page.locator('#lesson-dialog .close-dialog').first.click()
        assert page.evaluate('window.__testStreams.every(s=>s.getTracks().every(t=>t.readyState==="ended"))')
        # Pure state logic through the actual browser module loader.
        result=page.evaluate("""async () => {
          const m=await import('./state.js');
          const s=m.newState(),c=s.cards[0],now=1000000;
          const check=(condition,msg)=>{if(!condition)throw Error(msg)};
          check(m.schedule(c,'again',now).due===now+600000,'again');
          check(m.schedule(c,'good',now).due===now+86400000,'good');
          check(m.schedule({...c,interval:300},'easy',now).interval===365,'cap');
          check(m.validateState(s)===s,'valid state');
          const legacy=structuredClone(s);delete legacy.profile.theme;check(m.validateState(legacy)===legacy,'legacy backup');
          for(const modify of [s=>s.cards.push({...s.cards[0]}),s=>s.cards[0].due=-1,s=>s.profile.minutes=17,s=>s.profile.theme='invalid',s=>s.days={'oops':{}},s=>s.completed=['fake'],s=>s.timer={started:NaN,task:'sound'}]){
            const copy=structuredClone(s);modify(copy);let rejected=false;try{m.validateState(copy)}catch{rejected=true}check(rejected,'bad backup accepted');
          }
          const start=new Date(2026,0,2,23,59,30).getTime();
          const timed=m.newState();timed.timer={started:start,task:'learn'};m.accrueTimer(timed,start+60000);
          check(timed.days['2026-01-02'].seconds===30,'midnight before');
          check(timed.days['2026-01-03'].seconds===30,'midnight after');
          timed.timer={started:start,task:'sound'};m.accrueTimer(timed,start+10*3600000);
          check(Object.values(timed.days).reduce((n,d)=>n+d.seconds,0)===7260,'unattended cap');
          const history={'2026-01-01':{done:['learn'],seconds:0},'2026-01-02':{done:[],seconds:60}};
          check(m.streak(history,new Date(2026,0,3))===2,'yesterday streak');
          check(m.streak(history,new Date(2026,0,4))===0,'broken streak');
          return 'scheduler, validation, midnight, caps, streaks pass';
        }""")
        print(result)
        # Offline navigation and reload with all first-party module/data assets.
        context.set_offline(True)
        page.reload()
        expect(page.locator('h1')).to_have_text('Today')
        expect(page.locator('#theme-picker')).to_have_value('synthwave')
        page.goto(BASE+'/#resources')
        page.get_by_role('button',name='All',exact=True).click()
        expect(page.locator('.resource-card')).to_have_count(30)
        context.set_offline(False)
        # Check narrow widths, including minimum phone width, without overflow.
        for width in [320,390,768,1024]:
            page.set_viewport_size({'width':width,'height':900})
            for route in ['today','path','practice','resources','progress']:
                page.goto(BASE+'/#'+route)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,route)
            page.locator('#profile-settings').click()
            expect(page.locator('#settings')).to_be_visible()
            page.locator('#settings .close-dialog').click()
        page.locator('#profile-settings').click()
        page.locator('#name').fill('')
        page.locator('#minutes').select_option('30')
        page.locator('#settings-form button[type="submit"]').click()
        page.set_viewport_size({'width':390,'height':844})
        page.goto(BASE)
        for theme in ['dragon', 'cyberpunk', 'synthwave']:
            page.locator('#theme-picker').select_option(theme)
            for route in ['today', 'path', 'practice', 'resources', 'progress']:
                page.goto(BASE+'/#'+route)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (theme, route)
            page.goto(BASE)
            page.screenshot(path=f'/tmp/mandarin-{theme}-mobile.png')
        page.locator('#theme-picker').select_option('dragon')
        page.screenshot(path='/tmp/mandarin-mobile.png',full_page=True)
        assert not errors,errors
        context.close()
        # GitHub Pages subpath: independent scope, manifest resolution, offline.
        context=browser.new_context()
        page=context.new_page()
        page.goto(BASE+'/mandarin-app/')
        expect(page.locator('h1')).to_have_text('Today')
        scope=page.evaluate('(async()=> (await navigator.serviceWorker.ready).scope)()')
        assert scope==BASE+'/mandarin-app/',scope
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        manifest=page.evaluate("fetch('./manifest.webmanifest').then(r=>r.json())")
        assert manifest['start_url']=='./' and manifest['scope']=='./'
        context.set_offline(True)
        page.reload()
        page.goto(BASE+'/mandarin-app/#path')
        expect(page.locator('.lesson-card')).to_have_count(8)
        context.close()
        # Preserve malformed prior storage until the user restores a valid backup.
        context=browser.new_context()
        page=context.new_page()
        page.add_init_script(f"localStorage.setItem('{KEY}','broken-json')")
        page.goto(BASE)
        expect(page.locator('.storage-warning')).to_contain_text('Existing browser data has been left intact')
        page.locator('[data-check="sound"]').click()
        assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='broken-json'
        context.close()
        browser.close()
        print('PASS: learner flows, backups, recording, responsive layouts, root/subpath offline and data protection')

try:
    run()
finally:
    server.shutdown()
