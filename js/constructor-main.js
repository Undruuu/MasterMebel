import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { 
    createWallPart, createShelfPart, createDividerPart,
    createCountertopPart, createCountertopSinkPart, createCountertopCornerPart,
    createDoorPart, createDrawerPart, updatePartSize, updatePartColor
} from './modules/parts.js';
import { createGroup, ungroup, isGroup } from './modules/grouping.js';
import { setupUI } from './modules/ui.js';

let scene, camera, renderer, orbitControls, transformControls;
let currentMode = 'translate';
let currentSelectedObject = null;
let selectedObjects = new Set();
let uiController;

let cabinetWidth = 1.0;
let cabinetHeight = 2.0;
let cabinetDepth = 0.6;

// Оптимизация
let renderRequested = false;
let isDragging = false;

function init() {
    let container = document.getElementById('canvas-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'canvas-container';
        container.style.width = '100%';
        container.style.height = '100vh';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '0';
        document.body.appendChild(container);
    }
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 15);
    camera.position.set(3, 2.5, 4);
    camera.lookAt(0, 1, 0);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        powerPreference: "high-performance",
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Фиксируем pixel ratio = 1 для максимальной производительности
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    
    // Максимально простое освещение
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.7);
    mainLight.position.set(2, 3, 2);
    scene.add(mainLight);
    scene.add(new THREE.AmbientLight(0x404060));
    
    // Простая сетка
    const gridHelper = new THREE.GridHelper(8, 12, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    
    // OrbitControls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.2;
    orbitControls.screenSpacePanning = true;
    orbitControls.enableZoom = true;
    orbitControls.zoomSpeed = 0.8;
    orbitControls.rotateSpeed = 0.8;
    orbitControls.enablePan = true;
    orbitControls.panSpeed = 0.8;
    
    // TransformControls с минимальными обновлениями
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.6;
    transformControls.space = 'world';
    
    transformControls.addEventListener('dragging-changed', (event) => {
        isDragging = event.value;
        orbitControls.enabled = !event.value;
        
        // Во время перетаскивания используем requestAnimationFrame для плавности
        if (isDragging) {
            function dragRender() {
                if (isDragging) {
                    renderer.render(scene, camera);
                    requestAnimationFrame(dragRender);
                }
            }
            dragRender();
        } else {
            renderRequested = true;
        }
    });
    
    scene.add(transformControls);
    
    // UI
    uiController = setupUI({
        onTranslateMode: () => setMode('translate'),
        onScaleMode: () => setMode('scale'),
        onApplySize: (width, height, depth) => applySizeToSelected(width, height, depth),
        onApplyColor: (color) => applyColorToSelected(color),
        onGroup: () => groupSelectedObjects(),
        onUngroup: () => ungroupSelectedObject(),
        onClearSelection: () => clearSelection(),
        onDelete: () => deleteSelectedObjects()
    });
    
    createDefaultCabinet();
    setupRaycaster();
    setupPartsButtons();
    setupTogglePanel();
    setupWindowResize();
    setupKeyboardShortcuts();
    setupSendToOrderButton();
    
    // Запускаем рендер-цикл с низкой частотой
    startRenderLoop();
    
    console.log('3D Конструктор запущен (супер-оптимизированная версия)');
}

// Рендер-цикл с низкой частотой (15 FPS)
let lastRenderTime = 0;
const RENDER_INTERVAL = 1000 / 20; // 20 FPS максимум

function startRenderLoop() {
    function render() {
        requestAnimationFrame(render);
        
        const now = Date.now();
        if (now - lastRenderTime >= RENDER_INTERVAL || renderRequested) {
            if (!isDragging) {
                orbitControls.update();
                renderer.render(scene, camera);
                lastRenderTime = now;
                renderRequested = false;
            }
        }
    }
    requestAnimationFrame(render);
}

function requestRender() {
    renderRequested = true;
}

function createDefaultCabinet() {
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.7 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
    
    const objects = [
        { type: 'left-wall', x: -cabinetWidth/2 + 0.009, y: cabinetHeight/2, z: 0, w: 0.018, h: cabinetHeight, d: cabinetDepth, mat: woodMaterial },
        { type: 'right-wall', x: cabinetWidth/2 - 0.009, y: cabinetHeight/2, z: 0, w: 0.018, h: cabinetHeight, d: cabinetDepth, mat: woodMaterial },
        { type: 'back-wall', x: 0, y: cabinetHeight/2, z: -cabinetDepth/2 + 0.009, w: cabinetWidth, h: cabinetHeight, d: 0.018, mat: woodMaterial },
        { type: 'top', x: 0, y: cabinetHeight, z: 0, w: cabinetWidth, h: 0.018, d: cabinetDepth, mat: woodMaterial },
        { type: 'bottom', x: 0, y: 0, z: 0, w: cabinetWidth, h: 0.018, d: cabinetDepth, mat: woodMaterial },
        { type: 'base', x: 0, y: -0.015, z: 0, w: cabinetWidth + 0.05, h: 0.03, d: cabinetDepth + 0.05, mat: darkMaterial },
        { type: 'shelf', x: 0, y: cabinetHeight/2, z: 0, w: cabinetWidth - 0.1, h: 0.018, d: cabinetDepth - 0.05, mat: woodMaterial },
        { type: 'door', x: 0, y: cabinetHeight/2, z: cabinetDepth/2 + 0.01, w: cabinetWidth - 0.02, h: cabinetHeight - 0.05, d: 0.02, mat: woodMaterial }
    ];
    
    objects.forEach(obj => {
        const geometry = new THREE.BoxGeometry(obj.w, obj.h, obj.d);
        const mesh = new THREE.Mesh(geometry, obj.mat);
        mesh.position.set(obj.x, obj.y, obj.z);
        mesh.userData = {
            id: obj.type,
            type: obj.type,
            name: getTypeName(obj.type),
            currentSize: { width: obj.w * 100, height: obj.h * 100, depth: obj.d * 100 }
        };
        scene.add(mesh);
    });
    
    requestRender();
}

function getTypeName(type) {
    const names = {
        'left-wall': 'Левая стена', 'right-wall': 'Правая стена', 'back-wall': 'Задняя стена',
        'top': 'Верхняя крышка', 'bottom': 'Нижнее днище', 'base': 'Основание',
        'shelf': 'Полка', 'door': 'Дверь'
    };
    return names[type] || type;
}

let allPartsList = [];

function updatePartsList() {
    allPartsList = [];
    scene.traverse(obj => {
        if (obj.isMesh && obj !== transformControls && !obj.isHelper && obj.userData && obj.userData.type) {
            allPartsList.push({
                id: obj.userData.id,
                type: obj.userData.type,
                name: obj.userData.name,
                size: obj.userData.currentSize
            });
        }
    });
}

function setupSendToOrderButton() {
    const sendBtn = document.getElementById('send-to-order');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            updatePartsList();
            let message = `Здравствуйте! Я создал проект в 3D конструкторе.\n\n`;
            message += `📦 Количество деталей: ${allPartsList.length}\n\n📋 Список деталей:\n`;
            allPartsList.forEach(part => {
                message += `- ${part.name}: ${Math.round(part.size.width)}x${Math.round(part.size.height)}x${Math.round(part.size.depth)} см\n`;
            });
            localStorage.setItem('constructorMessage', message);
            showNotification('Проект сохранен!', 'success');
            setTimeout(() => { window.location.href = 'SiteA_1.html?openForm=true'; }, 800);
        });
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white; padding: 10px 18px; border-radius: 8px;
        z-index: 1000; font-weight: 600; animation: slideIn 0.2s ease;
    `;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

function deleteSelectedObjects() {
    if (selectedObjects.size === 0) return;
    if (!confirm(`Удалить ${selectedObjects.size} объект(ов)?`)) return;
    
    selectedObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.parent && obj.parent !== scene) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    clearSelection();
    updatePartsList();
    requestRender();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Delete') { event.preventDefault(); deleteSelectedObjects(); }
        if (event.key === 'Escape') clearSelection();
        if (event.key === 'v') setMode('translate');
        if (event.key === 's') setMode('scale');
    });
}

function setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (event) => {
        if (transformControls.dragging) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const clickableObjects = [];
        scene.traverse(obj => {
            if (obj.isMesh && obj !== transformControls && !obj.isHelper && obj.userData.type) {
                clickableObjects.push(obj);
            }
        });
        
        const intersects = raycaster.intersectObjects(clickableObjects);
        
        if (intersects.length > 0) {
            handleSelection(intersects[0].object, event.ctrlKey || event.metaKey);
        } else if (!event.ctrlKey && !event.metaKey) {
            clearSelection();
        }
        requestRender();
    });
}

function handleSelection(object, isMultiSelect) {
    if (isMultiSelect) {
        if (selectedObjects.has(object)) {
            selectedObjects.delete(object);
        } else {
            selectedObjects.add(object);
        }
        if (selectedObjects.size === 1) {
            currentSelectedObject = Array.from(selectedObjects)[0];
            transformControls.attach(currentSelectedObject);
        } else {
            currentSelectedObject = null;
            transformControls.detach();
        }
    } else {
        selectedObjects.clear();
        selectedObjects.add(object);
        currentSelectedObject = object;
        transformControls.attach(object);
    }
    if (uiController) uiController.updateUI(currentMode, currentSelectedObject, selectedObjects.size);
    requestRender();
}

function clearSelection() {
    selectedObjects.clear();
    currentSelectedObject = null;
    transformControls.detach();
    if (uiController) uiController.updateUI(currentMode, null, 0);
    requestRender();
}

function setMode(mode) {
    currentMode = mode;
    transformControls.setMode(mode);
}

function applySizeToSelected(width, height, depth) {
    if (currentSelectedObject && currentMode === 'scale' && selectedObjects.size === 1) {
        updatePartSize(currentSelectedObject, width, height, depth);
        if (uiController) uiController.updateObjectInfo(currentSelectedObject, 1);
        updatePartsList();
        requestRender();
    }
}

function applyColorToSelected(color) {
    if (currentSelectedObject && selectedObjects.size === 1) {
        updatePartColor(currentSelectedObject, color);
        if (uiController) uiController.updateObjectInfo(currentSelectedObject, 1);
        updatePartsList();
        requestRender();
    }
}

function groupSelectedObjects() {
    if (selectedObjects.size < 2) {
        showNotification('Выберите 2+ объекта (Ctrl+Клик)', 'error');
        return;
    }
    const objectsToGroup = Array.from(selectedObjects);
    const group = createGroup(objectsToGroup, scene);
    if (group) {
        scene.add(group);
        clearSelection();
        currentSelectedObject = group;
        transformControls.attach(group);
        if (uiController) uiController.updateUI(currentMode, group, 1);
        updatePartsList();
        requestRender();
    }
}

function ungroupSelectedObject() {
    if (!currentSelectedObject || !isGroup(currentSelectedObject)) {
        showNotification('Выделите группу', 'error');
        return;
    }
    const children = ungroup(currentSelectedObject, scene);
    if (children) {
        clearSelection();
        children.forEach(child => selectedObjects.add(child));
        if (uiController) uiController.updateUI(currentMode, null, children.length);
        updatePartsList();
        requestRender();
    }
}

function setupPartsButtons() {
    document.querySelectorAll('.part-btn').forEach(btn => {
        btn.addEventListener('click', () => addPart(btn.dataset.part));
    });
}

function addPart(type) {
    const x = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    let mesh = null;
    
    switch(type) {
        case 'left-wall': mesh = createWallPart('left-wall', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'right-wall': mesh = createWallPart('right-wall', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'back-wall': mesh = createWallPart('back-wall', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'top': mesh = createWallPart('top', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'bottom': mesh = createWallPart('bottom', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'base': mesh = createWallPart('base', x, z, cabinetWidth, cabinetHeight, cabinetDepth); break;
        case 'shelf': mesh = createShelfPart(x, z, 0.8, 0.5, 1.0); break;
        case 'divider': mesh = createDividerPart(x, z, 0.018, 1.5, 0.5); break;
        case 'countertop': mesh = createCountertopPart(x, z, 1.2, 0.6); break;
        case 'countertop-sink': mesh = createCountertopSinkPart(x, z, 1.2, 0.6); break;
        case 'countertop-corner': mesh = createCountertopCornerPart(x, z, 1.0, 1.0); break;
        case 'door': mesh = createDoorPart(x, z, 0.8, 1.8); break;
        case 'drawer': mesh = createDrawerPart(x, z, 0.8, 0.4, 0.5); break;
        default: return;
    }
    
    if (mesh) {
        scene.add(mesh);
        clearSelection();
        currentSelectedObject = mesh;
        transformControls.attach(mesh);
        if (uiController) uiController.updateUI(currentMode, mesh, 1);
        updatePartsList();
        requestRender();
    }
}

function setupTogglePanel() {
    const toggleBtn = document.getElementById('toggle-parts');
    const partsPanel = document.getElementById('parts-panel');
    if (toggleBtn && partsPanel) {
        toggleBtn.addEventListener('click', () => partsPanel.classList.toggle('collapsed'));
    }
}

function setupWindowResize() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        requestRender();
    });
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(style);

init();