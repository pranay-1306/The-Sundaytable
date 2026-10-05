(()=>{
 const hero=document.querySelector('.hero');
 const art=document.getElementById('heroBookArt');
 if(!hero||!art||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 try{if(sessionStorage.getItem('sunday-table-book-intro-v11')==='played')return;sessionStorage.setItem('sunday-table-book-intro-v11','played')}catch{}
 const h=hero.getBoundingClientRect(),a=art.getBoundingClientRect();
 const travelX=(h.left+h.width/2)-(a.left+a.width/2);
 const travelY=(h.top+h.height/2)-(a.top+a.height/2);
 art.style.setProperty('--book-travel-x',travelX+'px');
 art.style.setProperty('--book-travel-y',travelY+'px');
 window.setTimeout(()=>{hero.classList.add('hero-book-sequence');window.setTimeout(()=>hero.classList.remove('hero-book-sequence'),6000)},650);
})();
