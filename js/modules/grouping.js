import * as THREE from 'three';

let groupCounter = 0;

export function createGroup(objects, scene, name = null) {
    if (!objects || objects.length < 2) return null;
    
    const group = new THREE.Group();
    const groupName = name || `Group_${groupCounter++}`;
    
    const worldPositions = objects.map(obj => {
        const position = obj.getWorldPosition(new THREE.Vector3());
        return { obj, position: position.clone() };
    });
    
    const center = new THREE.Vector3();
    worldPositions.forEach(item => center.add(item.position));
    center.divideScalar(objects.length);
    
    objects.forEach(obj => {
        const worldPos = obj.getWorldPosition(new THREE.Vector3());
        const localPos = worldPos.clone().sub(center);
        scene.remove(obj);
        group.add(obj);
        obj.position.copy(localPos);
    });
    
    group.position.copy(center);
    group.userData = {
        isGroup: true,
        groupId: groupName,
        name: groupName,
        memberCount: objects.length,
        createdAt: Date.now()
    };
    
    return group;
}

export function ungroup(group, scene) {
    if (!group || !group.userData.isGroup) return null;
    
    const children = [...group.children];
    const groupPosition = group.position.clone();
    
    children.forEach(child => {
        const worldPos = child.getWorldPosition(new THREE.Vector3());
        group.remove(child);
        scene.add(child);
        child.position.copy(worldPos);
    });
    
    scene.remove(group);
    return children;
}

export function isGroup(obj) {
    return obj && obj.userData && obj.userData.isGroup === true;
}