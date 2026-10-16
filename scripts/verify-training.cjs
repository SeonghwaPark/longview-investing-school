const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({localStorage:{getItem:()=>null},console,esc:x=>String(x),toast:()=>{},$:()=>null});
for(const f of ['indicators.js','history.js','training.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.ok(run('Object.keys(TRAINING_CATALOG).length')>=10);
assert.equal(run("stockRows('IONQ')[0][0]"),'2021-10-01');
run("var sample=Array.from({length:100},(_,i)=>[new Date(Date.UTC(2023,0,i+1)).toISOString().slice(0,10),10]);sample[20][1]=1;sample[22][1]=20");
const hold=run("simulateHistory(sample,20,22,1000,.01,'hold')");
assert.ok(Math.abs(hold.end-1980.1980198)<1e-6);assert.equal(hold.trades,1);assert.ok(Math.abs(hold.fees-9.90099009)<1e-6);
// An initial purchase must use the next close (10), not the decision close (1).
assert.ok(hold.end<2000);
run("sample=sample.map(r=>[r[0],10])");
const dca=run("simulateHistory(sample,20,90,1000,0,'dca')");assert.equal(dca.trades,4);assert.equal(dca.cash,0);assert.equal(dca.end,1000);
const short=run("simulateHistory(sample,20,25,1000,0,'dca')");assert.equal(short.trades,1);assert.equal(short.cash,750);assert.equal(short.end,1000);
const sma=run("simulateHistory(sample,20,25,1000,0,'sma')");assert.equal(sma.trades,0);assert.equal(sma.end,1000);
run('sample[20][1]=20;sample[21][1]=5');const signal=run("simulateHistory(sample,20,21,1000,0,'sma')");assert.equal(signal.units,200);
assert.equal(run("statsFor([['a',1000],['b',1200],['c',600]],1000).mdd"),50);
run('var book={cash:1000,units:0,fees:0,trades:0};tradeAt(book,10,"buy",.01,1000);tradeAt(book,10,"sell",.01,1)');assert.ok(Math.abs(run('book.cash')-980.1980198)<1e-6);
for(const symbol of run('Object.keys(TRAINING_CATALOG)')){const rows=run(`stockRows('${symbol}')`);assert.ok(rows.length>100);assert.ok(rows.every((r,i)=>Number.isFinite(r[1])&&r[1]>0&&(!i||r[0]>rows[i-1][0])));}
console.log('PASS: next-close execution, fees, DCA timing/cash, lagged SMA signal, max drawdown, all price series');
