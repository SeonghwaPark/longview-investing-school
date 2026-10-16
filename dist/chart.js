// 차트 보기 · 실제 종목의 캔들·거래량·이동평균·볼린저와 RSI/MACD 보조 창. TradingView lightweight-charts(CDN) 사용, 없으면 SVG 선 차트로 대체.
let chartUI={symbol:'VOO',unit:'D',range:'1y',log:false,ma20:true,ma50:true,ma200:true,bb:false,sub:'rsi'};
try{const s=JSON.parse(localStorage.getItem('longview-chart-v1'));if(s&&typeof s==='object'&&MARKET_HISTORY.symbols[s.symbol])chartUI={...chartUI,...s}}catch{}
let lwCharts=[];
const CHART_RANGES=[['6m','6개월'],['1y','1년'],['3y','3년'],['5y','5년'],['all','전체']];
function saveChartUI(){try{localStorage.setItem('longview-chart-v1',JSON.stringify(chartUI))}catch{}}
function chartView(){const d=MARKET_HISTORY.symbols[chartUI.symbol];return head('차트 보기','실제 종목 차트에 배운 개념을 대어 보는 자리. 그림은 질문을 만들 뿐, 답을 주지 않습니다.')+`<div class="topic-chips subtabs"><button class="chip ${tab!=='lab'?'selected':''}" data-tab="real">실제 종목 차트</button><button class="chip ${tab==='lab'?'selected':''}" data-tab="lab">가상 실험 (비율·현재가치·이동평균)</button></div>`+(tab==='lab'?lab():`<div class="note-banner">일별 시가·고가·저가·종가·거래량 · ${MARKET_HISTORY.provider} · ${MARKET_HISTORY.asOf}까지, 매주 자동 갱신 · 캔들은 분할 조정, 이동평균·보조지표는 캔들의 종가로 계산 · 빨강 = 양봉(종가 &gt; 시가), 파랑 = 음봉 · 실시간 시세가 아닙니다.</div>
<section class="panel chart-controls"><div class="chart-row"><label class="field">종목<select id="chartSymbol">${Object.entries(MARKET_HISTORY.symbols).map(([s,x])=>`<option value="${s}" ${s===chartUI.symbol?'selected':''}>${x.name} · ${s}</option>`).join('')}</select></label><div class="field">봉 주기<div class="seg">${[['D','일봉'],['W','주봉'],['M','월봉']].map(([k,n])=>`<button class="${chartUI.unit===k?'on':''}" data-unit="${k}">${n}</button>`).join('')}</div></div><div class="field">기간<div class="seg">${CHART_RANGES.map(([k,n])=>`<button class="${chartUI.range===k?'on':''}" data-range="${k}">${n}</button>`).join('')}</div></div></div><div class="chart-row chart-toggles"><label><input type="checkbox" data-opt="ma20" ${chartUI.ma20?'checked':''}> MA 20</label><label><input type="checkbox" data-opt="ma50" ${chartUI.ma50?'checked':''}> MA 50</label><label><input type="checkbox" data-opt="ma200" ${chartUI.ma200?'checked':''}> MA 200</label><label><input type="checkbox" data-opt="bb" ${chartUI.bb?'checked':''}> 볼린저밴드 (20, 2σ)</label><label><input type="checkbox" data-opt="log" ${chartUI.log?'checked':''}> 로그 축</label><label class="field" style="margin:0">보조 창<select id="chartSub"><option value="rsi" ${chartUI.sub==='rsi'?'selected':''}>RSI (14)</option><option value="macd" ${chartUI.sub==='macd'?'selected':''}>MACD (12, 26, 9)</option><option value="atr" ${chartUI.sub==='atr'?'selected':''}>ATR % (14)</option><option value="rel" ${chartUI.sub==='rel'?'selected':''}>VOO 대비 상대강도</option><option value="none" ${chartUI.sub==='none'?'selected':''}>없음</option></select></label></div></section>
<section class="panel chart-stage"><div class="chart-legend" id="chartLegend"></div><div id="lwMain" class="lw-main"></div><div id="lwSub" class="lw-sub ${chartUI.sub==='none'?'hidden':''}"></div><p class="note" id="chartFallbackNote"></p></section>
<section class="panel" style="margin-top:22px"><span class="tag">READ · 이 차트에서 지금 읽을 수 있는 것</span><h2 style="margin:10px 0">${esc(d.name)} · ${chartUI.symbol}</h2><div id="chartReading"></div><p class="note">숫자는 모두 이 날짜까지의 가격에서만 계산했습니다. 사업의 변화, 실적, 가치 평가는 차트에 없습니다. 판단은 ‘판단 도구’에서 근거·반대 근거와 함께 남기세요.</p><div class="actions"><button class="primary" data-go="judge" data-go-tab="now">판단 도구에서 이 종목 보기 →</button><button class="secondary" data-go="learn" data-go-tab="guide">차트 읽기 가이드</button><button class="secondary" data-go="training">훈련실에서 과거 시점으로</button></div></section>`)}
function chartRows(){const all=MARKET_HISTORY.symbols[chartUI.symbol].rows;const rows=IND.aggregate(all,chartUI.unit);return rows}
function visibleFrom(rows){const last=rows.at(-1)[0];const back={'6m':{months:-6},'1y':{years:-1},'3y':{years:-3},'5y':{years:-5}}[chartUI.range];if(!back)return rows[0][0];const from=IND.shiftDate(last,back);return from<rows[0][0]?rows[0][0]:from}
function bindChart(){
 if(tab==='lab'){['previous','revenue','profit','cash','years','rate'].forEach(id=>$('#'+id).oninput=calc);$('#period').onchange=drawChart;calc();drawChart();return}
 $('#chartSymbol').onchange=e=>{chartUI.symbol=e.target.value;saveChartUI();render()};
 document.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{chartUI.unit=b.dataset.unit;saveChartUI();render()});
 document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{chartUI.range=b.dataset.range;saveChartUI();render()});
 document.querySelectorAll('[data-opt]').forEach(c=>c.onchange=()=>{chartUI[c.dataset.opt]=c.checked;saveChartUI();drawRealChart()});
 $('#chartSub').onchange=e=>{chartUI.sub=e.target.value;saveChartUI();drawRealChart()};
 drawRealChart();renderReading();
}
function destroyCharts(){lwCharts.forEach(c=>{try{c.remove()}catch{}});lwCharts=[]}
function drawRealChart(){
 destroyCharts();const rows=chartRows(),F=IND.F,main=$('#lwMain'),sub=$('#lwSub');if(!main)return;sub.classList.toggle('hidden',chartUI.sub==='none');
 const close=rows.map(r=>r[F.close]);
 if(!window.LightweightCharts){const from=visibleFrom(rows);const vis=rows.filter(r=>r[0]>=from);main.innerHTML=trainingChart([{name:`${chartUI.symbol} 종가`,curve:vis.map(r=>[r[0],r[F.close]])}],true);sub.innerHTML='';$('#chartFallbackNote').textContent='차트 라이브러리를 불러오지 못해 종가 선 차트로 대신 표시합니다. 인터넷 연결 뒤 새로고침하면 캔들·지표가 보입니다.';return}
 $('#chartFallbackNote').textContent='';
 const base={autoSize:true,layout:{background:{color:'#ffffff'},textColor:'#52655d',fontFamily:"'Noto Sans KR',sans-serif"},grid:{vertLines:{color:'#eef1ec'},horzLines:{color:'#eef1ec'}},rightPriceScale:{borderColor:'#dfe5df'},timeScale:{borderColor:'#dfe5df',timeVisible:false,rightOffset:3},crosshair:{mode:0},localization:{locale:'ko-KR',priceFormatter:p=>p>=1000?p.toLocaleString('en-US',{maximumFractionDigits:0}):p.toFixed(2)}};
 const chart=LightweightCharts.createChart(main,{...base,rightPriceScale:{...base.rightPriceScale,mode:chartUI.log?1:0}});lwCharts.push(chart);
 const up='#c0504d',dn='#4979a5';
 const candle=chart.addCandlestickSeries({upColor:up,downColor:dn,borderVisible:false,wickUpColor:up,wickDownColor:dn});candle.setData(rows.map(r=>({time:r[0],open:r[F.open],high:r[F.high],low:r[F.low],close:r[F.close]})));
 const vol=chart.addHistogramSeries({priceFormat:{type:'volume'},priceScaleId:'vol',lastValueVisible:false,priceLineVisible:false});chart.priceScale('vol').applyOptions({scaleMargins:{top:.82,bottom:0}});vol.setData(rows.map(r=>({time:r[0],value:r[F.vol],color:r[F.close]>=r[F.open]?'#c0504d44':'#4979a544'})));
 const lineOf=(arr,color,width=1.5,style=0)=>{const s=chart.addLineSeries({color,lineWidth:width,lineStyle:style,priceLineVisible:false,lastValueVisible:false,crosshairMarkerVisible:false});s.setData(rows.map((r,i)=>arr[i]==null?null:{time:r[0],value:arr[i]}).filter(Boolean));return s};
 const series={};
 if(chartUI.ma20)series.ma20=lineOf(IND.sma(close,20),'#b67b2f');
 if(chartUI.ma50)series.ma50=lineOf(IND.sma(close,50),'#5a8a5a');
 if(chartUI.ma200)series.ma200=lineOf(IND.sma(close,200),'#976b91',2);
 if(chartUI.bb){const b=IND.bollinger(close,20,2);series.bbu=lineOf(b.upper,'#8aa0b8',1,2);series.bbl=lineOf(b.lower,'#8aa0b8',1,2)}
 let subChart=null,subSeries={};
 if(chartUI.sub!=='none'){subChart=LightweightCharts.createChart(sub,{...base,rightPriceScale:{...base.rightPriceScale,scaleMargins:{top:.1,bottom:.1}}});lwCharts.push(subChart);
  const sline=(arr,color,width=1.5)=>{const s=subChart.addLineSeries({color,lineWidth:width,priceLineVisible:false,lastValueVisible:true});s.setData(rows.map((r,i)=>arr[i]==null?null:{time:r[0],value:arr[i]}).filter(Boolean));return s};
  if(chartUI.sub==='rsi'){const r=IND.rsi(close,14);subSeries.rsi=sline(r,'#214f3b');[30,70].forEach(v=>subSeries.rsi.createPriceLine({price:v,color:'#b9c9bb',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:''}))}
  if(chartUI.sub==='macd'){const m=IND.macd(close);const h=subChart.addHistogramSeries({priceLineVisible:false,lastValueVisible:false});h.setData(rows.map((r,i)=>m.hist[i]==null?null:{time:r[0],value:m.hist[i],color:m.hist[i]>=0?'#c0504d77':'#4979a577'}).filter(Boolean));subSeries.macd=sline(m.line,'#214f3b');subSeries.signal=sline(m.signal,'#b67b2f',1)}
  if(chartUI.sub==='atr'){const a=IND.atr(rows,14).map((v,i)=>v==null?null:v/rows[i][F.close]*100);subSeries.atr=sline(a,'#976b91')}
  if(chartUI.sub==='rel'){const voo=IND.aggregate(MARKET_HISTORY.symbols.VOO.rows,chartUI.unit);const vmap=new Map(voo.map(r=>[r[0],r[F.adj]]));let base=null;const rel=rows.map(r=>{const v=vmap.get(r[0]);if(v==null)return null;const x=r[F.adj]/v;if(base==null)base=x;return x/base*100});subSeries.rel=sline(rel,'#214f3b');subSeries.rel.createPriceLine({price:100,color:'#b9c9bb',lineWidth:1,lineStyle:2,axisLabelVisible:false,title:''});$('#chartFallbackNote').textContent='상대강도 = 종목 ÷ VOO (배당 포함, 수록 첫날 = 100). 선이 오르면 시장보다 강했고, 내리면 약했다는 뜻입니다. 시장과 함께 내리는 중에도 선이 오를 수 있습니다.'}
  let lock=false;const sync=(a,b)=>a.timeScale().subscribeVisibleLogicalRangeChange(r=>{if(lock||!r)return;lock=true;b.timeScale().setVisibleLogicalRange(r);lock=false});sync(chart,subChart);sync(subChart,chart);
 }
 const from=visibleFrom(rows);chart.timeScale().setVisibleRange({from,to:rows.at(-1)[0]});
 const legend=$('#chartLegend');const fmt=v=>v==null?'–':v>=1000?v.toLocaleString('en-US',{maximumFractionDigits:0}):v.toFixed(2);
 const showLegend=(i)=>{const r=rows[i];if(!r)return;const idx=i;const sm=(n)=>{const a=IND.sma(close.slice(Math.max(0,idx-n+1),idx+1),n);return a.at(-1)};const chg=idx>0?(r[F.close]/rows[idx-1][F.close]-1)*100:null;legend.innerHTML=`<b>${r[0]}</b> 시 ${fmt(r[F.open])} 고 ${fmt(r[F.high])} 저 ${fmt(r[F.low])} 종 <b>${fmt(r[F.close])}</b> ${chg==null?'':`<span style="color:${chg>=0?up:dn}">${chg>=0?'+':''}${chg.toFixed(2)}%</span>`} · 거래량 ${(r[F.vol]/1e6).toFixed(2)}M${chartUI.ma20&&idx>=19?` · <span style="color:#b67b2f">MA20 ${fmt(sm(20))}</span>`:''}${chartUI.ma50&&idx>=49?` · <span style="color:#5a8a5a">MA50 ${fmt(sm(50))}</span>`:''}${chartUI.ma200&&idx>=199?` · <span style="color:#976b91">MA200 ${fmt(sm(200))}</span>`:''}`};
 showLegend(rows.length-1);
 const byTime=new Map(rows.map((r,i)=>[r[0],i]));chart.subscribeCrosshairMove(p=>{if(!p.time){showLegend(rows.length-1);return}const i=byTime.get(typeof p.time==='string'?p.time:`${p.time.year}-${String(p.time.month).padStart(2,'0')}-${String(p.time.day).padStart(2,'0')}`);if(i!=null)showLegend(i)});
}
function renderReading(){const el=$('#chartReading');if(!el)return;const F=IND.F,rows=MARKET_HISTORY.symbols[chartUI.symbol].rows,s=IND.snapshot(rows,MARKET_HISTORY.symbols.VOO?.rows);if(!s){el.innerHTML='<p class="note">자료가 부족합니다.</p>';return}const vol5=rows.slice(-5).reduce((a,r)=>a+r[F.vol],0)/5,vol60=rows.slice(-60).reduce((a,r)=>a+r[F.vol],0)/Math.min(60,rows.length);const p=(x,d=1)=>x==null?'–':(x>0?'+':'')+(x*100).toFixed(d)+'%';
 const cards=[
  ['추세',s.m200?`${s.vsM200>=0?'200일선 위':'200일선 아래'} (${p(s.vsM200)}) · 50일선 ${p(s.vsM50)} · 200일선은 최근 20거래일간 ${s.slope200==null?'–':s.slope200>0.002?'상승':s.slope200<-0.002?'하락':'평평'}`:'200일선을 계산할 만큼의 자료가 아직 없습니다.','장기 평균선 위에서 기울기가 오르면 관행적으로 상승 추세로 읽습니다. 추세는 사후에 선명하고, 전환점은 늦게 확인됩니다.'],
  ['위치',`52주 고점 대비 ${p(s.fromHigh)} · 52주 저점 대비 ${p(s.fromLow)} · 1년 최대 낙폭 ${(s.mdd1y*100).toFixed(1)}%`,'고점 대비 낙폭은 ‘싸졌다’가 아니라 ‘얼마나 내려왔다’입니다. 사업이 나빠져 내려온 것인지 함께 봐야 합니다.'],
  ['모멘텀',`RSI(14) ${s.rsi==null?'–':s.rsi.toFixed(0)} (${s.rsi==null?'':s.rsi>=70?'관행상 과매수 구간':s.rsi<=30?'관행상 과매도 구간':'중립 구간'}) · 1주 ${p(s.r1w)} · 1개월 ${p(s.r1m)} · 3개월 ${p(s.r3m)}`,'강한 추세에서는 RSI 70 위가 오래 유지됩니다. 30 아래가 반등의 약속은 아닙니다.'],
  ['거래량',`최근 5일 평균 ${(vol5/1e6).toFixed(2)}M · 60일 평균 대비 ${p(vol5/vol60-1,0)}`,'가격 변화에 거래가 동반됐는지 보는 보조 정보입니다. 거래량 증가가 방향을 알려 주지는 않습니다.'],
  ['변동성',`ATR(14) / 가격 ${s.atrPct==null?'–':(s.atrPct*100).toFixed(2)+'%'} · 하루 평균 이 정도 흔들립니다`,'변동성이 크면 같은 금액이라도 하루 손익 폭이 큽니다. 포지션 크기를 정할 때 쓰는 숫자입니다.'],
  ['장기 성과',`1년 ${p(s.r1y)} · 3년 연환산 ${p(s.cagr3)} · 5년 연환산 ${p(s.cagr5)} · VOO 대비 1년 ${p(s.rel1y)}`,'배당 포함 조정종가 기준입니다. 과거 수익률은 앞으로의 수익률이 아닙니다.']
 ];
 el.innerHTML=`<div class="judge-cards">${cards.map(([t,v,n])=>`<div><span class="tag">${t}</span><p class="judge-value">${v}</p><p class="note">${n}</p></div>`).join('')}</div>`}
