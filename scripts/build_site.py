"""Build language pages and an allowlisted static deployment from public sources."""
from pathlib import Path
from lxml import html, etree
from urllib.parse import urlsplit
import json, shutil, re

ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','projects.html','biography.html','cv.html','courses.html','philosophy.html','courseplan.html','chat.html']
LANGS=['en','ru','bn']
PARTIAL={'cv.html','biography.html'}
T=json.loads((ROOT/'translations.json').read_text(encoding='utf-8'))
TITLES={
'cv.html':['Curriculum Vitae — Nelson Baroi','Резюме — Nelson Baroi','জীবনবৃত্তান্ত — Nelson Baroi'],
'courses.html':['Professional Courses & Certificates — Nelson Baroi','Курсы и сертификаты — Nelson Baroi','পেশাগত কোর্স ও সনদ — Nelson Baroi'],
'chat.html':['Portfolio Guide — Nelson Baroi','Гид по портфолио — Nelson Baroi','পোর্টফোলিও গাইড — Nelson Baroi']}
DESCS={
'cv.html':['Nelson Baroi’s professional experience, education, capabilities and recognition. Read the public CV online or download the two-page PDF.','Профессиональный опыт, образование и достижения Нельсона Барои. Резюме на английском доступно онлайн и в PDF.','নেলসন বাড়ৈর পেশাগত অভিজ্ঞতা, শিক্ষা ও স্বীকৃতি। ইংরেজি জীবনবৃত্তান্ত পড়ুন বা PDF ডাউনলোড করুন।'],
'courses.html':['Six completed Google and IBM courses on Coursera, with completion dates, original certificates and verification links.','Шесть завершённых курсов Google и IBM на Coursera: даты, оригиналы сертификатов и ссылки для проверки.','Coursera-তে Google ও IBM-এর ছয়টি সম্পন্ন কোর্স, তারিখ, মূল সনদ ও যাচাইয়ের লিংক।'],
'chat.html':['Answers from Nelson Baroi’s published profile, with source links and direct contact options.','Ответы из опубликованного профиля Нельсона Барои, ссылки на источники и прямые контакты.','নেলসন বাড়ৈর প্রকাশিত প্রোফাইলের তথ্য, মূল পাতার লিংক ও সরাসরি যোগাযোগ।'],
'philosophy.html':['How Nelson Baroi approaches communication, evidence, learning and operations, with examples from his work and projects.','Подход Нельсона Барои к общению, фактам, обучению и работе, с примерами из его проектов.','যোগাযোগ, তথ্য, শিক্ষা ও কাজ নিয়ে নেলসন বাড়ৈর দৃষ্টিভঙ্গি ও প্রকল্পের উদাহরণ।'],
'courseplan.html':['Nelson Baroi’s planned learning in data analytics. A study roadmap, not a record of completed qualifications.','План изучения аналитики данных Нельсона Барои. Это учебный план, а не список полученных квалификаций.','ডেটা অ্যানালিটিক্সে নেলসন বাড়ৈর শেখার পরিকল্পনা। এটি সম্পন্ন যোগ্যতার তালিকা নয়।']}
def url(page,lang='en'):
    return 'https://nbaroi.com/'+('' if lang=='en' else lang+'/')+('' if page=='index.html' else page)
def replace_text(el,value,markup=False):
    for c in list(el): el.remove(c)
    el.text=''
    if markup:
        for frag in html.fragments_fromstring(value):
            if isinstance(frag,str): el.text=(el.text or '')+frag
            else: el.append(frag)
    else: el.text=value
def meta(head,attr,key,value):
    items=head.xpath(f'./meta[@{attr}="{key}"]')
    el=items[0] if items else etree.SubElement(head,'meta',attrib={attr:key})
    el.set('content',value)
def render(page,lang):
    doc=html.document_fromstring((ROOT/page).read_text(encoding='utf-8'),parser=html.HTMLParser(encoding='utf-8')); doc.set('lang',lang)
    head=doc.find('head')
    for old in head.xpath('./noscript[@id="navigation-fallback"]'): head.remove(old)
    fallback=etree.SubElement(head,'noscript',id='navigation-fallback')
    style=etree.SubElement(fallback,'style')
    style.text='@media(max-width:1180px){.site-header{position:static}.site-header .primary-navigation{display:flex;position:static;flex-basis:100%;max-height:none}.site-nav-shell{flex-wrap:wrap}.site-header .menu-toggle{display:none}.portfolio-hero{padding-top:40px}.inner-page{padding-top:0}}'
    for a in doc.xpath('//a[contains(@href,"personal.html")]'): a.getparent().remove(a)
    for el in doc.xpath('//*[@data-i18n]'):
        key=el.get('data-i18n')
        if key not in T: raise ValueError(f'{page}: missing translation {key}')
        value=T[key].get(lang) or T[key]['en']
        if el.tag in ['input','textarea']: el.set('placeholder',value)
        else: replace_text(el,value,bool(el.get('data-i18n-html')))
    for el in doc.xpath('//*[@data-i18n-meta]'):
        key=el.get('data-i18n-meta'); el.set('content',T[key].get(lang) or T[key]['en'])
    if page in TITLES:
        title=TITLES[page][LANGS.index(lang)]; head.find('title').text=title
        doc.xpath('//h1')[0].text=title.split(' — ')[0]
    if page in DESCS: meta(head,'name','description',DESCS[page][LANGS.index(lang)])
    title=head.find('title').text_content()
    description=head.xpath('./meta[@name="description"]')[0].get('content')
    for attr,key,value in [('property','og:url',url(page,lang)),('property','og:title',title),('property','og:description',description),('name','twitter:title',title),('name','twitter:description',description)]: meta(head,attr,key,value)
    for link in head.xpath('./link[@rel="canonical" or @rel="alternate"]'): head.remove(link)
    canonical=url(page,'en' if page in PARTIAL else lang)
    etree.SubElement(head,'link',rel='canonical',href=canonical)
    if page in PARTIAL and lang!='en': meta(head,'name','robots','noindex, follow')
    else:
        for old in head.xpath('./meta[@name="robots"]'): head.remove(old)
    if page not in PARTIAL:
        for alternate in LANGS+['x-default']: etree.SubElement(head,'link',rel='alternate',hreflang=alternate,href=url(page,'en' if alternate=='x-default' else alternate))
    for notice in doc.xpath('//*[contains(@class,"language-notice")]'): notice.set('lang',lang)
    for a in doc.xpath('//a[@data-lang]'):
        target=a.get('data-lang'); a.set('href',('/' if target=='en' else '/'+target+'/')+page)
        a.set('class','lang-btn'+(' active' if target==lang else '')); a.attrib.pop('aria-current',None)
        a.set('aria-label',{'en':'English','ru':'Русский','bn':'বাংলা'}[target])
        if target==lang: a.set('aria-current','page')
    for a in doc.xpath('//a[@href]'):
        if a.get('data-lang'): continue
        href=a.get('href'); parts=urlsplit(href)
        if parts.scheme or parts.netloc or href.startswith('#'): continue
        path=parts.path.lstrip('/')
        if path in PAGES:
            a.set('href',('/' if lang=='en' else '/'+lang+'/')+path+('?' + parts.query if parts.query else '')+('#'+parts.fragment if parts.fragment else ''))
        elif path and not href.startswith('/'): a.set('href','/'+href)
    for el in doc.xpath('//*[@src or @srcset]'):
        for attr in ['src','srcset']:
            value=el.get(attr)
            if not value: continue
            if attr=='src' and not urlsplit(value).scheme and not value.startswith('/'): el.set(attr,'/'+value)
            if attr=='srcset': el.set(attr,', '.join('/'+part.strip() if not part.strip().startswith('/') else part.strip() for part in value.split(',')))
    for link in head.xpath('./link[@href]'):
        href=link.get('href')
        if not urlsplit(href).scheme and not href.startswith('/'): link.set('href','/'+href)
    for menu in doc.xpath('//*[@id="menu-toggle"]'): menu.set('aria-label',T['shared.open_menu'][lang])
    for switch in doc.xpath('//*[contains(@class,"lang-switcher")]'): switch.set('aria-label',T['shared.language'][lang])
    for a in doc.xpath('//*[@id="primary-navigation"]//a'):
        p=urlsplit(a.get('href','')); a.attrib.pop('aria-current',None)
        if p.path.endswith('/'+page) and not p.fragment: a.set('aria-current','page')
    for old in doc.xpath('//script[@id="site-messages"]'): old.getparent().remove(old)
    small={k:v[lang] for k,v in T.items() if k.startswith('shared.')}
    script=etree.Element('script',id='site-messages',type='application/json'); script.text=json.dumps(small,ensure_ascii=False).replace('<','\\u003c'); head.append(script)
    if page=='index.html':
        for old in doc.xpath('//script[@id="profile-schema"]'): old.getparent().remove(old)
        schema=etree.SubElement(head,'script',id='profile-schema',type='application/ld+json')
        schema.text=json.dumps({'@context':'https://schema.org','@type':'ProfilePage','url':url(page,lang),'mainEntity':{'@type':'Person','@id':'https://nbaroi.com/#nelson','name':'Nelson Baroi','url':'https://nbaroi.com/','jobTitle':'Director of Bangladesh Branch, AMT Engineering JSC','sameAs':['https://www.linkedin.com/in/nbaroi','https://github.com/NelsonBaroi']}},ensure_ascii=False)
    result=html.tostring(doc,encoding='unicode',method='html').replace('\r','')
    return '<!DOCTYPE html>\n'+re.sub(r'\n(?:[ \t]*\n)+','\n',result)

rendered={(page,lang):render(page,lang) for page in PAGES for lang in LANGS}
for (page,lang),content in rendered.items():
    dest=ROOT/page if lang=='en' else ROOT/lang/page
    dest.parent.mkdir(exist_ok=True); dest.write_text(content,encoding='utf-8',newline='\n')
sitemap=etree.Element('urlset',nsmap={None:'http://www.sitemaps.org/schemas/sitemap/0.9'})
for page in PAGES:
    for lang in LANGS:
        if page in PARTIAL and lang!='en': continue
        item=etree.SubElement(sitemap,'url'); etree.SubElement(item,'loc').text=url(page,lang)
(ROOT/'sitemap.xml').write_bytes(etree.tostring(sitemap,xml_declaration=True,encoding='UTF-8',pretty_print=True))

dist=ROOT/'dist'; dist.mkdir(exist_ok=True)
allowed=PAGES+['personal.html','404.html','styles.css','accessibility.css','script.js','i18n.js','robots.txt','sitemap.xml','cv.pdf','CNAME']
allowed += [str(p.relative_to(ROOT)).replace('\\','/') for folder in ['ru','bn','images','coursera','documents'] for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix.lower() in ['.html','.jpg','.jpeg','.png','.gif','.webp','.pdf','.docx']]
for p in dist.rglob('*'):
    if p.is_file() and str(p.relative_to(dist)).replace('\\','/') not in allowed: p.unlink()
for rel in allowed:
    src=ROOT/rel
    if not src.is_file(): raise ValueError('Missing public asset '+rel)
    dest=dist/rel; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dest)
print(f'Built {len(rendered)} localized pages and {len(allowed)} allowlisted public files.')
