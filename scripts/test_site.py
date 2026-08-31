"""Structural, privacy, accessibility and public asset regression checks."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from lxml import html, etree
import unittest, json, re, hashlib

ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','recognition.html','projects.html','biography.html','cv.html','courses.html','philosophy.html','courseplan.html','chat.html']
class SiteTests(unittest.TestCase):
    def test_public_pages_and_links(self):
        for lang in ['en','ru','bn']:
            for name in PAGES:
                rel=name if lang=='en' else lang+'/'+name
                with self.subTest(page=rel):
                    doc=html.parse(str(ROOT/rel)); self.assertEqual(doc.getroot().get('lang'),lang)
                    self.assertEqual(len(doc.xpath('//h1')),1)
                    self.assertEqual(len(doc.xpath('//main')),1)
                    self.assertEqual(len(doc.xpath('//link[@rel="canonical"]')),1)
                    self.assertTrue(doc.xpath('//meta[@name="description"]/@content')[0])
                    ids=doc.xpath('//*[@id]/@id'); self.assertEqual(len(ids),len(set(ids)),rel)
                    self.assertTrue(doc.xpath('//a[@class="skip-link"]'))
                    self.assertFalse(doc.xpath('//*[contains(@class,"preloader")]'))
                    self.assertEqual(len(doc.xpath('//a[@data-lang and @aria-current="page"]')),1)
                    for a in doc.xpath('//a[@href]'):
                        self.assertTrue(a.text_content().strip() or a.get('aria-label') or a.xpath('.//img[@alt]'),html.tostring(a))
                    for el in doc.xpath('//*[@src or @href]'):
                        for attr in ['src','href']:
                            value=el.get(attr)
                            if not value: continue
                            parts=urlsplit(value)
                            if parts.scheme or parts.netloc: continue
                            target=(ROOT/unquote(parts.path.lstrip('/'))) if parts.path.startswith('/') else ((ROOT/rel).parent/unquote(parts.path)) if parts.path else ROOT/rel
                            if target.is_dir(): target=target/'index.html'
                            self.assertTrue(target.is_file(),f'{rel}: broken {value}')
                            if parts.fragment and target.suffix=='.html':
                                other=html.parse(str(target)); self.assertTrue(other.xpath('//*[@id=$id]',id=unquote(parts.fragment)),f'{rel}: missing anchor {value}')
    def test_private_data_not_deployed(self):
        for name in ['personal_private.md','build_personal.py','biography_voice.py','personal/app.py','api/lib/learner.js']:
            self.assertFalse((ROOT/name).exists(),name)
        safe=(ROOT/'personal.html').read_text(encoding='utf-8')
        self.assertNotIn('passwordForm',safe); self.assertNotIn('personal-content',safe)
        self.assertIn('noindex',safe)
        for p in (ROOT/'dist').rglob('*'):
            if p.is_file():
                self.assertNotIn(p.suffix,['.py','.md'])
                if p.suffix in ['.html','.js','.json']:
                    s=p.read_text(encoding='utf-8'); self.assertNotRegex(s,r'(?i)IELTS|passport|personal_private|passwordForm')
        for page in PAGES: self.assertNotIn('personal.html',(ROOT/page).read_text(encoding='utf-8'))
    def test_certificates_and_cv(self):
        courses=html.parse(str(ROOT/'courses.html'))
        self.assertEqual(len(courses.xpath('//article[contains(@class,"certificate-card")]')),6)
        self.assertEqual(len(courses.xpath('//a[contains(@href,"coursera.org/verify/")]')),6)
        self.assertFalse(courses.xpath('//canvas|//iframe'))
        cv=html.parse(str(ROOT/'cv.html')); self.assertTrue(cv.xpath('//a[@download and contains(@href,"cv.pdf")]'))
        self.assertIn('part-time support through AMT Engineering',cv.getroot().text_content())
        self.assertNotIn('BSc',cv.getroot().text_content())
        self.assertNotIn('bi.jpg',(ROOT/'cv.html').read_text(encoding='utf-8'))
    def test_recognition_archive(self):
        page=html.parse(str(ROOT/'recognition.html'))
        cards=page.xpath('//article[contains(@class,"recognition-card") and @data-category]')
        self.assertEqual(len(cards),21)
        expected={'professional':5,'safety':1,'academic':4,'leadership':7,'forums':4}
        actual={key:len(page.xpath(f'//article[@data-category="{key}"]')) for key in expected}
        self.assertEqual(actual,expected)
        self.assertEqual(len(page.xpath('//section[contains(@class,"recognition-year") and @data-year]')),8)
        self.assertEqual(len(page.xpath('//div[contains(@class,"recognition-expertise")]')),21)
        self.assertEqual(len(page.xpath('//div[contains(@class,"recognition-expertise")]/ul/li')),63)
        originals=set(page.xpath('//a[contains(@href,"-original.pdf")]/@href'))
        translations=set(page.xpath('//a[contains(@href,"-english.pdf")]/@href'))
        self.assertEqual(len(originals),19)
        self.assertEqual(len(translations),17)
        self.assertNotIn('IELTS',(ROOT/'recognition.html').read_text(encoding='utf-8'))
        self.assertTrue((ROOT/'recognition.js').is_file())
    def test_seo_language_alternates(self):
        sitemap=etree.parse(str(ROOT/'sitemap.xml'))
        urls=sitemap.xpath('//*[local-name()="loc"]/text()'); self.assertEqual(len(urls),21)
        for lang in ['en','ru','bn']:
            for page in PAGES:
                doc=html.parse(str(ROOT/page if lang=='en' else ROOT/lang/page))
                if page in ['biography.html','cv.html','recognition.html'] and lang!='en':
                    self.assertIn('noindex',doc.xpath('//meta[@name="robots"]/@content')[0])
                    self.assertTrue(doc.xpath('//*[@lang="en"]'))
                elif page not in ['biography.html','cv.html','recognition.html']:
                    self.assertEqual(set(doc.xpath('//link[@rel="alternate"]/@hreflang')),{'en','ru','bn','x-default'})
                for schema in doc.xpath('//script[@type="application/ld+json"]/text()'): json.loads(schema)
    def test_optimized_assets_and_fallback(self):
        self.assertLess((ROOT/'images/amt-appreciation-800.webp').stat().st_size,200000)
        self.assertLess((ROOT/'images/logo-128.webp').stat().st_size,10000)
        home=html.parse(str(ROOT/'index.html'))
        self.assertTrue(home.xpath('//img[@srcset and @loading="lazy"]'))
        self.assertFalse(home.xpath('//img[@src="/images/amt-engineering-appreciation.jpg"]'))
        self.assertTrue(home.xpath('//a[@href="/images/amt-engineering-appreciation.jpg"]'))
        guide=(ROOT/'chat.html').read_text(encoding='utf-8')
        self.assertIn('AI chat is temporarily unavailable',guide)
        self.assertNotIn('api.nbaroi.com',guide)
        self.assertNotIn('fetch(', (ROOT/'script.js').read_text(encoding='utf-8'))
    def test_navigation_breakpoint_and_contrast(self):
        css=(ROOT/'accessibility.css').read_text(encoding='utf-8')
        self.assertIn('@media (max-width: 1180px)',css)
        self.assertIn('.site-header .menu-toggle { display: block; }',css)
        self.assertIn('.site-header .primary-navigation.is-open { display: flex; }',css)
        def lum(v):
            c=[int(v[i:i+2],16)/255 for i in [0,2,4]]
            c=[n/12.92 if n<=.04045 else ((n+.055)/1.055)**2.4 for n in c]
            return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
        for a,b in [('1a1a2e','ff7f50'),('2e5a6e','ffffff')]:
            x,y=sorted([lum(a),lum(b)]); self.assertGreaterEqual((y+.05)/(x+.05),4.5)

if __name__=='__main__': unittest.main(verbosity=2)
