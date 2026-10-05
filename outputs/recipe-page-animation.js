(()=>{
 const dialog=document.getElementById('detailDialog');
 if(!dialog)return;
 let closeTimer;
 const closeWithPageTurn=()=>{
  if(!dialog.open||dialog.classList.contains('closing'))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return}
  dialog.classList.add('closing');
  closeTimer=window.setTimeout(()=>{
   if(dialog.open)dialog.close();
   dialog.classList.remove('closing');
  },220);
 };
 dialog.addEventListener('click',event=>{
  if(!event.target.closest('[data-close-detail]'))return;
  event.preventDefault();
  event.stopPropagation();
  closeWithPageTurn();
 },true);
 dialog.addEventListener('cancel',event=>{
  event.preventDefault();
  closeWithPageTurn();
 });
 dialog.addEventListener('close',()=>{
  window.clearTimeout(closeTimer);
  dialog.classList.remove('closing');
 });
})();
