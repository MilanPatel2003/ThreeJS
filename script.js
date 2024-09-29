let scene, camera, renderer, controls, model;
let gui;
let mixer, clock;
let currentAction, actions = {};
let rotationSpeed = 0.005; // Speed of rotation
let isRotating = false; // Flag to control rotation
let isColorPulsing = false;

const textures = {
    body: {
        map: new THREE.TextureLoader().load('body_texture.jpeg')
    },
    eyes: {
        map: new THREE.TextureLoader().load('eyes.jpeg')
    },
    beard: {
        map: new THREE.TextureLoader().load('beard_color.jpeg'),
        normalMap: new THREE.TextureLoader().load('beard_normal.jpeg')
    },
    teeth: {
        map: new THREE.TextureLoader().load('teeth.jpeg')
    },
    face: {
        map: new THREE.TextureLoader().load('face_texture.jpeg')
    },
    hair: {
        map: new THREE.TextureLoader().load('hair_color.jpeg'),
        normalMap: new THREE.TextureLoader().load('hair_normal.jpeg')
    },
    pants: {
        map: new THREE.TextureLoader().load('pants_base_color.jpeg'),
        normalMap: new THREE.TextureLoader().load('pants_normal.jpeg'),
        glossMap: new THREE.TextureLoader().load('pants_gloss_color.png')
    },
    shirt: {
        map: new THREE.TextureLoader().load('shirt_base_color.jpeg'),
        normalMap: new THREE.TextureLoader().load('shirt_normal.jpeg'),
        glossMap: new THREE.TextureLoader().load('shrit_gloss_color.png') // Note: 'shrit' is likely a typo, but I'm using it as provided
    },
    shoes: {
        map: new THREE.TextureLoader().load('shoes_base_color.jpeg'),
        normalMap: new THREE.TextureLoader().load('shoes_normal.jpeg'),
        glossMap: new THREE.TextureLoader().load('shoes_gloss_color.png')
    }
};

function init() {
    clock = new THREE.Clock();
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 5); // Adjusted y position slightly

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // OrbitControls (ensure it's properly initialized)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Optional, but makes controls feel smoother
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Initialize lil-gui
    gui = new lil.GUI();

    // Load GLB model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'male_full-body_sci-fi_character_walk.glb',
        function (gltf) {
            model = gltf.scene;
            scene.add(model);
            
            applyTextures();
            setupAnimations(gltf.animations); // Pass the loaded animations to setupAnimations
            addGUIControls();
            
            centerModel();
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    animate();
}

function setupAnimations(loadedAnimations) {
    mixer = new THREE.AnimationMixer(model);

    // Idle animation (subtle breathing effect)
    const idleKeyframes = new THREE.VectorKeyframeTrack(
        '.scale',
        [0, 1, 2],
        [1, 1, 1, 1.02, 1.02, 1.02, 1, 1, 1]
    );
    const idleClip = new THREE.AnimationClip('idle', 2, [idleKeyframes]);
    actions.idle = mixer.clipAction(idleClip);

    // Hover animation
    const hoverKeyframes = new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1, 2],
        [0, 0.1, 0]
    );
    const hoverClip = new THREE.AnimationClip('hover', 2, [hoverKeyframes]);
    actions.hover = mixer.clipAction(hoverClip);

    // Wobble animation
    const wobbleKeyframes = new THREE.QuaternionKeyframeTrack(
        '.quaternion',
        [0, 0.5, 1, 1.5, 2],
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.05)).toArray().concat(
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.05)).toArray(),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.05)).toArray(),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.05)).toArray(),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray()
        )
    );
    const wobbleClip = new THREE.AnimationClip('wobble', 2, [wobbleKeyframes]);
    actions.wobble = mixer.clipAction(wobbleClip);

    // Set up loaded animations
    loadedAnimations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
        console.log(`Loaded animation: ${clip.name}`);
    });

    // Set all animations to loop
    Object.values(actions).forEach(action => {
        if (action && action.setLoop) {
            action.setLoop(THREE.LoopRepeat);
        }
    });

    console.log('Animations set up:', actions);
}

function setupWaveAnimation() {
    // Find the right arm or hand in the model
    let rightArm;
    model.traverse((object) => {
        if (object.name.toLowerCase().includes('arm') || object.name.toLowerCase().includes('hand')) {
            if (object.name.toLowerCase().includes('right')) {
                rightArm = object;
            }
        }
    });

    if (rightArm) {
        const waveKeyframes = new THREE.QuaternionKeyframeTrack(
            `${rightArm.name}.quaternion`,
            [0, 0.5, 1, 1.5, 2],
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray().concat(
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4)).toArray(),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray(),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)).toArray(),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray()
            )
        );
        const waveClip = new THREE.AnimationClip('wave', 2, [waveKeyframes]);
        actions.wave = mixer.clipAction(waveClip);
    } else {
        console.warn("Couldn't find right arm or hand for wave animation");
    }
}

function setupColorPulse() {
    // No need to create an action for color pulse
}

function playAnimation(name) {
    if (currentAction && currentAction.stop) {
        currentAction.stop();
    }
    if (actions[name] && actions[name].play) {
        currentAction = actions[name];
        currentAction.play();
    } else {
        console.warn(`Animation ${name} not found or not playable`);
    }
}

function stopAnimation() {
    if (currentAction && currentAction.stop) {
        currentAction.stop();
        currentAction = null;
    }
}

function playColorPulse() {
    isColorPulsing = true;
}

function stopColorPulse() {
    isColorPulsing = false;
    // Reset model color
    model.traverse((child) => {
        if (child.isMesh) {
            child.material.color.setHex(0xffffff);
        }
    });
}

function updateColorPulse(delta) {
    if (isColorPulsing) {
        const hue = (Date.now() % 6000) / 6000;
        const color = new THREE.Color().setHSL(hue, 0.5, 0.5);
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.color = color;
            }
        });
    }
}

function addGUIControls() {
    // Lighting controls
    const lightFolder = gui.addFolder('Lighting');
    lightFolder.add(scene.children[0], 'intensity', 0, 2).name('Ambient Light');
    lightFolder.add(scene.children[1], 'intensity', 0, 2).name('Directional Light');

    // Camera controls
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'x', -20, 20);
    cameraFolder.add(camera.position, 'y', -20, 20);
    cameraFolder.add(camera.position, 'z', -20, 20);

    // Model rotation controls
    const modelFolder = gui.addFolder('Model Rotation');
    modelFolder.add(model.rotation, 'x', 0, Math.PI * 2);
    modelFolder.add(model.rotation, 'y', 0, Math.PI * 2);
    modelFolder.add(model.rotation, 'z', 0, Math.PI * 2);

    // Material controls
    const materialFolder = gui.addFolder('Materials');
    model.traverse((child) => {
        if (child.isMesh) {
            const folder = materialFolder.addFolder(child.name);
            folder.add(child.material, 'wireframe');
            folder.add(child.material, 'visible');
            if (child.material.roughness !== undefined) {
                folder.add(child.material, 'roughness', 0, 1);
            }
            if (child.material.metalness !== undefined) {
                folder.add(child.material, 'metalness', 0, 1);
            }
        }
    });

    const animationFolder = gui.addFolder('Animations');
    animationFolder.add({ play: () => playAnimation('idle') }, 'play').name('Idle (Breathe)');
    animationFolder.add({ play: () => playAnimation('hover') }, 'play').name('Hover');
    animationFolder.add({ play: () => playAnimation('wobble') }, 'play').name('Wobble');
    
    // Add option for walk animation with the correct name
    animationFolder.add({ play: () => playAnimation('rig|rig|walk|rig|walk') }, 'play').name('Walk');
    
    animationFolder.add({ play: playColorPulse }, 'play').name('Color Pulse');
    animationFolder.add({ stop: () => {
        stopAnimation();
        stopColorPulse();
    }}, 'stop').name('Stop All Animations');

    const rotationFolder = gui.addFolder('Auto Rotation');
    rotationFolder.add({ isRotating: isRotating }, 'isRotating')
        .name('Auto Rotate')
        .onChange((value) => {
            isRotating = value;
        });
    rotationFolder.add({ speed: rotationSpeed }, 'speed', 0, 0.05)
        .name('Rotation Speed')
        .onChange((value) => {
            rotationSpeed = value;
        });
}

function centerModel() {
    if (model) {
        // Compute the bounding box of the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Move the model so its center is at (0, 0, 0)
        model.position.sub(center);

        // Adjust the camera to fit the model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        // Set camera position
        camera.position.z = cameraZ * 1.5; // Multiply by 1.5 to give some space around the model
        camera.updateProjectionMatrix();

        // Update controls target to look at the center of the model
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

function applyTextures() {
    model.traverse((child) => {
        if (child.isMesh) {
            let textureSet;
            switch (child.name) {
                case 'Wolf3D_Body':
                    textureSet = textures.body;
                    break;
                case 'EyeLeft':
                case 'EyeRight':
                    textureSet = textures.eyes;
                    break;
                case 'Wolf3D_Beard':
                    textureSet = textures.beard;
                    break;
                case 'Wolf3D_Teeth':
                    textureSet = textures.teeth;
                    break;
                case 'Wolf3D_Head':
                    textureSet = textures.face;
                    break;
                case 'Wolf3D_Hair':
                    textureSet = textures.hair;
                    break;
                case 'Wolf3D_Outfit_Top':
                    textureSet = textures.shirt;
                    break;
                case 'Wolf3D_Outfit_Bottom':
                    textureSet = textures.pants;
                    break;
                case 'Wolf3D_Outfit_Footwear':
                    textureSet = textures.shoes;
                    break;
            }
            if (textureSet) {
                if (textureSet.map) {
                    child.material.map = textureSet.map;
                }
                if (textureSet.normalMap) {
                    child.material.normalMap = textureSet.normalMap;
                }
                if (textureSet.glossMap) {
                    // You might want to use this as a specular map or roughness map
                    // depending on your material setup
                    child.material.roughnessMap = textureSet.glossMap;
                    child.material.roughness = 0.5; // Adjust as needed
                }
                child.material.needsUpdate = true;
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }
    
    if (isRotating && model) {
        model.rotation.y += rotationSpeed;
    }
    
    updateColorPulse(delta);
    
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

init();