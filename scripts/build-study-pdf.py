import json, shutil
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_LEFT
D=json.loads(Path('tmp/pdfs/content.json').read_text('utf-8'))
pdfmetrics.registerFont(TTFont('Korean','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KoreanBold','C:/Windows/Fonts/malgunbd.ttf'))
W,H=A4
styles={
 'title':ParagraphStyle('title',fontName='KoreanBold',fontSize=25,leading=35,textColor=HexColor('#214f3b'),spaceAfter=22,wordWrap='CJK'),
 'h':ParagraphStyle('h',fontName='KoreanBold',fontSize=12,leading=18,textColor=HexColor('#214f3b'),spaceBefore=12,spaceAfter=6,wordWrap='CJK',keepWithNext=True),
 'body':ParagraphStyle('body',fontName='Korean',fontSize=10,leading=16,spaceAfter=8,wordWrap='CJK'),
 'small':ParagraphStyle('small',fontName='Korean',fontSize=8,leading=12,textColor=HexColor('#58695f'),spaceAfter=7,wordWrap='CJK'),
 'example':ParagraphStyle('example',fontName='Korean',fontSize=10,leading=17,spaceBefore=12,spaceAfter=20,backColor=HexColor('#edf3e8'),borderPadding=10,wordWrap='CJK'),
}
story=[]
def p(text,style='body'): story.append(Paragraph(escape(text),styles[style]))
def link(label,url): story.append(Paragraph('<link href="'+escape(url,{'"':'&quot;'})+'" color="#214f3b"><u>'+escape(label)+'</u></link>',styles['small']))
def footer(c,d):
 c.setStrokeColor(HexColor('#d4dfd0'));c.line(44,44,W-44,44);c.setFont('Korean',8);c.setFillColor(HexColor('#58695f'));c.drawString(44,30,'LONGVIEW | 개인 투자 학습 안내서');c.drawRightString(W-44,30,str(d.page))
p('LONGVIEW','small');p('내 투자에 연결하는\n투자 학습 안내서','title');p(f"{len(D['weeks'])}주 학습 과정 · {len(D['shelf'])}개 자료 · 쉬운 설명과 숫자 예제",'h')
p('자료 확인일 2026-10-16 · 한국어 학습 보조 자료')
p('읽는 순서: 쉬운 설명 → 가상 숫자 예제 → 관심 종목 적용 → 확인 질문 → 해설 → 공식 원문')
p('이 안내서는 공개 자료를 공부하기 위한 자체 설명과 연습 문제입니다. 원문 전체를 복제한 책자가 아닙니다. 숫자 예제는 모두 가상이며 실제 기업 실적, 현재 금리, ETF 편입 비중이 아닙니다.','example')
p('공부 방법','h');p('회당 20~30분, 한 자료씩 읽으세요. 답을 보기 전에 질문에 스스로 답하고, 내 종목에 확인할 사실 하나를 남기세요. 학습 속도에 맞춰 기간을 늘려도 좋습니다.')
p('아이온큐 · 엔비디아 · S&P 500 · 나스닥 100','h');p('기업에 대한 기대를 공시와 숫자로 확인하고, 가격 변화와 사업 변화를 구분하는 연습을 합니다. 자료에 나오는 종목은 매수·매도 추천이 아닙니다.')
p('활용 안내','h');p('각 자료 끝의 공식 원문 링크는 클릭할 수 있습니다. 마지막에는 확인 질문의 정답·해설을 모았습니다. PDF 책갈피로 자료 사이를 이동할 수 있습니다.')
link('온라인 학습 앱 열기','https://seonghwapark.github.io/longview-investing-school/')
story.append(PageBreak())
p(f"{len(D['weeks'])}주 학습 순서",'title')
for title,ids,result in D['weeks']:
 p(title,'h');p(result);p(' / '.join(next(r['title'] for r in D['shelf'] if r['id']==i) for i in ids),'small')
p('매번 남길 다섯 줄','h');p('원문과 날짜 / 배운 개념 / 확인한 숫자와 기간 / 반대 근거 / 다음 질문','example');story.append(PageBreak())
p('자료 목차','title')
for i,r in enumerate(D['shelf'],1):
 story.append(Paragraph(f'<link href="#item-{r["id"]}" color="#214f3b">{i:02d}. {escape(r["title"])}</link>',styles['small']))
story.append(PageBreak())
for i,r in enumerate(D['shelf'],1):
 plain,example,apply,q,a,term=D['easy'][r['id']]
 story.append(Paragraph(f'<a name="item-{r["id"]}"/>{i:02d} · {escape(r["category"])} · {escape(r["level"])}',styles['small']))
 p(r['title'],'title');p(r['author']+' | '+r['format'],'small');p(r['about'],'small');p(plain,'example')
 for title,text in [('① 작은 숫자로 이해하기',example),('② 내 관심 종목에 연결',apply),('③ 용어 한 개',term),('④ 먼저 풀어보기',q),('⑤ 원문에서 더 공부하기',r['start']),('학습 관점과 과제',r['key']+' '+r['task'])]:p(title,'h');p(text)
 p('읽을 때 참고: '+r['limit'],'small');p('숫자는 가상 예제입니다. 정답·해설은 책 뒤쪽에서 확인하세요.','small');link('공식 원문 열기 · '+r['author'],r['url']);story.append(PageBreak())
p('확인 질문 정답과 해설','title')
for i,r in enumerate(D['shelf'],1):
 p(f'{i:02d}. '+r['title'],'h');p(D['easy'][r['id']][3],'small');p(D['easy'][r['id']][4])
class BookDoc(SimpleDocTemplate):
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and 'name="item-' in f.text:
   key=f.text.split('name="')[1].split('"')[0];self.canv.bookmarkPage(key);idx=key[5:];self.canv.addOutlineEntry(next(r['title'] for r in D['shelf'] if r['id']==idx),key,0)
out='output/pdf/LONGVIEW-study-guide.pdf'
BookDoc(out,pagesize=A4,rightMargin=44,leftMargin=44,topMargin=42,bottomMargin=60,title='LONGVIEW 투자 학습 안내서',author='LONGVIEW',pageCompression=1).build(story,onFirstPage=footer,onLaterPages=footer)
shutil.copyfile(out,'dist/study-guide.pdf')
print(out)


