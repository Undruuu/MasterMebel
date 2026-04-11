import * as THREE from 'three';

export function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 20);
    camera.position.set(3, 2.5, 4);
    camera.lookAt(0, 1, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    return { scene, camera, renderer };
}