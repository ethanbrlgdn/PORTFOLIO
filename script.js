const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Theme toggle (saved in localStorage) ---- */
$('#theme').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.classList.add('theming');
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { }
    setTimeout(() => root.classList.remove('theming'), 600);
});

/* ---- Mobile menu ---- */
const burger = $('#burger'), menu = $('#menu');
const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
};
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => { if (e.target.tagName === 'A') setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---- Active nav link ---- */
const links = $$('nav a');
const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === '#' + en.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section').forEach(s => navIO.observe(s));

/* ---- Reveal on scroll ---- */
const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
    });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => {
    const i = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = (i % 3) * 70 + 'ms';
    io.observe(el);
});

/* ---- Name: split into letters so each one reacts on hover ---- */
const name = $('#name');
name.innerHTML = [...name.textContent].map(c => `<span aria-hidden="true">${c}</span>`).join('');

/* ---- Scroll progress + background scroll offset ---- */
let ticking = false;
addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const max = document.body.scrollHeight - innerHeight;
        root.style.setProperty('--p', max > 0 ? scrollY / max : 0);
        if (!reduce) root.style.setProperty('--sy', scrollY);
        ticking = false;
    });
}, { passive: true });

/* ---- Floating dots in the background ---- */
if (!reduce) {
    const bg = $('.bg');
    for (let i = 0; i < 14; i++) {
        const d = document.createElement('span');
        d.className = 'dot';
        d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${25 + Math.random() * 30}s;animation-direction:alternate`;
        bg.appendChild(d);
    }
}

/* ---- Cursor ring + soft glow + mouse parallax (mouse devices only) ---- */
if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const ring = $('.cursor'), glow = $('.glow');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    root.classList.add('has-cursor');
    addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        root.style.setProperty('--mx', (mx / innerWidth - .5).toFixed(3));
        root.style.setProperty('--my', (my / innerHeight - .5).toFixed(3));
        glow.style.transform = `translate(${mx}px,${my}px)`;
    });
    (function loop() {
        rx += (mx - rx) * .18; ry += (my - ry) * .18;
        ring.style.transform = `translate(${rx}px,${ry}px)`;
        requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
        ring.classList.toggle('big', !!e.target.closest('a,button,.card,.chips li'));
    });
}

/* ---- Contact form: static site, so no fake sending ---- */
$('#form').addEventListener('submit', e => {
    const f = e.currentTarget, note = $('#note');
    if (f.action.includes('YOUR_FORM_ID')) {
        e.preventDefault();
        note.textContent = 'The form isn’t connected yet. Please email ethanborlagdan131@gmail.com instead.';
    } else if (!f.checkValidity()) {
        e.preventDefault();
        note.textContent = 'Please fill in your name, a valid email, and a message.';
    }
});

/* ---- Project hover preview: add data-preview="path.jpg" to any .card ---- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const peek = document.createElement('div');
    const pic = new Image();
    peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true'); pic.alt = '';
    peek.appendChild(pic); document.body.appendChild(peek);
    let current = null;
    const place = card => {
        const r = card.getBoundingClientRect(), w = 260, h = 195;
        let x = r.right - w * .25;                         // overlap the card's right edge
        if (x + w > innerWidth - 12) x = r.left - w * .75; // no room? pop out on the left
        x = Math.max(12, Math.min(x, innerWidth - w - 12));
        const y = Math.max(12, Math.min(r.top - h * .2, innerHeight - h - 12));
        peek.style.left = x + 'px'; peek.style.top = y + 'px';
        peek.style.transformOrigin = `${(r.left + r.width / 2 - x) / w * 100}% ${(r.top + r.height / 2 - y) / h * 100}%`;
    };
    pic.onload = () => { if (current) { place(current); peek.classList.add('show'); } };
    pic.onerror = () => peek.classList.remove('show'); // image missing: just skip
    document.addEventListener('mouseover', e => {
        const card = e.target.closest('[data-preview]');
        if (card === current) return;
        current = card;
        peek.classList.remove('show');
        if (card) pic.src = card.dataset.preview;
    });
    addEventListener('scroll', () => { if (current) place(current); }, { passive: true });
}

/* ---- Intro: name decodes while a line fills, then the screen splits open ---- */
(() => {
    const intro = $('#intro');
    const ready = () => {
        root.classList.add('ready');
        $$('.hero-text > *').forEach((el, i) => el.style.animationDelay = (500 + i * 90) + 'ms');
    };
    if (reduce || !intro) { if (intro) intro.remove(); ready(); return; }
    document.body.style.overflow = 'hidden';

    const word = 'Ethantzy', pool = '01{}<>/;#$%&*';
    const nameEl = $('#iname'), count = $('#icount');
    nameEl.innerHTML = [...word].map(() => '<span>0</span>').join('') + '<i>.</i>';
    const letters = $$('span', nameEl);
    const rnd = () => pool[Math.floor(Math.random() * pool.length)];

    let done = false, finishing = false, lastFrame = -1;
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => loaded = true);

    const lift = () => {
        if (done) return; done = true;
        letters.forEach((l, i) => { l.textContent = word[i]; l.className = 'l'; });
        count.textContent = '100';
        intro.style.setProperty('--ip', 1);
        intro.classList.add('split');
        ready();
        document.body.style.overflow = '';
        setTimeout(() => intro.remove(), 1700);
    };

    const DUR = 1600, t0 = performance.now();
    const tick = now => {
        if (done) return;
        const t = now - t0, p = Math.min(t / DUR, 1), e = 1 - Math.pow(1 - p, 3);
        intro.style.setProperty('--ip', e);
        count.textContent = String(Math.round(e * 100)).padStart(3, '0');
        const frame = Math.floor(t / 60);
        letters.forEach((l, i) => {
            if (t > 450 + i * 130) { if (l.className !== 'l') { l.textContent = word[i]; l.className = 'l'; } }
            else if (frame !== lastFrame) l.textContent = rnd();
        });
        lastFrame = frame;
        if (p >= 1 && loaded && !finishing) { finishing = true; setTimeout(lift, 300); }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(lift, 5000); // safety: never block the page
})();