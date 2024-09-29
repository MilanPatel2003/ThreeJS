let scene, camera, renderer, controls, model;
let gui; // New variable for lil-gui
let rotationSpeed = 0.005; // Speed of rotation
let isRotating = false; // Flag to control rotation

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
        'model.glb', // Make sure this file is in the same directory as your HTML file
        function (gltf) {
            model = gltf.scene;
            scene.add(model);
            
            applyTextures();
            addGUIControls();
            centerModel();
            
            // Center the model
            centerModel();
            
            // Log all mesh names
            console.log("Model parts:");
            model.traverse((child) => {
                if (child.isMesh) {
                    console.log(child.name);
                }
            });
            
            // Log animations
            console.log("Animations:");
            gltf.animations.forEach((clip, index) => {
                console.log(`${index}: ${clip.name} (Duration: ${clip.duration}s)`);
            });
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    addRotationControls();

    animate();
}

function addRotationControls() {
    const rotationFolder = gui.addFolder('Model Rotation');
    
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
}

function animate() {
    requestAnimationFrame(animate);

    if (isRotating && model) {
        model.rotation.y += rotationSpeed;
    }

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