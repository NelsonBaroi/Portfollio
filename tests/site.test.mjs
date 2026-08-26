import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import chat from '../api/chat.js';
import train from '../api/train.js';

test('retired AI endpoints return honest statuses without contacting providers', () => {
  for (const [handler,method,status] of [[chat,'POST',503],[chat,'GET',405],[train,'POST',410]]) {
    const res={setHeader(){},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
    handler({method},res); assert.equal(res.code,status); assert.ok(res.body.error);
  }
});
function fixture(clipboardWorks=true) {
  const events={}; const classes=new Set(); const attrs={'aria-expanded':'false'}; const menuEvents={}; let focused=false;
  const menu={setAttribute(k,v){attrs[k]=v;},getAttribute:k=>attrs[k],addEventListener:(k,fn)=>menuEvents[k]=fn,focus:()=>focused=true};
  const nav={classList:{remove:v=>classes.delete(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v)},contains:()=>false,querySelectorAll:()=>[]};
  const status={textContent:''}; const copyEvents={}; const copy={parentElement:{querySelector:()=>status},addEventListener:(k,fn)=>copyEvents[k]=fn};
  const document={activeElement:null,addEventListener:(k,fn)=>(events[k]??=[]).push(fn),getElementById:id=>({'menu-toggle':menu,'primary-navigation':nav}[id]||null),querySelector:()=>({contains:()=>true,classList:{toggle(){}}}),querySelectorAll:()=>[copy],documentElement:{scrollHeight:1000},dispatchEvent:e=>{document.lastEvent=e;}};
  const context={document,window:{__:()=>'',matchMedia:()=>({addEventListener(){}}),addEventListener(){},scrollY:0,innerHeight:700},navigator:{clipboard:{writeText:async()=>{if(!clipboardWorks)throw Error('unavailable');}}},location:{pathname:'/cv.html'},requestAnimationFrame:fn=>fn(),CustomEvent:class {constructor(type,data){this.type=type;this.detail=data.detail;}}};
  vm.runInNewContext(fs.readFileSync(new URL('../script.js',import.meta.url),'utf8'),context);
  events.DOMContentLoaded[0](); return {events,menuEvents,attrs,classes,status,copyEvents,document,isFocused:()=>focused};
}
test('menu opens and Escape closes it while returning focus',()=>{
  const f=fixture();f.menuEvents.click();assert.equal(f.attrs['aria-expanded'],'true');assert.ok(f.classes.has('is-open'));
  f.events.keydown[0]({key:'Escape'});assert.equal(f.attrs['aria-expanded'],'false');assert.ok(f.isFocused());
});
test('email copy provides success and manual fallback',async()=>{
  for(const works of [true,false]){const f=fixture(works);await f.copyEvents.click();assert.match(f.status.textContent,works ? /copied/ : /Select and copy/);}
});
test('analytics hook excludes query strings and visitor identifiers',()=>{
  const f=fixture();const link={getAttribute:()=>'/cv.pdf?v=20260826-public'};
  f.events.click.at(-1)({target:{closest:()=>link}});
  assert.equal(JSON.stringify(f.document.lastEvent.detail),JSON.stringify({action:'cv_download',path:'/cv.html'}));
});
