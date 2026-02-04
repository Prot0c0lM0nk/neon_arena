/**
 * Window resize handler
 * Maintains proper aspect ratio and canvas size when window is resized
 * 
 * INTENT: Responsive design for different screen sizes
 * INTENT: Separate resize logic from game initialization
 * 
 * INVARIANT: Camera aspect ratio must match window aspect ratio
 * INVARIANT: Renderer size must match window size
 * 
 * DEPENDENCIES: Uses global objects: camera, renderer
 * DEPENDENCIES: Attached as event listener in setupScene()
 * 
 * NOTE: This function is called automatically by browser on resize events
 * NOTE: updateProjectionMatrix() must be called after changing camera aspect
 */

/**
 * Handles window resize events
 * Updates camera aspect ratio and renderer size
 * @param {THREE.PerspectiveCamera} camera - The game camera
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
 */
export function onWindowResize(camera, renderer) {
    // Update camera aspect ratio to match new window dimensions
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size to fill window
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Creates a resize handler function bound to specific camera and renderer
 * Useful for attaching as event listener
 * @param {THREE.PerspectiveCamera} camera - The game camera
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
 * @returns {Function} Resize handler function
 */
export function createResizeHandler(camera, renderer) {
    return function() {
        onWindowResize(camera, renderer);
    };
}