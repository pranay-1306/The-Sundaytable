(()=>{
 const hero=document.querySelector('.hero');
 const art=document.getElementById('heroBookArt');
 if(!hero||!art||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 try{if(sessionStorage.getItem('sunday-table-book-intro-v12')==='played')return;sessionStorage.setItem('sunday-table-book-intro-v12','played')}catch{}

 const left=art.querySelector('.hero-page-left');
 const right=art.querySelector('.hero-page-right');
 const spreads=[
  [
   {kicker:'FROM GRANDPA’S KITCHEN',title:'Sunday sauce',copy:'Olive oil · onion · garlic',note:'✿'},
   {kicker:'A NOTE IN HIS WORDS',title:'“Don’t rush a Sunday.”',copy:'Let it simmer low and slow.',note:'Recipe no. 01'}
  ],
  [
   {kicker:'A FAVORITE',title:'Lemon cookies',copy:'Bright zest in the sugar.',note:'✿'},
   {kicker:'FROM THE TABLE',title:'Nonna’s gravy',copy:'Brown the sausage first.',note:'Recipe no. 02'}
  ],
  [
   {kicker:'FAMILY WISDOM',title:'Start with the pan',copy:'Those browned bits are flavor.',note:'✿'},
   {kicker:'A FAMILY STORY',title:'Room for one more',copy:'Pull up another chair.',note:'Recipe no. 03'}
  ],
  [
   {kicker:'KEPT WITH LOVE',title:'Pass it around',copy:'Recipes · voices · memories',note:'✿'},
   {kicker:'MADE TO BE SHARED',title:'Every voice belongs',copy:'Keep the stories alive at the table.',note:'The Sunday Table'}
  ]
 ];
 const setPage=(page,content)=>{
  if(!page)return;
  page.querySelector('small').textContent=content.kicker;
  page.querySelector('strong').textContent=content.title;
  page.querySelector('span').textContent=content.copy;
  page.querySelector('i').textContent=content.note;
 };
 ['one','two','three'].forEach((number,index)=>{
  const sheet=art.querySelector('.flip-'+number);
  sheet?.addEventListener('animationend',event=>{
   if(event.target!==sheet||event.animationName!=='page-flip-readable')return;
   setPage(left,spreads[index+1][0]);
   setPage(right,spreads[index+1][1]);
  });
 });

 const h=hero.getBoundingClientRect(),a=art.getBoundingClientRect();
 const travelX=(h.left+h.width/2)-(a.left+a.width/2);
 const travelY=(h.top+h.height/2)-(a.top+a.height/2);
 art.style.setProperty('--book-travel-x',travelX+'px');
 art.style.setProperty('--book-travel-y',travelY+'px');
 window.setTimeout(()=>{hero.classList.add('hero-book-sequence');window.setTimeout(()=>hero.classList.remove('hero-book-sequence'),6000)},650);
})();
