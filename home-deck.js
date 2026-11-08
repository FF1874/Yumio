(function initHomeIntroduction(){
  const home=document.getElementById('home');
  const photo=home.querySelector('#productGalleryImage');
  const productImages={
    printer:['printer.webp','食品打印机在打印花形点心，旁边是两颗可替换的原料胶囊'],
    structure:['structure-sand.webp','双仓料盒的外观和剖面，绿色与橙色胶囊分别连接两个出料口']
  };
  const buttons=home.querySelectorAll('[data-product-image]');
  for(const button of buttons){
    button.addEventListener('click',()=>{
      const [file,description]=productImages[button.dataset.productImage];
      photo.src='assets/home/'+file;
      photo.alt=description;
      for(const item of buttons)item.setAttribute('aria-pressed',String(item===button));
    });
  }
  home.querySelector('[data-open-intro]').addEventListener('click',()=>{
    document.getElementById('deckTitle').focus({preventScroll:true});
    document.getElementById('homeDeck').scrollIntoView({block:'start',
      behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  home.querySelector('[data-enter-studio]').addEventListener('click',()=>wkSetMode('template'));
})();
