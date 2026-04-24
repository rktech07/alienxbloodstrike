// ── Helpers ──────────────────────────────────────────────────────────────
const sanitize = s => s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
const safeUrl  = u => { if(!u)return'#'; try{const p=new URL(u);if(p.protocol==='http:'||p.protocol==='https:')return u;}catch(e){} return'#'; };

// ── Config persistence ───────────────────────────────────────────────────
let CFG = {};
async function loadConfig() {
    try {
        const r = await fetch('/config.json?t='+Date.now());
        if (r.ok) CFG = await r.json();
    } catch(e) {
        // Fallback to localStorage for backwards compat
        try { CFG = JSON.parse(localStorage.getItem('creatorHub_cfg')||'{}'); } catch(e2){}
    }
}
async function saveConfig() {
    try {
        await fetch('/save-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(CFG)});
        localStorage.setItem('creatorHub_cfg', JSON.stringify(CFG));
    } catch(e) {
        localStorage.setItem('creatorHub_cfg', JSON.stringify(CFG));
    }
}

// ── Particles ─────────────────────────────────────────────────────────────
function spawnParticles() {
    const bg = document.getElementById('particles-bg');
    if (!bg) return;
    for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size  = Math.random() * 4 + 1;
        const delay = Math.random() * 15;
        const dur   = Math.random() * 20 + 12;
        const colors= ['rgba(232,65,24,0.6)','rgba(251,197,49,0.5)','rgba(108,92,231,0.5)','rgba(255,255,255,0.3)'];
        p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${dur}s;animation-delay:${delay}s;`;
        bg.appendChild(p);
    }
}

// ── Nav routing ──────────────────────────────────────────────────────────────
function initNav() {
    // Highlight active link based on current path
    const path = window.location.pathname.replace('.html', '').replace(/\/$/, '') || '/';
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('href').replace('.html', '').replace(/\/$/, '') || '/';
        if (path === linkPath || (path === '/index' && linkPath === '/')) {
            link.classList.add('active');
        }
    });
    // Hamburger
    const ham = document.getElementById('nav-hamburger');
    const sidebar = document.getElementById('main-nav');
    const overlay = document.getElementById('sidebar-overlay');

    if (ham && sidebar && overlay) {
        ham.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            const icon = ham.querySelector('i');
            if (icon) icon.className = sidebar.classList.contains('open') ? 'fa-solid fa-times' : 'fa-solid fa-bars';
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            const icon = ham.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-bars';
        });
        
        // Close sidebar when a link is clicked on mobile
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    const icon = ham.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-bars';
                }
            });
        });
    }

    // Nav scroll effect (no longer needed for sidebar, but safe to leave or remove. Removing.)
}

// ── Build a single update card HTML ─────────────────────────────────────
function buildUpdateCard(u, showLink) {
    const tagColors = {
        'BALANCE UPDATE': '#e84118', 'COLLABORATION': '#6c5ce7',
        'ANNIVERSARY': '#fbc531',    'VERSION UPDATE': '#0984e3',
        'WEAPON BALANCE': '#00b894', 'RANKED EVENT': '#a29bfe',
        'PATCH NOTES': '#fd79a8'
    };
    const tagColor = tagColors[u.tag] || 'var(--primary)';
    return `
        <div class="update-card" ${showLink && u.link ? `onclick="window.open('${safeUrl(u.link)}','_blank')" style="cursor:pointer;"` : ''}>
            ${u.poster
                ? `<img class="update-poster" src="${safeUrl(u.poster)}" alt="${sanitize(u.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div class="update-poster-placeholder" style="display:none;"><i class="fa-solid fa-gamepad"></i></div>`
                : `<div class="update-poster-placeholder"><i class="fa-solid fa-gamepad"></i></div>`}
            <div class="update-body">
                <span class="update-tag" style="background:${tagColor}22;border-color:${tagColor};color:${tagColor};">${sanitize(u.tag || 'Update')}</span>
                <div class="update-title">${sanitize(u.title)}</div>
                <div class="update-desc">${sanitize(u.desc)}</div>
                <div class="update-footer">
                    <span class="update-date"><i class="fa-solid fa-calendar-days" style="color:var(--primary);margin-right:4px;font-size:0.65rem;"></i>${sanitize(u.date || '')}</span>
                    ${showLink && u.link ? `<a href="${safeUrl(u.link)}" target="_blank" rel="noopener noreferrer" class="update-read-more" onclick="event.stopPropagation()">Read More <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>
        </div>`;
}

// ── Render Blood Strike updates ─────────────────────────────────────────
function renderUpdates() {
    const homeFeed  = document.getElementById('bs-updates-feed');
    const fullFeed  = document.getElementById('bs-updates-feed-full');
    if (!homeFeed && !fullFeed) return;

    const all = Array.isArray(CFG.bloodStrikeUpdates) ? CFG.bloodStrikeUpdates : [];

    // HOME: show only latest 3
    if (homeFeed) {
        if (all.length === 0) {
            homeFeed.innerHTML = '<div class="update-empty"><i class="fa-solid fa-bolt" style="font-size:2rem;color:var(--primary);display:block;margin-bottom:0.5rem;"></i>No updates yet.</div>';
        } else {
            homeFeed.innerHTML = all.slice(0, 3).map(u => buildUpdateCard(u, false)).join('');
        }
    }

    // FULL UPDATES VIEW: show all with links
    if (fullFeed) {
        if (all.length === 0) {
            fullFeed.innerHTML = '<div class="update-empty"><i class="fa-solid fa-bolt" style="font-size:2rem;color:var(--primary);display:block;margin-bottom:0.5rem;"></i>No updates yet.</div>';
        } else {
            fullFeed.innerHTML = all.map(u => buildUpdateCard(u, true)).join('');
        }
    }
}


// ── Render video cards ──────────────────────────────────────────────────
function renderVideos() {
    const lUrl = CFG.latestVideoUrl, pUrl = CFG.popularVideoUrl;
    if (lUrl) {
        const t=document.getElementById('latest-video-title'), d=document.getElementById('latest-video-desc'),
              l=document.getElementById('latest-video-link'), i=document.getElementById('latest-video-img'),
              n=document.getElementById('latest-video-icon'), v=document.getElementById('latest-video-views'),
              dt=document.getElementById('latest-video-date');
        if(t) t.textContent = CFG.latestVideoTitle||'Latest Video';
        if(d) d.textContent = CFG.latestVideoDesc||'';
        if(l) l.href = safeUrl(lUrl);
        if(v) v.innerHTML='<i class="fa-solid fa-fire"></i> New Release';
        if(dt) dt.innerHTML='<i class="fa-solid fa-clock"></i> Featured';
        if(CFG.latestVideoThumb&&i){i.style.backgroundImage=`url('${safeUrl(CFG.latestVideoThumb)}')`;if(n)n.style.display='none';}
    }
    if (pUrl) {
        const t=document.getElementById('popular-video-title'), d=document.getElementById('popular-video-desc'),
              l=document.getElementById('popular-video-link'), i=document.getElementById('popular-video-img'),
              n=document.getElementById('popular-video-icon'), v=document.getElementById('popular-video-views'),
              dt=document.getElementById('popular-video-date');
        if(t) t.textContent = CFG.popularVideoTitle||'Popular Video';
        if(d) d.textContent = CFG.popularVideoDesc||'';
        if(l) l.href = safeUrl(pUrl);
        if(v) v.innerHTML='<i class="fa-solid fa-star"></i> Fan Favorite';
        if(dt) dt.innerHTML='<i class="fa-solid fa-clock"></i> Featured';
        if(CFG.popularVideoThumb&&i){i.style.backgroundImage=`url('${safeUrl(CFG.popularVideoThumb)}')`;if(n)n.style.display='none';}
    }
}

// ── Render social cards ─────────────────────────────────────────────────
function renderSocial() {
    // Permanent defaults — always present even if config fails to load
    const ytName   = CFG.ytName       || 'ALIEN .X';
    const ytUrl    = CFG.ytChannelUrl || 'https://www.youtube.com/@Alien.x010';
    const ytLogo   = CFG.ytLogo       || 'https://yt3.ggpht.com/lflqvADhy2SPBUnLdWa1eQn5oDYb6A1mnC9UTTRoV2Q5KyqfsAaeBJL5cs12alKELPGRQPQR7w=s88-c-k-c0x00ffffff-no-rj';
    const fbUrl    = CFG.fbUrl        || 'https://www.facebook.com/share/14e41X3AExw/';
    const igUrl    = CFG.igUrl        || 'https://www.instagram.com/alienxbloodstrike';
    const tikTokUrl= CFG.tikTokUrl    || 'https://www.tiktok.com/@alienxbloodstrike';
    const discordUrl=CFG.discordUrl   || 'https://discord.gg/HAbxegtR';
    const el = id => document.getElementById(id);

    // YouTube
    const ynEl = el('yt-channel-name'), subBtn = el('yt-subscribe-btn');
    if(ynEl){ ynEl.textContent=ytName; ynEl.className='status connected'; }
    if(subBtn){ subBtn.textContent='Subscribe to '+ytName; subBtn.href=safeUrl(ytUrl); }
    if(ytLogo){ const np=el('nav-profile'),ni=el('nav-profile-img'); if(np&&ni){np.style.display='flex';ni.src=safeUrl(ytLogo);} }
    const act=el('yt-latest-activity'); if(act) act.textContent='Content from '+ytName;
    const stat=el('stat-channel'); if(stat) stat.textContent=ytName;

    // Discord
    const dc=el('discord-card'),dcb=el('discord-link-btn');
    if(dc) dc.style.display='block';
    if(dcb) dcb.href=safeUrl(discordUrl);

    // Facebook
    const fb=el('fb-card'),fbb=el('fb-link-btn');
    if(fb){ fb.style.display='block'; if(fbb) fbb.href=safeUrl(fbUrl); }
    // Instagram
    const ig=el('ig-card'),igb=el('ig-link-btn');
    if(ig){ ig.style.display='block'; if(igb) igb.href=safeUrl(igUrl); }
    // TikTok
    const tt=el('tiktok-card'),ttb=el('tiktok-link-btn');
    if(tt){ tt.style.display='block'; if(ttb) ttb.href=safeUrl(tikTokUrl); }
    // Twitch (only show if explicitly configured)
    const tw=el('twitch-card'),twb=el('twitch-link-btn');
    if(tw){ tw.style.display=CFG.twitchUrl?'block':'none'; if(twb&&CFG.twitchUrl) twb.href=safeUrl(CFG.twitchUrl); }
}

// ── New Upload nav button ────────────────────────────────────────────────
function renderNavUpload() {
    const btn=document.getElementById('nav-new-upload'), lbl=document.getElementById('nav-new-upload-label');
    if(!btn) return;
    if(CFG.newUploadUrl){ btn.href=safeUrl(CFG.newUploadUrl); if(lbl)lbl.textContent=CFG.newUploadLabel||'New Upload!'; btn.classList.remove('hidden'); }
    else btn.classList.add('hidden');
}

// ── Tournaments ──────────────────────────────────────────────────────────
function renderTournaments() {
    const list=document.getElementById('public-tournaments-list'); if(!list)return;
    const ts=Array.isArray(CFG.tournaments)?CFG.tournaments:[];
    const stat=document.getElementById('stat-tournaments'); if(stat)stat.textContent=ts.length;
    if(ts.length===0){list.innerHTML='<li><div><strong>No active events</strong><span>Check back later!</span></div></li>';return;}
    list.innerHTML='';
    ts.forEach(t=>{
        const li=document.createElement('li');
        const th=safeUrl(t.thumbnail);
        if(th!=='#'){li.style.backgroundImage=`linear-gradient(rgba(10,10,15,0.75),rgba(10,10,15,0.9)),url('${th}')`;li.style.backgroundSize='cover';}
        li.innerHTML=`<div style="flex:1;"><strong style="color:var(--primary);font-size:1rem;text-transform:uppercase;">${sanitize(t.game)}</strong>
            <h3>${sanitize(t.name)}</h3>
            <div style="font-size:0.82rem;color:var(--dim);margin-top:0.4rem;display:flex;flex-direction:column;gap:0.25rem;">
                <span><i class="fa-solid fa-calendar"></i> ${sanitize(new Date(t.date).toLocaleString())}</span>
                <span><i class="fa-solid fa-sack-dollar"></i> Prize: <strong style="color:var(--secondary);">${sanitize(t.prize)}</strong></span>
                <span><i class="fa-solid fa-users"></i> Max Slots: ${sanitize(String(t.slots))}</span>
            </div></div>
            <a href="${safeUrl(t.link)}" target="_blank" rel="noopener noreferrer" class="btn primary-btn" style="text-decoration:none;">Register</a>`;
        list.appendChild(li);
    });
}

// ── Spin Winners ─────────────────────────────────────────────────────────
function renderWinners() {
    const el=document.getElementById('winnersList'); if(!el)return;
    const ws=Array.isArray(CFG.spinWinners)?CFG.spinWinners:[];
    if(ws.length===0){el.innerHTML='<li style="text-align:center;color:var(--dim);">No winners yet.</li>';return;}
    el.innerHTML='';
    ws.forEach((w,i)=>{
        const li=document.createElement('li'); li.style.cssText='padding:10px;border-bottom:1px solid var(--gborder2);display:flex;justify-content:space-between;align-items:center;';
        const href=safeUrl(w.url); const urlHtml=href!=='#'?`<br><a href="${href}" target="_blank" rel="noopener noreferrer" style="font-size:0.72rem;color:var(--dim);text-decoration:underline;">View Channel</a>`:'';
        const wd=w.date?new Date(w.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
        li.innerHTML=`<div><strong style="color:${i===0?'var(--secondary)':'white'};">${i===0?'<i class="fa-solid fa-trophy"></i> ':''}${sanitize(w.name)}</strong>${urlHtml}</div>
            <span style="font-size:0.75rem;color:var(--dim);">${sanitize(wd)}</span>`;
        el.appendChild(li);
    });
}

// ── 3D Tilt ──────────────────────────────────────────────────────────────
function initTilt() {
    document.querySelectorAll('.tilt-card').forEach(card=>{
        card.addEventListener('mousemove',e=>{
            const r=card.getBoundingClientRect();
            const tX=(e.clientY-r.top-r.height/2)/18, tY=(r.width/2-(e.clientX-r.left))/18;
            card.style.transform=`perspective(1000px) rotateX(${tX}deg) rotateY(${tY}deg) scale(1.02) translateY(-6px)`;
        });
        card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
    });
}

// ── Scrolling character ──────────────────────────────────────────────────
function initCharacter() {
    const hs=document.querySelector('.home-scroll'), ch=document.getElementById('scrolling-character');
    if(!hs||!ch)return;
    let last=0;
    hs.addEventListener('scroll',()=>{
        const top=hs.scrollTop, h=hs.scrollHeight-hs.clientHeight;
        if(h>0){ ch.style.left=`${-100+(top/h)*(window.innerWidth+100)}px`; const ic=ch.querySelector('i'); if(ic)ic.style.transform=top>last?'scaleX(1)':'scaleX(-1)'; last=top; }
    },{passive:true});
}

// ── Storage sync (real-time between tabs) ───────────────────────────────
function initStorageSync() {
    window.addEventListener('storage', e=>{
        if(e.key==='creatorHub_cfg') { try{ CFG=JSON.parse(e.newValue||'{}'); renderAll(); }catch(err){} }
        if(e.key==='creatorHub_triggerSpin'&&e.newValue&&window.triggerExternalSpin) window.triggerExternalSpin();
        if(e.key==='creatorHub_wheelParticipants'&&window.updateWheelParticipants) window.updateWheelParticipants();
    });
    // Poll config.json every 10s for cross-session updates
    setInterval(async()=>{ await loadConfig(); renderAll(); }, 10000);
}

function renderAll() {
    renderUpdates(); renderVideos(); renderSocial(); renderNavUpload(); renderTournaments(); renderWinners();
}

// ── BOOT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    spawnParticles();
    initNav();
    await loadConfig();
    renderAll();
    initTilt();
    initCharacter();
    initStorageSync();
});
