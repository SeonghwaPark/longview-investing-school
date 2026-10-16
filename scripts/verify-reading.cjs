const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els={'#readingSearch':{value:''},'#readingCategory':{value:'전체'},'#readingCount':{},'#readingResults':{},'#downloadReading':{}};
const ctx={head:()=>'',main:{querySelectorAll:()=>[]},$:s=>els[s]};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/easy-reading.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/reading.js','utf8'),ctx);
const rows=ctx.readingCards();assert.equal(rows.length,29);assert.equal(new Set(rows.map(r=>r.id)).size,29);for(const r of rows){assert(r.url.startsWith('https://'));assert(r.task&&r.start&&r.limit);assert(ctx.easyReadingHTML(r.id).includes('정답과 해설 확인'));assert(ctx.easyReadingText(r.id).includes('가상 숫자'));assert(ctx.readingCard(r).includes('쉽게 말하면')); }
assert.equal(ctx.readingCards('아이온큐').length,1);assert(ctx.readingCards('','차트').every(r=>r.category==='차트'));assert.equal(ctx.readingCards('<script>','전체').length,0);assert(ctx.library().includes('readingResults'));
ctx.bindLibrary();assert(els['#readingCount'].textContent.startsWith('29 / 29'));els['#readingSearch'].value='없는검색어123';els['#readingSearch'].oninput();assert(els['#readingResults'].innerHTML.includes('검색 결과가 없습니다'));els['#readingSearch'].value='';els['#readingCategory'].value='차트';els['#readingCategory'].onchange();assert(els['#readingCount'].textContent.startsWith('3 / 29'));
const md=ctx.readingMarkdown();assert(md.includes('6주'));assert(rows.every(r=>md.includes(r.url)&&md.includes(ctx.easyReadingText(r.id))));fs.writeFileSync('dist/study-guide.md',md);
const html=fs.readFileSync('dist/index.html','utf8');assert(html.indexOf('reading.js')<html.indexOf('src="app.js"'));console.log('PASS: 29 unique cards, search, category, empty state, render, export and script order');

