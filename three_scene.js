// Setup global 3D background scene
const initBgScene = () => {
    const canvas = document.getElementById('bgCanvas');
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Custom material for particles
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x6c5ce7,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Floating Abstract Shapes
    const shapes = [];
    const geometry1 = new THREE.TorusGeometry(3, 0.5, 16, 100);
    const geometry2 = new THREE.OctahedronGeometry(2);
    const geometry3 = new THREE.IcosahedronGeometry(2.5);

    const material1 = new THREE.MeshStandardMaterial({ 
        color: 0x00cec9, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    const material2 = new THREE.MeshStandardMaterial({ 
        color: 0x6c5ce7, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    const mesh1 = new THREE.Mesh(geometry1, material1);
    mesh1.position.set(-15, 10, -10);
    scene.add(mesh1);
    shapes.push(mesh1);

    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.position.set(15, -5, -15);
    scene.add(mesh2);
    shapes.push(mesh2);

    const mesh3 = new THREE.Mesh(geometry3, material1);
    mesh3.position.set(0, -15, -20);
    scene.add(mesh3);
    shapes.push(mesh3);


    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Update particles
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Update shapes
        shapes.forEach((shape, index) => {
            shape.rotation.x = elapsedTime * (0.2 + index * 0.1);
            shape.rotation.y = elapsedTime * (0.3 + index * 0.1);
        });

        // Easing for mouse movement
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    };

    tick();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

document.addEventListener('DOMContentLoaded', initBgScene);
