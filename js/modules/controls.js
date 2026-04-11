import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export function setupControls(camera, renderer, scene, onObjectSelected) {
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.screenSpacePanning = true;
    orbitControls.maxPolarAngle = Math.PI / 2;
    
    const transformControls = new TransformControls(camera, renderer.domElement);
    let isDragging = false;
    
    transformControls.addEventListener('dragging-changed', (event) => {
        isDragging = event.value;
        orbitControls.enabled = !event.value;
        document.body.style.cursor = event.value ? 'grabbing' : 'default';
    });
    
    transformControls.addEventListener('objectChange', () => {
        if (transformControls.object && !isDragging && onObjectSelected) {
            onObjectSelected(transformControls.object);
        }
    });
    
    scene.add(transformControls);
    return { orbitControls, transformControls };
}

export function setTransformMode(transformControls, mode) {
    if (!transformControls) return;
    transformControls.setMode(mode);
    transformControls.showX = transformControls.showY = transformControls.showZ = true;
    transformControls.size = 0.8;
    transformControls.space = 'world';
}

export function attachToObject(transformControls, object, orbitControls) {
    if (!transformControls || !object) return;
    if (orbitControls) orbitControls.enabled = false;
    if (transformControls.object) transformControls.detach();
    transformControls.attach(object);
}

export function detachFromObject(transformControls, orbitControls) {
    if (!transformControls) return;
    if (transformControls.object) transformControls.detach();
    if (orbitControls) orbitControls.enabled = true;
}