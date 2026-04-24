const sanitize = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const safeUrl = u => { if (!u) return '#'; try { const p = new URL(u); if (p.protocol === 'http:' || p.protocol === 'https:') return u; } catch (e) { } return '#'; };
const $ = id => document.getElementById(id);
const val = id => ($(id) ? $(id).value.trim() : '');
const setVal = (id, v) => { if ($(id)) $(id).value = v || ''; };

const DEFAULT_GEMINI_KEY = ''; // Enter your Gemini API key in the Admin panel after deployment

// ── CFG persistence ──────────────────────────────────────────────────────
let CFG = {};

async function loadConfig() {
    try {
        const r = await fetch('/config.json?t=' + Date.now());
        if (r.ok) CFG = await r.json();
    } catch (e) {
        try { CFG = JSON.parse(localStorage.getItem('creatorHub_cfg') || '{}'); } catch (e2) { }
    }
}

async function saveConfig() {
    localStorage.setItem('creatorHub_cfg', JSON.stringify(CFG));
    localStorage.setItem('creatorHub_triggerSpin', CFG._triggerSpin || '');
    try {
        const r = await fetch('/save-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CFG) });
        return r.ok;
    } catch (e) { return false; }
}

function status(id, msg, color = '#55efc4') {
    const el = $(id); if (!el) return;
    el.textContent = msg; el.style.color = color;
    if (color !== '#fbc531') setTimeout(() => { el.textContent = ''; }, 4000);
}

// ── PIN LOCK ──────────────────────────────────────────────────────────────
const ADMIN_PIN = '1234';
function initPin() {
    const lock = $('admin-lock-screen'), main = $('admin-main-content'),
        inp = $('admin-pin-input'), btn = $('admin-pin-submit'), err = $('admin-pin-error');
    const show = () => { if (lock) lock.style.display = 'none'; if (main) main.style.display = 'block'; };
    const hide = () => { if (lock) lock.style.display = 'flex'; if (main) main.style.display = 'none'; };
    if (sessionStorage.getItem('adminAuth') === 'true') { show(); } else { hide(); }
    btn && btn.addEventListener('click', () => {
        if (inp && inp.value.trim() === ADMIN_PIN) { sessionStorage.setItem('adminAuth', 'true'); show(); if (err) err.textContent = ''; }
        else { if (err) err.textContent = 'Incorrect PIN.'; if (inp) { inp.value = ''; inp.focus(); } }
    });
    inp && inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn && btn.click(); });
}

// ── NAV ROUTING ───────────────────────────────────────────────────────────
function initNav() {
    const links = document.querySelectorAll('.nav-links a[data-target]'), views = document.querySelectorAll('.view');
    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            views.forEach(v => { v.classList.remove('active'); setTimeout(() => { if (!v.classList.contains('active')) v.style.display = 'none'; }, 300); });
            link.classList.add('active');
            const tv = document.getElementById(link.dataset.target); if (!tv) return;
            tv.style.display = 'flex'; setTimeout(() => tv.classList.add('active'), 10);
        });
    });
}

// ── PREFILL INPUTS FROM CONFIG ────────────────────────────────────────────
function prefillAll() {
    setVal('ytApiKey', CFG.ytApiKey);
    setVal('ytChannelId', CFG.ytChannelId);
    setVal('geminiApiKey', CFG.geminiApiKey);
    setVal('fbUrlInput', CFG.fbUrl);
    setVal('twitchUrlInput', CFG.twitchUrl);
    setVal('igUrlInput', CFG.igUrl);
    setVal('tikTokUrlInput', CFG.tikTokUrl);
    setVal('latestUrlInput', CFG.latestVideoUrl);
    setVal('latestTitleInput', CFG.latestVideoTitle);
    setVal('latestThumbInput', CFG.latestVideoThumb);
    setVal('latestDescInput', CFG.latestVideoDesc);
    setVal('popularUrlInput', CFG.popularVideoUrl);
    setVal('popularTitleInput', CFG.popularVideoTitle);
    setVal('popularThumbInput', CFG.popularVideoThumb);
    setVal('popularDescInput', CFG.popularVideoDesc);
    setVal('newUploadUrlInput', CFG.newUploadUrl);
    setVal('newUploadLabelInput', CFG.newUploadLabel);
    const sn = $('syncChannelName'); if (sn) sn.textContent = CFG.ytName || 'Not connected';
    renderAdminUpdates();
    renderAdminTournaments();
}

// ── YOUTUBE CONNECT ───────────────────────────────────────────────────────
function initYT() {
    const btn = $('ytConnectBtn'); if (!btn) return;
    btn.addEventListener('click', async () => {
        const key = val('ytApiKey'), cid = val('ytChannelId');
        if (!key || !cid) { status('ytStatusMsg', 'Enter both API Key and Channel ID.', '#ff7675'); return; }
        status('ytStatusMsg', 'Connecting...', '#f5f6fa');
        try {
            const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(cid)}&key=${encodeURIComponent(key)}`);
            const d = await r.json();
            if (d.error) throw new Error(d.error.message);
            if (d.items && d.items.length) {
                const ch = d.items[0].snippet;
                CFG.ytName = ch.title; CFG.ytApiKey = key; CFG.ytChannelId = cid;
                CFG.ytLogo = ch.thumbnails.default.url;
                CFG.ytChannelUrl = `https://www.youtube.com/channel/${cid}`;
                await saveConfig();
                status('ytStatusMsg', `Connected: ${ch.title}`);
                const sn = $('syncChannelName'); if (sn) sn.textContent = ch.title;
            } else { status('ytStatusMsg', 'Channel not found.', '#ff7675'); }
        } catch (e) { status('ytStatusMsg', 'Error: ' + e.message, '#ff7675'); }
    });
}

// ── SOCIAL LINKS ──────────────────────────────────────────────────────────
function initSocial() {
    const btn = $('saveSocialBtn'); if (!btn) return;
    btn.addEventListener('click', async () => {
        CFG.fbUrl = val('fbUrlInput'); CFG.twitchUrl = val('twitchUrlInput');
        CFG.igUrl = val('igUrlInput'); CFG.tikTokUrl = val('tikTokUrlInput');
        await saveConfig();
        status('socialStatusMsg', 'Social links saved!');
    });
}

// ── VIDEO MANAGEMENT ─────────────────────────────────────────────────────
function initVideos() {
    // Latest
    $('saveLatestVideoBtn') && $('saveLatestVideoBtn').addEventListener('click', async () => {
        const u = val('latestUrlInput'); if (!u) { status('latestVideoStatusMsg', 'URL required.', '#ff7675'); return; }
        CFG.latestVideoUrl = u; CFG.latestVideoTitle = val('latestTitleInput');
        CFG.latestVideoThumb = val('latestThumbInput'); CFG.latestVideoDesc = val('latestDescInput');
        await saveConfig(); status('latestVideoStatusMsg', 'Latest video saved!');
    });
    $('clearLatestVideoBtn') && $('clearLatestVideoBtn').addEventListener('click', async () => {
        CFG.latestVideoUrl = CFG.latestVideoTitle = CFG.latestVideoThumb = CFG.latestVideoDesc = '';
        setVal('latestUrlInput', ''); setVal('latestTitleInput', ''); setVal('latestThumbInput', ''); setVal('latestDescInput', '');
        await saveConfig(); status('latestVideoStatusMsg', 'Cleared.', '#fbc531');
    });
    // Popular
    $('savePopularVideoBtn') && $('savePopularVideoBtn').addEventListener('click', async () => {
        const u = val('popularUrlInput'); if (!u) { status('popularVideoStatusMsg', 'URL required.', '#ff7675'); return; }
        CFG.popularVideoUrl = u; CFG.popularVideoTitle = val('popularTitleInput');
        CFG.popularVideoThumb = val('popularThumbInput'); CFG.popularVideoDesc = val('popularDescInput');
        await saveConfig(); status('popularVideoStatusMsg', 'Popular video saved!');
    });
    $('clearPopularVideoBtn') && $('clearPopularVideoBtn').addEventListener('click', async () => {
        CFG.popularVideoUrl = CFG.popularVideoTitle = CFG.popularVideoThumb = CFG.popularVideoDesc = '';
        setVal('popularUrlInput', ''); setVal('popularTitleInput', ''); setVal('popularThumbInput', ''); setVal('popularDescInput', '');
        await saveConfig(); status('popularVideoStatusMsg', 'Cleared.', '#fbc531');
    });
    // New Upload
    $('saveNewUploadBtn') && $('saveNewUploadBtn').addEventListener('click', async () => {
        const u = val('newUploadUrlInput'); if (!u) { status('newUploadStatusMsg', 'URL required.', '#ff7675'); return; }
        CFG.newUploadUrl = u; CFG.newUploadLabel = val('newUploadLabelInput') || 'New Upload!';
        await saveConfig(); status('newUploadStatusMsg', 'Nav button is LIVE!');
    });
    $('clearNewUploadBtn') && $('clearNewUploadBtn').addEventListener('click', async () => {
        CFG.newUploadUrl = CFG.newUploadLabel = '';
        setVal('newUploadUrlInput', ''); setVal('newUploadLabelInput', '');
        await saveConfig(); status('newUploadStatusMsg', 'Button hidden.', '#fbc531');
    });
}

// ── BLOOD STRIKE UPDATES (Gemini AI) ─────────────────────────────────────
function renderAdminUpdates() {
    const list = $('adminUpdatesList'); if (!list) return;
    const updates = Array.isArray(CFG.bloodStrikeUpdates) ? CFG.bloodStrikeUpdates : [];
    if (updates.length === 0) { list.innerHTML = '<p style="color:var(--dim);text-align:center;padding:1rem;">No updates yet.</p>'; return; }
    list.innerHTML = updates.map((u, i) => `
        <div style="display:flex;gap:10px;align-items:center;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--gborder2);margin-bottom:8px;">
            ${u.poster ? `<img src="${safeUrl(u.poster)}" style="width:70px;height:45px;object-fit:cover;border-radius:4px;" alt="">` :
            '<div style="width:70px;height:45px;border-radius:4px;background:rgba(232,65,24,0.1);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-gamepad" style="color:var(--primary);"></i></div>'}
            <div style="flex:1;overflow:hidden;">
                <div style="font-size:0.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sanitize(u.title)}</div>
                <div style="font-size:0.72rem;color:var(--dim);">${sanitize(u.tag || '')} • ${sanitize(u.date || '')}</div>
            </div>
            <button class="btn small-btn danger-btn" onclick="window.deleteUpdate(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');
}

window.deleteUpdate = async (i) => {
    CFG.bloodStrikeUpdates.splice(i, 1);
    await saveConfig();
    renderAdminUpdates();
};

function initUpdates() {
    // Add manual update
    const addBtn = $('addUpdateBtn'); if (!addBtn) return;
    addBtn.addEventListener('click', async () => {
        const title = val('updateTitle'), desc = val('updateDesc'), poster = val('updatePoster'), tag = val('updateTag') || 'Update';
        if (!title) { status('updateStatusMsg', 'Title is required.', '#ff7675'); return; }
        if (!Array.isArray(CFG.bloodStrikeUpdates)) CFG.bloodStrikeUpdates = [];
        CFG.bloodStrikeUpdates.unshift({ title, desc, poster, tag, date: new Date().toLocaleDateString(), aiGenerated: false });
        await saveConfig(); renderAdminUpdates();
        setVal('updateTitle', ''); setVal('updateDesc', ''); setVal('updatePoster', ''); setVal('updateTag', '');
        status('updateStatusMsg', 'Update added!');
    });

    // Gemini AI generate
    const aiBtn = $('aiGenerateBtn'); if (!aiBtn) return;
    aiBtn.addEventListener('click', async () => {
        const key = CFG.geminiApiKey || DEFAULT_GEMINI_KEY;
        const prompt = val('aiPromptInput') || 'Generate a Blood Strike mobile game update post. Return ONLY a JSON object with these keys: title (catchy exciting headline max 10 words), desc (2 engaging sentences about the update for fans), tag (one of: PATCH NOTES, NEW WEAPON, EVENT, SEASON UPDATE, GAMEPLAY). Make it feel exciting and urgent for Blood Strike fans.';
        status('updateStatusMsg', '✨ Asking Gemini AI...', '#fbc531');
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 400 } })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let parsed = { title: 'Blood Strike Update', desc: raw, tag: 'UPDATE' };
            try { const m = raw.match(/\{[\s\S]*?\}/); if (m) parsed = JSON.parse(m[0]); } catch (pe) { }
            if (!Array.isArray(CFG.bloodStrikeUpdates)) CFG.bloodStrikeUpdates = [];
            CFG.bloodStrikeUpdates.unshift({
                title: parsed.title || 'Blood Strike Update',
                desc:  parsed.desc  || raw,
                tag:   parsed.tag   || 'UPDATE',
                poster: val('updatePoster') || '',
                date:  new Date().toLocaleDateString(),
                aiGenerated: true
            });
            await saveConfig(); renderAdminUpdates();
            status('updateStatusMsg', '✅ AI update generated and published!');
        } catch (e) { status('updateStatusMsg', 'Gemini error: ' + e.message, '#ff7675'); }
    });
}

// ── TOURNAMENTS ───────────────────────────────────────────────────────────
function renderAdminTournaments() {
    const list = $('adminEventsList'); if (!list) return;
    const ts = Array.isArray(CFG.tournaments) ? CFG.tournaments : [];
    if (ts.length === 0) { list.innerHTML = '<li><div><strong>No active events</strong></div></li>'; return; }
    list.innerHTML = '';
    ts.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<div><strong>${sanitize(t.name)}</strong> <span style="color:var(--primary)">[${sanitize(t.game)}]</span><span>${sanitize(new Date(t.date).toLocaleString())} | ${sanitize(t.prize)}</span></div>
            <button class="btn small-btn danger-btn" onclick="window.deleteTournament(${i})"><i class="fa-solid fa-trash"></i></button>`;
        list.appendChild(li);
    });
}
window.deleteTournament = async (i) => {
    CFG.tournaments.splice(i, 1); await saveConfig(); renderAdminTournaments();
};
function initTournaments() {
    const form = $('adminTournamentForm'); if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name = val('eventName'), game = val('eventGame'), date = val('eventDate');
        if (!name || !game || !date) return;
        if (!Array.isArray(CFG.tournaments)) CFG.tournaments = [];
        CFG.tournaments.push({ name, game, prize: val('eventPrize'), thumbnail: val('eventThumbnail'), date, slots: val('eventSlots'), link: val('eventLink') });
        await saveConfig(); renderAdminTournaments(); form.reset();
    });
}

// ── SPIN WHEEL ────────────────────────────────────────────────────────────
function initSpin() {
    const fetchBtn = $('fetchRecentVideosBtn'), spinBtn = $('adminSpinBtn'), statusEl = $('spinStatusMsg');
    const manualBtn = $('loadManualVideoBtn'), manualInput = $('manualVideoUrlInput');
    const countEl = $('loadedUsersCount'), listEl = $('recentVideosList');

    window.loadCommentsForVideo = async (videoId) => {
        if (!CFG.ytApiKey) { if (statusEl) { statusEl.textContent = 'No API key.'; statusEl.style.color = '#e84118'; } return; }
        if (statusEl) { statusEl.textContent = 'Fetching comments...'; statusEl.style.color = '#fbc531'; }
        try {
            const r = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(videoId)}&maxResults=50&key=${encodeURIComponent(CFG.ytApiKey)}`);
            const d = await r.json(); if (d.error) throw new Error(d.error.message);
            if (d.items && d.items.length) {
                const seen = new Set(), unique = [];
                d.items.forEach(item => { const n = item.snippet.topLevelComment.snippet.authorDisplayName, u = item.snippet.topLevelComment.snippet.authorChannelUrl; if (!seen.has(n)) { seen.add(n); unique.push({ name: n, url: u }); } });
                CFG.spinParticipants = unique; await saveConfig();
                localStorage.setItem('creatorHub_wheelParticipants', JSON.stringify(unique));
                if (countEl) countEl.textContent = unique.length;
                if (statusEl) { statusEl.textContent = `Loaded ${unique.length} participants!`; statusEl.style.color = '#55efc4'; }
                if (window.updateWheelParticipants) window.updateWheelParticipants();
            } else { if (statusEl) { statusEl.textContent = 'No comments found.'; statusEl.style.color = '#e84118'; } }
        } catch (e) { if (statusEl) { statusEl.textContent = 'Error: ' + e.message; statusEl.style.color = '#e84118'; } }
    };

    fetchBtn && fetchBtn.addEventListener('click', async () => {
        if (!CFG.ytApiKey || !CFG.ytChannelId) { if (statusEl) { statusEl.textContent = 'Connect YouTube API first.'; statusEl.style.color = '#e84118'; } return; }
        if (statusEl) { statusEl.textContent = 'Fetching videos...'; statusEl.style.color = '#fbc531'; }
        try {
            const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(CFG.ytChannelId)}&maxResults=15&order=date&type=video&key=${encodeURIComponent(CFG.ytApiKey)}`);
            const d = await r.json(); if (d.error) throw new Error(d.error.message);
            if (listEl) listEl.innerHTML = '';
            const vids = (d.items || []).filter(it => !it.snippet.title.toLowerCase().includes('#shorts')).slice(0, 5);
            for (const it of vids) {
                const vid = it.id.videoId;
                const div = document.createElement('div'); div.style.cssText = 'display:flex;gap:8px;align-items:center;background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;border:1px solid var(--gborder2);';
                div.innerHTML = `<img src="${safeUrl(it.snippet.thumbnails.default.url)}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;" alt=""><div style="flex:1;overflow:hidden;"><h4 style="margin:0;font-size:0.78rem;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${sanitize(it.snippet.title)}</h4></div>
                    <button class="btn small-btn primary-btn" onclick="window.loadCommentsForVideo('${sanitize(vid)}')" style="padding:4px 8px;font-size:0.72rem;">Select</button>`;
                if (listEl) listEl.appendChild(div);
            }
            if (statusEl) { statusEl.textContent = 'Videos loaded.'; statusEl.style.color = '#55efc4'; }
        } catch (e) { if (statusEl) { statusEl.textContent = 'Error: ' + e.message; statusEl.style.color = '#e84118'; } }
    });

    manualBtn && manualBtn.addEventListener('click', () => {
        const raw = manualInput ? manualInput.value.trim() : ''; if (!raw) return;
        let vid = raw; const m = raw.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        if (m && m[2].length === 11) { vid = m[2]; } else if (raw.length !== 11) { if (statusEl) { statusEl.textContent = 'Invalid URL/ID.'; statusEl.style.color = '#e84118'; } return; }
        window.loadCommentsForVideo(vid); if (manualInput) manualInput.value = '';
    });

    spinBtn && spinBtn.addEventListener('click', () => {
        CFG._triggerSpin = Date.now().toString();
        localStorage.setItem('creatorHub_triggerSpin', CFG._triggerSpin);
        window.dispatchEvent(new StorageEvent('storage', { key: 'creatorHub_triggerSpin', newValue: CFG._triggerSpin }));
        spinBtn.textContent = 'SPIN SIGNAL SENT!';
        setTimeout(() => { spinBtn.textContent = 'TRIGGER PUBLIC SPIN!'; }, 2000);
    });
}

// ── BOOT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initPin();
    initNav();
    await loadConfig();
    prefillAll();
    initYT();
    initSocial();
    initVideos();
    initUpdates();
    initTournaments();
    initSpin();
});
