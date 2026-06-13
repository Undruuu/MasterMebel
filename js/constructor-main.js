import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// --- ИНИЦИАЛИЗАЦИЯ СЦЕНЫ ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.006);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 3, 5);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.rotateSpeed = 1.0;
orbitControls.zoomSpeed = 1.2;
orbitControls.panSpeed = 0.8;
orbitControls.screenSpacePanning = true;
orbitControls.maxPolarAngle = Math.PI / 2;
orbitControls.target.set(0, 1, 0);

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
});
scene.add(transformControls);

// --- ОСВЕЩЕНИЕ ---
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
mainLight.position.set(3, 5, 2);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

const fillLight = new THREE.PointLight(0x4466cc, 0.3);
fillLight.position.set(-2, 2, -3);
scene.add(fillLight);

const warmLight = new THREE.PointLight(0xcc8844, 0.25);
warmLight.position.set(0, -0.5, 0);
scene.add(warmLight);

const rimLight = new THREE.PointLight(0xffaa66, 0.4);
rimLight.position.set(0, 2, -3.5);
scene.add(rimLight);

// --- ПОЛ И СЕТКА ---
const floorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
);
floorPlane.rotation.x = -Math.PI / 2;
floorPlane.position.y = -0.02;
floorPlane.receiveShadow = true;
scene.add(floorPlane);

const gridHelper = new THREE.GridHelper(8, 16, 0x88aaff, 0x335588);
gridHelper.position.y = -0.015;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.4;
scene.add(gridHelper);

// --- МАТЕРИАЛЫ ---
const materials = {
    woodLight: new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.5, metalness: 0.05 }),
    woodMedium: new THREE.MeshStandardMaterial({ color: 0xC4A46C, roughness: 0.55, metalness: 0.03 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.6, metalness: 0.02 }),
    white: new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.4, metalness: 0.02 }),
    doorMat: new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.3, metalness: 0.08 })
};

// --- КЛАСС ДЛЯ СОЗДАНИЯ ОТДЕЛЬНЫХ ЭЛЕМЕНТОВ МЕБЕЛИ ---
class FurnitureParts {
    static partCounter = 0;
    
    // Создание стенки (левая, правая, задняя, верх, низ)
    static createWall(type, width, height, depth, color = 0xDEB887) {
        let geometry, position;
        const mat = materials.woodLight.clone();
        mat.color.setHex(color);
        
        switch(type) {
            case 'left':
                geometry = new THREE.BoxGeometry(0.018, height, depth);
                position = { x: -width/2 + 0.009, y: height/2, z: 0 };
                break;
            case 'right':
                geometry = new THREE.BoxGeometry(0.018, height, depth);
                position = { x: width/2 - 0.009, y: height/2, z: 0 };
                break;
            case 'back':
                geometry = new THREE.BoxGeometry(width, height, 0.018);
                position = { x: 0, y: height/2, z: -depth/2 + 0.009 };
                break;
            case 'top':
                geometry = new THREE.BoxGeometry(width, 0.018, depth);
                position = { x: 0, y: height, z: 0 };
                break;
            case 'bottom':
                geometry = new THREE.BoxGeometry(width, 0.018, depth);
                position = { x: 0, y: 0, z: 0 };
                break;
            case 'base':
                geometry = new THREE.BoxGeometry(width + 0.04, 0.04, depth + 0.04);
                position = { x: 0, y: -0.02, z: 0 };
                break;
            default: return null;
        }
        
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        mesh.userData = {
            id: `${type}_${Date.now()}_${this.partCounter++}`,
            type: 'part',
            partType: type,
            name: this.getPartName(type),
            size: { width, height, depth },
            color: color
        };
        return mesh;
    }
    
    static getPartName(type) {
        const names = {
            'left': 'Левая стенка', 'right': 'Правая стенка', 'back': 'Задняя стенка',
            'top': 'Верхняя крышка', 'bottom': 'Нижнее днище', 'base': 'Основание'
        };
        return names[type] || type;
    }
    
    // Полка
    static createShelf(width, depth, yPosition, color = 0xDEB887) {
        const mat = materials.woodMedium.clone();
        mat.color.setHex(color);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.018, depth - 0.03), mat);
        mesh.position.set(0, yPosition, 0);
        mesh.castShadow = true;
        mesh.userData = {
            id: `shelf_${Date.now()}_${this.partCounter++}`,
            type: 'part',
            partType: 'shelf',
            name: 'Полка',
            size: { width: width - 0.04, height: 0.018, depth: depth - 0.03 },
            color: color
        };
        return mesh;
    }
    
    // Дверь
    static createDoor(width, height, isLeft = true, color = 0xDEB887) {
        const mat = materials.doorMat.clone();
        mat.color.setHex(color);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width/2 - 0.01, height - 0.04, 0.022), mat);
        const xOffset = isLeft ? -(width/4 + 0.005) : (width/4 + 0.005);
        mesh.position.set(xOffset, height/2, 0.31);
        mesh.castShadow = true;
        mesh.userData = {
            id: `door_${Date.now()}_${this.partCounter++}`,
            type: 'part',
            partType: 'door',
            name: 'Дверь',
            size: { width: width/2 - 0.01, height: height - 0.04, depth: 0.022 },
            color: color,
            isLeft: isLeft
        };
        return mesh;
    }
    
    // Ящик
    static createDrawer(width, depth, yPosition, color = 0xDEB887) {
        const mat = materials.woodMedium.clone();
        mat.color.setHex(color);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.08, depth - 0.04), mat);
        mesh.position.set(0, yPosition, 0.31);
        mesh.castShadow = true;
        mesh.userData = {
            id: `drawer_${Date.now()}_${this.partCounter++}`,
            type: 'part',
            partType: 'drawer',
            name: 'Ящик',
            size: { width: width - 0.06, height: 0.08, depth: depth - 0.04 },
            color: color
        };
        return mesh;
    }
    
    // Перегородка (вертикальная)
    static createDivider(height, depth, xPosition, color = 0xDEB887) {
        const mat = materials.woodMedium.clone();
        mat.color.setHex(color);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.018, height, depth - 0.05), mat);
        mesh.position.set(xPosition, height/2, 0);
        mesh.castShadow = true;
        mesh.userData = {
            id: `divider_${Date.now()}_${this.partCounter++}`,
            type: 'part',
            partType: 'divider',
            name: 'Перегородка',
            size: { width: 0.018, height: height, depth: depth - 0.05 },
            color: color
        };
        return mesh;
    }
}

// --- ГОТОВЫЕ ВАРИАНТЫ ШКАФОВ ---

// Вариант 1: Классический двухдверный шкаф
function createClassicCabinet(x, z) {
    const group = new THREE.Group();
    const width = 1.2;
    const height = 2.0;
    const depth = 0.6;
    
    // Корпус
    group.add(FurnitureParts.createWall('left', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('right', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('back', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('top', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('bottom', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('base', width, height, depth, 0x8B5A2B));
    
    // Полки
    group.add(FurnitureParts.createShelf(width, depth, 0.6, 0xDEB887));
    group.add(FurnitureParts.createShelf(width, depth, 1.2, 0xDEB887));
    
    // Двери
    group.add(FurnitureParts.createDoor(width, height, true, 0xDEB887));
    group.add(FurnitureParts.createDoor(width, height, false, 0xDEB887));
    
    group.position.set(x, 0, z);
    group.userData = {
        type: 'preset',
        presetName: 'Классический шкаф',
        isPreset: true
    };
    return group;
}

// Вариант 2: Шкаф-купе с одной дверью и открытой секцией
function createWardrobeWithOpenSection(x, z) {
    const group = new THREE.Group();
    const width = 1.4;
    const height = 2.1;
    const depth = 0.55;
    
    // Корпус
    group.add(FurnitureParts.createWall('left', width, height, depth, 0xC4A46C));
    group.add(FurnitureParts.createWall('right', width, height, depth, 0xC4A46C));
    group.add(FurnitureParts.createWall('back', width, height, depth, 0xC4A46C));
    group.add(FurnitureParts.createWall('top', width, height, depth, 0xC4A46C));
    group.add(FurnitureParts.createWall('bottom', width, height, depth, 0xC4A46C));
    group.add(FurnitureParts.createWall('base', width, height, depth, 0x8B5A2B));
    
    // Перегородка (разделяет закрытую и открытую части)
    group.add(FurnitureParts.createDivider(height, depth, 0.2, 0xC4A46C));
    
    // Полки в открытой секции
    group.add(FurnitureParts.createShelf(0.5, depth, 0.7, 0xC4A46C));
    group.add(FurnitureParts.createShelf(0.5, depth, 1.3, 0xC4A46C));
    
    // Дверь на правую секцию
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.65, height - 0.04, 0.022), materials.doorMat);
    rightDoor.position.set(0.55, height/2, depth/2 + 0.008);
    rightDoor.castShadow = true;
    rightDoor.userData = { type: 'part', partType: 'door', name: 'Дверь' };
    group.add(rightDoor);
    
    group.position.set(x, 0, z);
    group.userData = {
        type: 'preset',
        presetName: 'Шкаф-купе с открытой секцией',
        isPreset: true
    };
    return group;
}

// Вариант 3: Угловая секция
function createCornerSection(x, z) {
    const group = new THREE.Group();
    const width = 0.9;
    const height = 1.8;
    const depth = 0.9;
    
    group.add(FurnitureParts.createWall('left', width, height, depth, 0xD2B48C));
    group.add(FurnitureParts.createWall('right', width, height, depth, 0xD2B48C));
    group.add(FurnitureParts.createWall('back', width, height, depth, 0xD2B48C));
    group.add(FurnitureParts.createWall('top', width, height, depth, 0xD2B48C));
    group.add(FurnitureParts.createWall('bottom', width, height, depth, 0xD2B48C));
    
    // Полки
    group.add(FurnitureParts.createShelf(width, depth, 0.5, 0xD2B48C));
    group.add(FurnitureParts.createShelf(width, depth, 1.0, 0xD2B48C));
    group.add(FurnitureParts.createShelf(width, depth, 1.5, 0xD2B48C));
    
    group.position.set(x, 0, z);
    group.userData = {
        type: 'preset',
        presetName: 'Угловая секция',
        isPreset: true
    };
    return group;
}

// Вариант 4: Тумба с ящиками
function createDrawerCabinet(x, z) {
    const group = new THREE.Group();
    const width = 0.6;
    const height = 0.8;
    const depth = 0.45;
    
    group.add(FurnitureParts.createWall('left', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('right', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('back', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('top', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('bottom', width, height, depth, 0xDEB887));
    group.add(FurnitureParts.createWall('base', width, height, depth, 0x8B5A2B));
    
    // Ящики
    group.add(FurnitureParts.createDrawer(width, depth, 0.2, 0xDEB887));
    group.add(FurnitureParts.createDrawer(width, depth, 0.5, 0xDEB887));
    
    group.position.set(x, 0, z);
    group.userData = {
        type: 'preset',
        presetName: 'Тумба с ящиками',
        isPreset: true
    };
    return group;
}

// --- СОЗДАНИЕ НАЧАЛЬНОЙ СЦЕНЫ С ГОТОВЫМИ ВАРИАНТАМИ ---

// Добавляем готовые варианты на сцену
const classicCabinet = createClassicCabinet(-1.2, -0.5);
const wardrobe = createWardrobeWithOpenSection(0, -0.8);
const cornerSection = createCornerSection(1.3, -0.3);
const drawerCab = createDrawerCabinet(-0.5, 1.2);
const drawerCab2 = createDrawerCabinet(0.5, 1.2);

scene.add(classicCabinet);
scene.add(wardrobe);
scene.add(cornerSection);
scene.add(drawerCab);
scene.add(drawerCab2);

// --- ПЕРЕМЕННЫЕ ДЛЯ ДОБАВЛЕНИЯ ЭЛЕМЕНТОВ ---
let currentSelectedObject = classicCabinet;
let lastAddedPosition = { x: -1.5, z: 1.5 };
let currentMode = 'translate';

// Прикрепляем контрол
transformControls.attach(classicCabinet);

// --- ФУНКЦИИ ДЛЯ ДОБАВЛЕНИЯ ЭЛЕМЕНТОВ ---
function addPart(partType) {
    let newPart = null;
    const defaultWidth = 1.0;
    const defaultHeight = 1.8;
    const defaultDepth = 0.55;
    
    switch(partType) {
        case 'left-wall':
            newPart = FurnitureParts.createWall('left', defaultWidth, defaultHeight, defaultDepth, 0xDEB887);
            break;
        case 'right-wall':
            newPart = FurnitureParts.createWall('right', defaultWidth, defaultHeight, defaultDepth, 0xDEB887);
            break;
        case 'back-wall':
            newPart = FurnitureParts.createWall('back', defaultWidth, defaultHeight, defaultDepth, 0xDEB887);
            break;
        case 'top':
            newPart = FurnitureParts.createWall('top', defaultWidth, defaultHeight, defaultDepth, 0xDEB887);
            break;
        case 'bottom':
            newPart = FurnitureParts.createWall('bottom', defaultWidth, defaultHeight, defaultDepth, 0xDEB887);
            break;
        case 'shelf':
            newPart = FurnitureParts.createShelf(defaultWidth, defaultDepth, 0.9, 0xDEB887);
            break;
        case 'door':
            newPart = FurnitureParts.createDoor(defaultWidth, defaultHeight, true, 0xDEB887);
            break;
        case 'drawer':
            newPart = FurnitureParts.createDrawer(defaultWidth, defaultDepth, 0.3, 0xDEB887);
            break;
        case 'divider':
            newPart = FurnitureParts.createDivider(defaultHeight, defaultDepth, 0, 0xDEB887);
            break;
        default: return;
    }
    
    if (newPart) {
        // Размещаем новый элемент в свободном месте
        lastAddedPosition.x += 0.8;
        if (lastAddedPosition.x > 2.5) {
            lastAddedPosition.x = -1.5;
            lastAddedPosition.z += 0.8;
        }
        newPart.position.x = lastAddedPosition.x;
        newPart.position.z = lastAddedPosition.z;
        
        scene.add(newPart);
        transformControls.detach();
        transformControls.attach(newPart);
        currentSelectedObject = newPart;
        
        showNotification(`Добавлен: ${newPart.userData.name}`, 'success');
    }
}

function addPreset(presetType) {
    let newPreset = null;
    
    switch(presetType) {
        case 'classic':
            newPreset = createClassicCabinet(lastAddedPosition.x, lastAddedPosition.z);
            break;
        case 'wardrobe':
            newPreset = createWardrobeWithOpenSection(lastAddedPosition.x, lastAddedPosition.z);
            break;
        case 'corner':
            newPreset = createCornerSection(lastAddedPosition.x, lastAddedPosition.z);
            break;
        case 'drawer-cabinet':
            newPreset = createDrawerCabinet(lastAddedPosition.x, lastAddedPosition.z);
            break;
        default: return;
    }
    
    if (newPreset) {
        lastAddedPosition.x += 1.0;
        if (lastAddedPosition.x > 2.5) {
            lastAddedPosition.x = -1.5;
            lastAddedPosition.z += 1.0;
        }
        
        scene.add(newPreset);
        transformControls.detach();
        transformControls.attach(newPreset);
        currentSelectedObject = newPreset;
        
        showNotification(`Добавлен: ${newPreset.userData.presetName}`, 'success');
    }
}

function clearAll() {
    const objectsToKeep = [gridHelper, floorPlane];
    
    scene.children.forEach(child => {
        if (child.isGroup || (child.isMesh && child.userData && child.userData.type)) {
            if (!objectsToKeep.includes(child)) {
                scene.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            }
        }
    });
    
    showNotification('Все объекты удалены', 'success');
}

function resetCamera() {
    camera.position.set(4, 3, 5);
    orbitControls.target.set(0, 1, 0);
    orbitControls.update();
    showNotification('Камера сброшена', 'success');
}

function toggleGrid() {
    gridHelper.visible = !gridHelper.visible;
    const btn = document.getElementById('btn-toggle-grid');
    if (btn) btn.textContent = `📐 Сетка: ${gridHelper.visible ? 'Вкл' : 'Выкл'}`;
}

function setMode(mode) {
    currentMode = mode;
    transformControls.setMode(mode);
    const btnTranslate = document.getElementById('btn-translate');
    const btnScale = document.getElementById('btn-scale');
    if (btnTranslate && btnScale) {
        if (mode === 'translate') {
            btnTranslate.classList.add('active');
            btnScale.classList.remove('active');
        } else {
            btnScale.classList.add('active');
            btnTranslate.classList.remove('active');
        }
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 10px 18px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        font-family: 'Segoe UI', sans-serif;
    `;
    notification.innerHTML = `🪑 ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function goToHome() {
    window.location.href = 'index.html';
}

// --- ВЫДЕЛЕНИЕ ОБЪЕКТОВ ---
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
            if ((obj.isGroup || obj.isMesh) && obj !== transformControls && 
                obj !== gridHelper && obj.userData && (obj.userData.type === 'part' || obj.userData.isPreset)) {
                clickableObjects.push(obj);
            }
        });
        
        const intersects = raycaster.intersectObjects(clickableObjects, true);
        
        if (intersects.length > 0) {
            let selected = intersects[0].object;
            while (selected.parent && selected.parent !== scene && !selected.userData?.isPreset && !selected.userData?.type) {
                selected = selected.parent;
            }
            if (selected.userData && (selected.userData.type === 'part' || selected.userData.isPreset)) {
                transformControls.detach();
                transformControls.attach(selected);
                currentSelectedObject = selected;
                const name = selected.userData.presetName || selected.userData.name;
                showNotification(`Выделен: ${name}`, 'success');
            }
        }
    });
}

// --- UI НАСТРОЙКА ---
function setupUI() {
    document.getElementById('btn-translate')?.addEventListener('click', () => setMode('translate'));
    document.getElementById('btn-scale')?.addEventListener('click', () => setMode('scale'));
    document.getElementById('btn-reset-camera')?.addEventListener('click', resetCamera);
    document.getElementById('btn-toggle-grid')?.addEventListener('click', toggleGrid);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAll);
    document.getElementById('home-button')?.addEventListener('click', goToHome);
    
    // Элементы мебели
    document.getElementById('btn-add-left-wall')?.addEventListener('click', () => addPart('left-wall'));
    document.getElementById('btn-add-right-wall')?.addEventListener('click', () => addPart('right-wall'));
    document.getElementById('btn-add-back-wall')?.addEventListener('click', () => addPart('back-wall'));
    document.getElementById('btn-add-top')?.addEventListener('click', () => addPart('top'));
    document.getElementById('btn-add-bottom')?.addEventListener('click', () => addPart('bottom'));
    document.getElementById('btn-add-shelf')?.addEventListener('click', () => addPart('shelf'));
    document.getElementById('btn-add-door')?.addEventListener('click', () => addPart('door'));
    document.getElementById('btn-add-drawer')?.addEventListener('click', () => addPart('drawer'));
    document.getElementById('btn-add-divider')?.addEventListener('click', () => addPart('divider'));
    
    // Готовые варианты
    document.getElementById('btn-preset-classic')?.addEventListener('click', () => addPreset('classic'));
    document.getElementById('btn-preset-wardrobe')?.addEventListener('click', () => addPreset('wardrobe'));
    document.getElementById('btn-preset-corner')?.addEventListener('click', () => addPreset('corner'));
    document.getElementById('btn-preset-drawer')?.addEventListener('click', () => addPreset('drawer-cabinet'));
}

// --- АНИМАЦИЯ ---
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}

// --- ЗАПУСК ---
function init() {
    setupUI();
    setupRaycaster();
    animate();
    console.log('✅ 3D Конструктор мебели готов!');
    console.log('📦 Можно добавлять отдельные элементы или готовые варианты');
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('DOMContentLoaded', init);