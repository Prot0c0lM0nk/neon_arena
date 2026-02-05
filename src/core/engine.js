/**
 * Core game engine
 * Manages the Three.js scene, rendering loop, and initialization
 * 
 * INTENT: Centralize all Three.js setup and rendering logic
 * INTENT: Provide a clean initialization API for the game
 * 
 * INVARIANT: Scene must be created before any objects are added
 * INVARIANT: Camera FOV is 75 (standard for FPS games)
 * INVARIANT: Renderer is attached to #gameContainer DOM element
 * INVARIANT: PointerLockControls requires camera and document.body
 */

/**
 * Creates and configures the Three.js scene
 * @param {HTMLElement} container - DOM element to attach renderer to
 * @param {number} playerHeight - Player camera height
 * @returns {Object} Object containing scene, camera, renderer, controls, clock, raycaster, mouse
 */
export function setupScene(container, playerHeight) {
    // Create scene with dark blue background and atmospheric fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.Fog(0x111122, 1, 100);
    
    // Create camera at player height
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = playerHeight;
    
    // Create renderer with antialiasing and shadow support
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Initialize PointerLockControls for FPS-style mouse look
    const controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Create clock for delta time calculation
    const clock = new THREE.Clock();
    
    // Create raycaster for collision detection and shooting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    return {
        scene,
        camera,
        renderer,
        controls,
        clock,
        raycaster,
        mouse
    };
}

/**
 * Creates the animation loop
 * @param {Object} params - Animation parameters
 * @param {THREE.Clock} params.clock - Three.js clock for delta time
 * @param {THREE.WebGLRenderer} params.renderer - Three.js renderer
 * @param {THREE.Scene} params.scene - Three.js scene
 * @param {THREE.Camera} params.camera - Three.js camera
 * @param {Function} params.updateCallback - Function to call each frame for game updates
 * @param {Function} params.gameStartedCheck - Function that returns boolean for game state
 */
export function createAnimationLoop({ clock, renderer, scene, camera, updateCallback, gameStartedCheck }) {
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        if (gameStartedCheck()) {
            updateCallback(delta);
        }
        
        renderer.render(scene, camera);
    }
    
    return animate;
}

/**
 * Handles window resize events
 * @param {THREE.PerspectiveCamera} camera - Three.js camera
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 */
export function handleResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
