import * as THREE from 'three';

// Кэширование геометрий для повторного использования
const geometryCache = new Map();

function getCachedGeometry(width, height, depth) {
    const key = `${width}_${height}_${depth}`;
    if (!geometryCache.has(key)) {
        geometryCache.set(key, new THREE.BoxGeometry(width, height, depth));
    }
    return geometryCache.get(key);
}

let partCounter = 0;

export function createWallPart(type, x, z, width, height, depth, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0 });
    let geometry, positionX, positionY, positionZ;
    
    const widthM = width;
    const heightM = height;
    const depthM = depth;
    
    switch(type) {
        case 'left-wall':
            geometry = getCachedGeometry(0.018, heightM, depthM);
            positionX = x - widthM/2 + 0.009;
            positionY = heightM/2;
            positionZ = z;
            break;
        case 'right-wall':
            geometry = getCachedGeometry(0.018, heightM, depthM);
            positionX = x + widthM/2 - 0.009;
            positionY = heightM/2;
            positionZ = z;
            break;
        case 'back-wall':
            geometry = getCachedGeometry(widthM, heightM, 0.018);
            positionX = x;
            positionY = heightM/2;
            positionZ = z - depthM/2 + 0.009;
            break;
        case 'top':
            geometry = getCachedGeometry(widthM, 0.018, depthM);
            positionX = x;
            positionY = heightM;
            positionZ = z;
            break;
        case 'bottom':
            geometry = getCachedGeometry(widthM, 0.018, depthM);
            positionX = x;
            positionY = 0;
            positionZ = z;
            break;
        case 'base':
            geometry = getCachedGeometry(widthM + 0.05, 0.03, depthM + 0.05);
            positionX = x;
            positionY = -0.015;
            positionZ = z;
            break;
        default:
            return null;
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(positionX, positionY, positionZ);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    
    mesh.userData = {
        id: `${type}_${Date.now()}_${partCounter++}`,
        type: type,
        name: getPartName(type),
        currentSize: { width: widthM * 100, height: heightM * 100, depth: depthM * 100 },
        color: color
    };
    
    return mesh;
}

// Остальные функции создания с использованием кэширования...
export function createShelfPart(x, z, width, depth, yPos, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
    const geometry = getCachedGeometry(width, 0.018, depth);
    const shelf = new THREE.Mesh(geometry, material);
    shelf.position.set(x, yPos, z);
    shelf.castShadow = false;
    shelf.receiveShadow = false;
    shelf.userData = {
        id: `shelf_${Date.now()}_${partCounter++}`,
        type: 'shelf',
        name: 'Полка',
        currentSize: { width: width * 100, height: 1.8, depth: depth * 100 },
        color: color
    };
    return shelf;
}

export function createDoorPart(x, z, width, height, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
    const geometry = getCachedGeometry(width, height, 0.02);
    const door = new THREE.Mesh(geometry, material);
    door.position.set(x, height/2, z + 0.31);
    door.castShadow = false;
    door.userData = {
        id: `door_${Date.now()}_${partCounter++}`,
        type: 'door',
        name: 'Дверь распашная',
        currentSize: { width: width * 100, height: height * 100, depth: 2 },
        color: color
    };
    return door;
}

// Заглушки для остальных типов (упрощенные)
export function createDividerPart(x, z, width, height, depth, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
    const geometry = getCachedGeometry(width, height, depth);
    const divider = new THREE.Mesh(geometry, material);
    divider.position.set(x, height/2, z);
    divider.castShadow = false;
    divider.userData = {
        id: `divider_${Date.now()}_${partCounter++}`,
        type: 'divider',
        name: 'Перегородка',
        currentSize: { width: width * 100, height: height * 100, depth: depth * 100 },
        color: color
    };
    return divider;
}

export function createCountertopPart(x, z, width, depth, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
    const geometry = getCachedGeometry(width, 0.04, depth);
    const countertop = new THREE.Mesh(geometry, material);
    countertop.position.set(x, 0.9, z);
    countertop.castShadow = false;
    countertop.userData = {
        id: `countertop_${Date.now()}_${partCounter++}`,
        type: 'countertop',
        name: 'Столешница',
        currentSize: { width: width * 100, height: 4, depth: depth * 100 },
        color: color
    };
    return countertop;
}

export function createCountertopSinkPart(x, z, width, depth, color = 0xDEB887) {
    return createCountertopPart(x, z, width, depth, color);
}

export function createCountertopCornerPart(x, z, width, depth, color = 0xDEB887) {
    return createCountertopPart(x, z, width, depth, color);
}

export function createDrawerPart(x, z, width, depth, yPos, color = 0xDEB887) {
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
    const geometry = getCachedGeometry(width, 0.1, depth);
    const drawer = new THREE.Mesh(geometry, material);
    drawer.position.set(x, yPos, z + 0.31);
    drawer.castShadow = false;
    drawer.userData = {
        id: `drawer_${Date.now()}_${partCounter++}`,
        type: 'drawer',
        name: 'Ящик',
        currentSize: { width: width * 100, height: 10, depth: depth * 100 },
        color: color
    };
    return drawer;
}

function getPartName(type) {
    const names = {
        'left-wall': 'Левая стена', 'right-wall': 'Правая стена', 'back-wall': 'Задняя стена',
        'top': 'Верхняя крышка', 'bottom': 'Нижнее днище', 'base': 'Основание'
    };
    return names[type] || type;
}

export function updatePartSize(obj, newWidth, newHeight, newDepth) {
    if (!obj) return;
    
    const widthM = newWidth / 100;
    const heightM = newHeight / 100;
    const depthM = newDepth / 100;
    
    obj.userData.currentSize = { width: newWidth, height: newHeight, depth: newDepth };
    obj.scale.set(widthM, heightM, depthM);
    
    const type = obj.userData.type;
    if (type === 'left-wall') {
        obj.position.x = -widthM/2 + 0.009;
        obj.position.y = heightM/2;
    } else if (type === 'right-wall') {
        obj.position.x = widthM/2 - 0.009;
        obj.position.y = heightM/2;
    } else if (type === 'back-wall') {
        obj.position.z = -depthM/2 + 0.009;
        obj.position.y = heightM/2;
    } else if (type === 'top') {
        obj.position.y = heightM;
    } else if (type === 'bottom') {
        obj.position.y = 0;
    } else if (type === 'door') {
        obj.position.y = heightM/2;
    } else if (type !== 'base') {
        obj.position.y = heightM/2;
    }
}

export function updatePartColor(obj, colorHex) {
    if (!obj || !obj.material) return;
    const color = parseInt(colorHex.replace('#', '0x'));
    obj.userData.color = color;
    obj.material.color.setHex(color);
}