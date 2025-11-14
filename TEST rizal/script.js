/* =========================================================
   Global UI
   - BGM control via audio iframe (postMessage)
   - Characters: animated filter (masonry-friendly)
   - Symbols accordion
   - Reader search
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- BGM ---------- */
  const frame = document.getElementById('audioFrame');
  const muteBtn = document.getElementById('muteBtn');
  const speakerIcon = muteBtn?.querySelector('.speaker-icon');
  const mutedIcon   = muteBtn?.querySelector('.muted-icon');
  const PREF_KEY = 'bgm_pref_v2';

  const getPref = () => localStorage.getItem(PREF_KEY) || 'on';
  const setPref = (v) => localStorage.setItem(PREF_KEY, v);

  function post(cmd){ frame?.contentWindow?.postMessage({cmd}, '*'); }
  function refreshIcons(){
    const off = getPref() === 'off';
    if (speakerIcon) speakerIcon.style.display = off ? 'none' : 'block';
    if (mutedIcon)   mutedIcon.style.display   = off ? 'block' : 'none';
  }

  // on first user gesture, if pref is ON → play
  const arm = () => {
    if (getPref() === 'on') post('play');
    window.removeEventListener('pointerdown', arm, true);
    window.removeEventListener('keydown', arm, true);
  };
  window.addEventListener('pointerdown', arm, true);
  window.addEventListener('keydown', arm, true);

  refreshIcons();

  if (muteBtn){
    muteBtn.addEventListener('click', () => {
      const off = getPref() === 'off';
      setPref(off ? 'on' : 'off');
      post('toggle');
      refreshIcons();
    });
  }

  /* ---------- Reader search ---------- */
  const searchInput = document.getElementById('chapterSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.chapter-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? 'block' : 'none';
      });
    });
  }

  /* ---------- Characters filter (with animated masonry feel) ---------- */
  const chips = document.querySelectorAll('.char-filter-bar .chip');
  const cards = document.querySelectorAll('.character-card');
  if (chips.length && cards.length) {
    const apply = (flt) => {
      let d = 0;
      cards.forEach(c => {
        const cat = (c.dataset.category || '').toLowerCase();
        const show = flt === 'all' || flt === cat;
        if (show){
          if (c.classList.contains('is-hidden')){
            c.classList.remove('is-hidden');
            c.style.transition = 'opacity .28s, transform .28s';
            c.style.opacity = '0'; c.style.transform = 'translateY(8px) scale(.98)';
            setTimeout(()=>{ c.style.opacity='1'; c.style.transform='none'; }, 16 + d);
            setTimeout(()=>{ c.style.transition=''; }, 320 + d);
            d += 35;
          }
        } else {
          c.style.opacity='0'; c.style.transform='scale(.96)';
          setTimeout(()=> c.classList.add('is-hidden'), 200);
        }
      });
    };
    chips.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        chips.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        apply((btn.dataset.filter||'all').toLowerCase());
      });
    });
    const current = document.querySelector('.char-filter-bar .chip.active');
    apply(current ? (current.dataset.filter||'all').toLowerCase() : 'all');
  }

  /* ---------- Symbols accordion ---------- */
  document.querySelectorAll('.symbol-card').forEach(card=>{
    card.addEventListener('click', ()=> card.classList.toggle('active'));
  });
});
  /* ---------- Smooth scroll globally ---------- */
  try { document.documentElement.style.scrollBehavior = 'smooth'; } catch(e){}
  /* ---------- AOS (soft entrance animations) ---------- */
  const candidates = document.querySelectorAll([
    '.chapter-card','.symbol-card','.author-card','.character-card',
    '.member-card','.arch-card','.gallery-card','.tile'
  ].join(','));
  candidates.forEach(el => el.classList.add('aos'));   // mark for animation

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add('aos-in');
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.08, rootMargin:'80px 0px'});
  candidates.forEach(el => io.observe(el));
    /* ---------- Gallery polish ---------- */
  document.querySelectorAll('.symbol-card img, .gallery-card img').forEach(img=>{
    img.setAttribute('loading','lazy');
  });
  /* ---------- Scroll-to-top (auto-created) ---------- */
(function(){
  if (document.getElementById('toTop')) return;
  const b = document.createElement('button');
  b.id = 'toTop';
  b.title = 'Back to top';
  b.textContent = '★';
  document.body.appendChild(b);

  const toggle = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    b.style.opacity = y > 200 ? '1' : '0';
    b.style.transform = y > 200 ? 'translateY(0)' : 'translateY(12px)';
  };
  window.addEventListener('scroll', toggle, {passive:true});
  b.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  toggle();
})();
/* ---------- Hover prefetch of internal pages ---------- */
(function(){
  const supported = 'prefetch' in document.createElement('link');
  const seen = new Set();
  function prefetch(url){
    if (!supported || seen.has(url)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url;
    document.head.appendChild(l);
    seen.add(url);
  }
  function maybePrefetch(t){
    const a = t.closest && t.closest('a[href$=".html"]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = a.getAttribute('href');
    if (url && !/^(https?:)?\/\//i.test(url)) prefetch(url);
  }
  document.addEventListener('mouseover', e => maybePrefetch(e.target), {passive:true});
  document.addEventListener('touchstart', e => maybePrefetch(e.target), {passive:true});
})();

/* ---------- Smooth page transitions (with View Transitions fallback) ---------- */
(function(){
  const isInternal = a => a && a.origin === location.origin && !a.target && !a.hasAttribute('download');
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if (!a || !isInternal(a)) return;
    const url = a.href;
    if (document.startViewTransition){
      e.preventDefault();
      document.startViewTransition(()=> { location.href = url; });
    } else {
      document.body.classList.add('leaving');
      setTimeout(()=> location.href = url, 120);
    }
  });

  // fade-in on load (fallback)
  document.body.classList.add('fade-init');
  requestAnimationFrame(()=> document.body.classList.add('fade-in'));
})();
