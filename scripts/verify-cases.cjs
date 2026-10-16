const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const fields = Object.fromEntries(['directWeight','vooWeight','qqqmWeight','vooInside','qqqmInside','overlapResult'].map(k=>['#'+k, {value:'',innerHTML:'',textContent:''}]));
const context = vm.createContext({head:()=>'', $:s=>fields[s]});
vm.runInContext(fs.readFileSync('dist/cases.js','utf8'),context);
for (const id of ['ionq','nvda','voo','qqqm']) {
 const html=vm.runInContext(`activeCase='${id}'; cases()`, context);
 assert.ok(html.includes('data-case-answer="0"'));
 assert.ok(html.includes('id="overlapResult"'));
 assert.ok(!html.includes('undefined'));
}
function calculate(values){['directWeight','vooWeight','qqqmWeight','vooInside','qqqmInside'].forEach((k,i)=>fields['#'+k].value=values[i]);fields['#overlapResult'].innerHTML='';fields['#overlapResult'].textContent='';vm.runInContext('calculateOverlap()',context);return fields['#overlapResult'];}
assert.ok(calculate(['20','40','20','7.5','7.6']).innerHTML.includes('24.52%'));
assert.ok(calculate(['0','100','0','7.5','7.6']).innerHTML.includes('7.50%'));
assert.ok(calculate(['0','0','0','0','0']).innerHTML.includes('0.00%'));
assert.ok(calculate(['60','30','20','7.5','7.6']).textContent.includes('100% 이하'));
assert.ok(calculate(['','40','20','7.5','7.6']).textContent.includes('입력'));
assert.ok(calculate(['-1','40','20','7.5','7.6']).textContent.includes('입력'));
const index=fs.readFileSync('dist/index.html','utf8');
for(const [,file] of index.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)){if(/^https?:/.test(file))continue;assert.ok(fs.existsSync('dist/'+file));}
assert.ok(fs.readFileSync('dist/app.js','utf8').includes("if(tab==='cases')bindCases()"));
console.log('PASS: four cases render, calculator results and invalid inputs, assets and integration');
