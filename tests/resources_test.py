"""Test resource URLs and viewer flows with provider responses isolated from the app."""
import http.server
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def translate_path(self, path):
        if path.startswith('/mandarin-app/'):
            path = path[len('/mandarin-app'):]
        return super().translate_path(path)
    def log_message(self, *args):
        pass

def run():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/mandarin-app/'
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            context = browser.new_context(viewport={'width': 1440, 'height': 1000})
            # This verifies app wiring, not third-party media playback. Real providers
            # receive a separate live smoke check rather than making tests flaky.
            provider_requests = []
            def embedded(route):
                provider_requests.append(route.request.url)
                route.fulfill(status=200, content_type='text/html', body='<html><body><h1>Provider fixture</h1></body></html>')
            context.route('https://www.youtube-nocookie.com/**', embedded)
            context.route('https://embed.podcasts.apple.com/**', embedded)
            context.route('https://www.hackingchinese.com/**', embedded)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(base + '#resources')
            expect(page.locator('h1')).to_have_text('Resources')
            page.evaluate('navigator.serviceWorker.ready')
            page.wait_for_function('navigator.serviceWorker.controller !== null')
            expect(page.locator('iframe')).to_have_count(0)
            assert not provider_requests
            page.evaluate("""async () => {
              const {getEmbed}=await import('./resource-viewer.js');
              const check=(v,m)=>{if(!v)throw Error(m)};
              check(new URL(getEmbed('https://youtu.be/FlaJ12tmtu4?t=1m23s').src).searchParams.get('start')==='83','timestamp');
              check(getEmbed('https://www.youtube.com/playlist?list=PLwUQs2-8gj4UaSI0I3boJcMWXXhLhKhFo').type==='playlist','playlist');
              check(getEmbed('https://www.youtube.com/@MandarinCorner2/playlists').items.length===4,'channel');
              check(getEmbed('https://podcasts.apple.com/ca/podcast/learning-chinese-through-stories/id942258146').type==='podcast','podcast');
              check(getEmbed('https://www.hellochinese.cc/').type==='page','approved page');
              for(const url of ['javascript:alert(1)','http://www.youtube.com/watch?v=FlaJ12tmtu4','https://youtube.com.evil.test/watch?v=FlaJ12tmtu4','https://www.youtube.com/watch?v=invalid','https://duchinese.net/','https://ankiweb.net/shared/info/132435921'])check(getEmbed(url)===null,'unsupported URL '+url);
            }""")
            def card(title):
                return page.locator('.resource-card').filter(has=page.get_by_role('heading', name=title, exact=True))
            def close():
                page.get_by_role('button', name='Close resource', exact=True).click()
                expect(page.locator('#resource-dialog')).not_to_be_visible()
                expect(page.locator('iframe')).to_have_count(0)
            card('Mandarin pronunciation guide').get_by_role('link').click()
            expect(page.locator('#resource-title')).to_have_text('Mandarin pronunciation guide')
            frame = page.locator('#resource-dialog iframe')
            expect(frame).to_have_attribute('src', 'https://www.youtube-nocookie.com/embed/FlaJ12tmtu4?start=31&playsinline=1&rel=0')
            assert frame.get_attribute('referrerpolicy') == 'strict-origin-when-cross-origin'
            expect(page.locator('#resource-source')).to_have_attribute('href', 'https://www.youtube.com/watch?v=FlaJ12tmtu4&t=31s')
            assert len(context.pages) == 1
            close()
            card('HSK 1 textbook audio').get_by_role('link').click()
            assert 'videoseries?list=PLwUQs2-8gj4UaSI0I3boJcMWXXhLhKhFo' in page.locator('iframe').get_attribute('src')
            page.keyboard.press('Escape')
            expect(page.locator('#resource-dialog')).not_to_be_visible()
            expect(page.locator('iframe')).to_have_count(0)
            card('Mandarin Corner').get_by_role('link').click()
            expect(page.locator('#resource-playlist option')).to_have_count(4)
            page.locator('#resource-playlist').select_option(index=1)
            expect(page.locator('iframe')).to_have_count(1)
            assert 'PL7VdqFXO0LzeH-Of75XEG5ua1vYpJQA_C' in page.locator('iframe').get_attribute('src')
            assert 'PL7VdqFXO0LzeH-Of75XEG5ua1vYpJQA_C' in page.locator('#resource-source').get_attribute('href')
            close()
            page.get_by_text('Video sources & timestamps', exact=True).click()
            page.locator('a[href*="WyehfFj72zY&t=83s"]').click()
            assert 'start=83' in page.locator('iframe').get_attribute('src')
            close()
            page.get_by_role('button', name='All', exact=True).click()
            card('Learning Chinese through Stories').get_by_role('link').click()
            assert page.locator('iframe').get_attribute('src').startswith('https://embed.podcasts.apple.com/')
            close()
            card('Beginner listening guide').get_by_role('link').click()
            assert 'allow-scripts' in page.locator('iframe').get_attribute('sandbox')
            assert 'allow-top-navigation' not in page.locator('iframe').get_attribute('sandbox')
            close()
            assert card('Du Chinese').get_by_role('link').get_attribute('data-resource-url') is None
            assert card('Du Chinese').get_by_role('link').get_attribute('target') == '_blank'
            # Overlaying a resource preserves the active lesson and its timer.
            page.goto(base)
            page.locator('[data-task="sound"]').click()
            page.locator('#timer-toggle').click()
            page.locator('#lesson-dialog a[data-resource-url]').click()
            expect(page.locator('#lesson-dialog')).to_be_visible()
            expect(page.locator('#resource-dialog')).to_be_visible()
            close()
            expect(page.locator('#lesson-dialog')).to_be_visible()
            assert page.evaluate("JSON.parse(localStorage.getItem('little-mandarin-v1')).timer !== null")
            page.locator('#lesson-dialog .close-dialog').first.click()
            # Offline entry makes no provider requests; retry works on reconnection.
            page.goto(base + '#resources')
            context.set_offline(True)
            card('Mandarin pronunciation guide').get_by_role('link').click()
            expect(page.locator('#resource-status')).to_contain_text('Connect to the internet')
            expect(page.locator('#resource-retry')).to_be_disabled()
            expect(page.locator('iframe')).to_have_count(0)
            context.set_offline(False)
            expect(page.locator('#resource-retry')).to_be_enabled()
            page.locator('#resource-retry').click()
            expect(page.locator('iframe')).to_have_count(1)
            close()
            for width in [320, 390, 768, 1440]:
                page.set_viewport_size({'width': width, 'height': 900})
                for theme in ['dragon', 'cyberpunk', 'synthwave']:
                    page.locator('#theme-picker').select_option(theme)
                    card('Mandarin pronunciation guide').get_by_role('link').click()
                    bounds = page.locator('iframe').bounding_box()
                    assert bounds['width'] >= 200 and bounds['height'] >= 200
                    assert page.locator('#resource-dialog').evaluate('(d)=>d.scrollWidth <= d.clientWidth')
                    close()
                page.get_by_role('button', name='All', exact=True).click()
                card('Learning Chinese through Stories').get_by_role('link').click()
                assert page.locator('iframe').bounding_box()['width'] >= 290
                close()
            # Leaving the current route removes the player and stops its media.
            card('HSK 1 textbook audio').get_by_role('link').click()
            page.goto(base + '#path')
            expect(page.locator('#resource-dialog')).not_to_be_visible()
            expect(page.locator('iframe')).to_have_count(0)
            assert not errors, errors
            browser.close()
        print('PASS: provider URLs, timestamps, playlists, podcasts, approved pages, nested lessons, player cleanup, offline/retry, all themes and responsive sizes.')
    finally:
        server.shutdown()

if __name__ == '__main__':
    run()
