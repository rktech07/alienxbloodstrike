const initSpinWheel = () => {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;

    const scene     = new THREE.Scene();
    const container = canvas.parentElement;
    let width  = container.clientWidth  || 400;
    let height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 12;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom    = false;
    controls.enablePan     = false;

    const wheelGroup = new THREE.Group();
    scene.add(wheelGroup);

    const DEFAULT_NAMES = ['Player 1','Player 2','Player 3','Player 4','Player 5','Player 6','Player 7','Player 8'];
    const COLORS  = [0xe84118,0xfbc531,0x2f3640,0x718093,0xc23616,0xe1b12c,0x353b48,0xdcdde1];
    const RADIUS  = 4;

    let names = [...DEFAULT_NAMES];
    let originalParticipantsData = [];
    let usingPlaceholders = true;

    const drawWheel = () => {
        while (wheelGroup.children.length > 0) wheelGroup.remove(wheelGroup.children[0]);
        const segs = names.length;
        for (let i = 0; i < segs; i++) {
            const thetaStart  = (i * Math.PI * 2) / segs;
            const thetaLength = (Math.PI * 2) / segs;
            const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, 0.5, 32, 1, false, thetaStart, thetaLength);
            const mat = new THREE.MeshStandardMaterial({ color: COLORS[i % COLORS.length], roughness: 0.4, metalness: 0.1 });
            const slice = new THREE.Mesh(geo, mat);
            slice.rotation.x = Math.PI / 2;
            wheelGroup.add(slice);
        }
        const hubGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 32);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.8, roughness: 0.2 });
        const hub    = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.x = Math.PI / 2;
        wheelGroup.add(hub);
    };

    const loadParticipants = () => {
        try {
            const raw = localStorage.getItem('creatorHub_wheelParticipants');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.length > 0) {
                    originalParticipantsData = parsed;
                    names = parsed.map(p => typeof p === 'string' ? p : (p.name || 'Unknown'));
                    usingPlaceholders = false;
                    return;
                }
            }
        } catch (e) { console.error(e); }
        names = [...DEFAULT_NAMES];
        usingPlaceholders = true;
    };

    loadParticipants();
    drawWheel();

    // Pointer
    const ptrGeo = new THREE.ConeGeometry(0.5, 1.5, 32);
    const ptrMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const pointer = new THREE.Mesh(ptrGeo, ptrMat);
    pointer.position.set(0, RADIUS + 0.5, 0);
    pointer.rotation.z = Math.PI;
    scene.add(pointer);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(5, 5, 5);
    scene.add(dLight);

    let isSpinning = false;
    let currentRotation = 0;
    const winnerDisplay = document.getElementById('winnerDisplay');
    const winnerText    = document.getElementById('winnerText');
    const spinStatusMsg = document.getElementById('spin-status-msg');

    const executeSpin = () => {
        if (isSpinning) return;
        isSpinning = true;
        if (winnerDisplay) winnerDisplay.classList.add('hidden');

        if (usingPlaceholders && spinStatusMsg) {
            spinStatusMsg.textContent = 'Warning: Using placeholder names! Load real participants from admin first.';
        } else if (spinStatusMsg) {
            spinStatusMsg.textContent = 'Spinning...';
        }

        const spins = 5 + Math.random() * 5;
        const targetRotation = currentRotation + spins * Math.PI * 2;

        gsap.to(wheelGroup.rotation, {
            z: targetRotation,
            duration: 5,
            ease: 'power4.out',
            onComplete: () => {
                isSpinning = false;
                currentRotation = targetRotation % (Math.PI * 2);

                // FIX: derive segment count from live names array (was previously a scoping bug)
                const segs = names.length;
                const norm = ((Math.PI * 2) - (wheelGroup.rotation.z % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
                const segAngle = (Math.PI * 2) / segs;
                const winIdx = Math.floor(norm / segAngle) % segs;

                const winName = names[winIdx];
                const winData = originalParticipantsData.find(p => p.name === winName) || { name: winName, url: '#' };

                if (winnerText)    winnerText.textContent = winName;
                if (winnerDisplay) winnerDisplay.classList.remove('hidden');
                if (spinStatusMsg) spinStatusMsg.textContent = usingPlaceholders ? 'Demo spin complete (placeholder data)' : 'We have a winner!';

                // Persist winner
                let winners = [];
                try { winners = JSON.parse(localStorage.getItem('creatorHub_spinWinners') || '[]'); } catch (e) {}
                winners.unshift({ name: winData.name, url: winData.url || '#', date: new Date().toISOString() });
                if (winners.length > 5) winners.pop();
                localStorage.setItem('creatorHub_spinWinners', JSON.stringify(winners));
                window.dispatchEvent(new StorageEvent('storage', { key: 'creatorHub_spinWinners' }));

                gsap.to(pointer.position, { y: RADIUS + 1, duration: 0.2, yoyo: true, repeat: 3 });
            }
        });
    };

    // Expose to external callers
    window.triggerExternalSpin = executeSpin;
    window.updateWheelParticipants = () => {
        loadParticipants();
        drawWheel();
        if (spinStatusMsg) {
            spinStatusMsg.textContent = usingPlaceholders
                ? 'No participants loaded. Using placeholder names.'
                : `${names.length} participants loaded. Ready to spin!`;
        }
    };

    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) spinBtn.addEventListener('click', executeSpin);

    // Show initial participant status
    if (spinStatusMsg) {
        spinStatusMsg.textContent = usingPlaceholders
            ? 'Waiting for the admin to load participants...'
            : `${names.length} participants ready!`;
    }

    // Render loop
    const tick = () => { controls.update(); renderer.render(scene, camera); requestAnimationFrame(tick); };
    tick();

    // Responsive
    new ResizeObserver(entries => {
        for (const entry of entries) {
            const w = entry.contentRect.width, h = entry.contentRect.height;
            if (w > 0 && h > 0) { camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
        }
    }).observe(container);
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(initSpinWheel, 500); });
