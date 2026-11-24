"""Exercise legacy-cache recovery and updates while another app tab is open."""
import http.server
from pathlib import Path
import re
import threading
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
KEY = 'little-mandarin-v1'
LEGACY_HTML = b'''<!doctype html><html><head><link rel="stylesheet" href="./styles.css"></head><body><h1>Old version</h1><script type="module" src="./app.js"></script></body></html>'''
LEGACY_APP = b'''
import {newState} from './state.js';
if (!localStorage.getItem('little-mandarin-v1')) {
  const state = newState();
  delete state.profile.theme;
  state.completed = ['hello'];
  localStorage.setItem('little-mandarin-v1', JSON.stringify(state));
}
navigator.serviceWorker.register('./sw.js');
'''
LEGACY_WORKER = b'''
const CACHE='little-mandarin-shell-v1';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./index.html','./app.js','./state.js','./data.js','./styles.css']))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('./index.html')));
  } else {
    event.respondWith(caches.open(CACHE).then(async cache => await cache.match(event.request) || fetch(event.request)));
  }
});
'''

class Handler(http.server.SimpleHTTPRequestHandler):
    version = 'legacy'
    def do_GET(self):
        path = urlsplit(self.path).path
        if not path.startswith('/mandarin-app/'):
            self.send_error(404)
            return
        filename = path[len('/mandarin-app/'):] or 'index.html'
        if self.version == 'legacy' and filename in ('index.html', 'app.js', 'sw.js'):
            content = {'index.html': LEGACY_HTML, 'app.js': LEGACY_APP, 'sw.js': LEGACY_WORKER}[filename]
        else:
            source = (ROOT / filename).resolve()
            if not source.is_relative_to(ROOT) or not source.is_file():
                self.send_error(404)
                return
            content = source.read_bytes()
            if self.version == 'next':
                if filename == 'sw.js':
                    content = re.sub(rb"const CACHE = '[^']+';", b"const CACHE = 'little-mandarin-shell-update-test';", content)
                elif filename == 'index.html':
                    content = content.replace(b'<html ', b'<html data-release-test="next" ', 1)
        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(filename))
        self.send_header('Cache-Control', 'public,max-age=600')
        self.end_headers()
        self.wfile.write(content)
    def log_message(self, *args):
        pass

def run():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/mandarin-app/'
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            context = browser.new_context()
            old_tab = context.new_page()
            old_tab.goto(base)
            expect(old_tab.locator('h1')).to_have_text('Old version')
            old_tab.evaluate('navigator.serviceWorker.ready')
            old_tab.wait_for_function('navigator.serviceWorker.controller !== null')
            original = old_tab.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
            recovery_tab = context.new_page()
            recovery_tab.goto(base)
            expect(recovery_tab.locator('h1')).to_have_text('Old version')

            Handler.version = 'current'
            recovery_tab.goto(base + '?update=1#path')
            expect(recovery_tab.locator('h1')).to_have_text('Lessons', timeout=20000)
            assert '?update=' not in recovery_tab.url
            # The recovery tab works without closing or disrupting the old tab.
            expect(old_tab.locator('h1')).to_have_text('Old version')
            restored = recovery_tab.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
            assert restored['completed'] == original['completed'] == ['hello']
            assert restored['cards'] == original['cards']
            assert recovery_tab.locator('html').get_attribute('data-theme') == 'dragon'
            assert recovery_tab.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()") == '#141310'
            old_tab.close()

            recovery_tab.locator('#theme-picker').select_option('synthwave')
            recovery_tab.goto(base + '#practice')
            recovery_tab.locator('[name="hanzi"]').fill('未保存')
            before = recovery_tab.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
            Handler.version = 'next'
            recovery_tab.evaluate('navigator.serviceWorker.getRegistration().then(registration => registration.update())')
            expect(recovery_tab.locator('#update-app')).to_be_visible(timeout=20000)
            # Activation must not discard a partially completed form.
            expect(recovery_tab.locator('[name="hanzi"]')).to_have_value('未保存')
            assert recovery_tab.locator('html').get_attribute('data-release-test') is None
            for width in [320, 390, 1440]:
                recovery_tab.set_viewport_size({'width': width, 'height': 900})
                assert recovery_tab.evaluate('document.documentElement.scrollWidth <= innerWidth')
            recovery_tab.locator('#update-app').click()
            expect(recovery_tab.locator('html')).to_have_attribute('data-release-test', 'next')
            expect(recovery_tab.locator('#theme-picker')).to_have_value('synthwave')
            after = recovery_tab.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
            assert after['profile'] == before['profile']
            assert after['completed'] == before['completed']
            assert after['cards'] == before['cards']
            context.set_offline(True)
            recovery_tab.reload()
            expect(recovery_tab.locator('html')).to_have_attribute('data-release-test', 'next')
            expect(recovery_tab.locator('#theme-picker')).to_have_value('synthwave')
            browser.close()
        print('PASS: recovery from a legacy cache with another tab open; explicit update preserves forms until clicked, saved progress, themes, and offline use.')
    finally:
        server.shutdown()

if __name__ == '__main__':
    run()
