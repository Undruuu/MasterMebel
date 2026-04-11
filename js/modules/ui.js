export function setupUI(handlers) {
    const {
        onTranslateMode, onScaleMode, onApplySize, onApplyColor,
        onGroup, onUngroup, onClearSelection, onDelete
    } = handlers;
    
    const btnTranslate = document.getElementById('btn-translate');
    const btnScale = document.getElementById('btn-scale');
    const btnGroup = document.getElementById('btn-group');
    const btnUngroup = document.getElementById('btn-ungroup');
    const btnDelete = document.getElementById('btn-delete');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const sizeSection = document.getElementById('size-panel');
    const colorSection = document.getElementById('color-panel');
    const applySizeBtn = document.getElementById('apply-size');
    const applyColorBtn = document.getElementById('apply-color');
    const colorPicker = document.getElementById('color-picker');
    const colorPreview = document.getElementById('color-preview');
    const sizeX = document.getElementById('size-x');
    const sizeY = document.getElementById('size-y');
    const sizeZ = document.getElementById('size-z');
    const infoContent = document.getElementById('info-content');
    const selectionIndicator = document.getElementById('selection-indicator');
    const selectionCount = document.getElementById('selection-count');
    const clearSelectionBtn = document.getElementById('clear-selection');
    
    function updateUI(mode, selectedObject = null, selectionSize = 1) {
        if (btnTranslate && btnScale) {
            if (mode === 'translate') {
                btnTranslate.classList.add('active');
                btnScale.classList.remove('active');
            } else if (mode === 'scale') {
                btnScale.classList.add('active');
                btnTranslate.classList.remove('active');
            }
        }
        
        const hasSelection = selectedObject !== null;
        const isMultipleSelection = selectionSize > 1;
        
        if (sizeSection) {
            sizeSection.style.display = (hasSelection && !isMultipleSelection && mode === 'scale') ? 'flex' : 'none';
        }
        if (colorSection) {
            colorSection.style.display = (hasSelection && !isMultipleSelection) ? 'flex' : 'none';
        }
        
        if (selectedObject && !isMultipleSelection && selectedObject.userData) {
            if (selectedObject.userData.currentSize && sizeX && sizeY && sizeZ) {
                sizeX.value = selectedObject.userData.currentSize.width;
                sizeY.value = selectedObject.userData.currentSize.height;
                sizeZ.value = selectedObject.userData.currentSize.depth;
            }
            if (selectedObject.userData.color && colorPicker && colorPreview) {
                const colorHex = '#' + selectedObject.userData.color.toString(16).padStart(6, '0');
                colorPicker.value = colorHex;
                if (colorPreview) colorPreview.style.background = colorHex;
            }
        }
        
        if (selectionIndicator && selectionCount) {
            selectionIndicator.style.display = isMultipleSelection ? 'flex' : 'none';
            if (isMultipleSelection) selectionCount.textContent = selectionSize;
        }
        
        updateObjectInfo(selectedObject, selectionSize);
    }
    
    function updateObjectInfo(obj, selectionSize = 1) {
        if (!infoContent) return;
        
        if (selectionSize > 1) {
            infoContent.innerHTML = `
                <div style="background: rgba(230,126,34,0.2); border-left: 3px solid #e67e22; padding: 10px; border-radius: 8px;">
                    <p><i class="fas fa-object-group"></i> <strong>Выбрано объектов:</strong> ${selectionSize}</p>
                    <p><i class="fas fa-info-circle"></i> Используйте кнопку "Сгруппировать"</p>
                    <p><i class="fas fa-trash-alt"></i> Нажмите Delete для удаления</p>
                </div>
            `;
            return;
        }
        
        if (!obj || !obj.userData) {
            infoContent.innerHTML = `<p><i class="fas fa-hand-pointer"></i> Выделите деталь для просмотра информации</p>`;
            return;
        }
        
        const size = obj.userData.currentSize || { width: 100, height: 180, depth: 60 };
        const colorHex = '#' + (obj.userData.color || 0xDEB887).toString(16).padStart(6, '0');
        
        const typeNames = {
            'left-wall': 'Левая стена', 'right-wall': 'Правая стена', 'back-wall': 'Задняя стена',
            'top': 'Верхняя крышка', 'bottom': 'Нижнее днище', 'base': 'Основание',
            'shelf': 'Полка', 'divider': 'Перегородка',
            'countertop': 'Столешница', 'countertop-sink': 'Столешница под раковину',
            'countertop-corner': 'Угловая столешница',
            'door': 'Дверь', 'drawer': 'Ящик'
        };
        
        infoContent.innerHTML = `
            <p><i class="fas fa-cube"></i> <strong>Деталь:</strong> <span style="color:#e67e22">${typeNames[obj.userData.type] || obj.userData.type}</span></p>
            <p><i class="fas fa-ruler"></i> <strong>Размеры:</strong> ${Math.round(size.width)}x${Math.round(size.height)}x${Math.round(size.depth)} см</p>
            <p><i class="fas fa-palette"></i> <strong>Цвет:</strong> ${colorHex}<span style="display:inline-block; width:16px; height:16px; background:${colorHex}; border-radius:4px; margin-left:8px;"></span></p>
        `;
    }
    
    if (btnTranslate) btnTranslate.addEventListener('click', () => onTranslateMode());
    if (btnScale) btnScale.addEventListener('click', () => onScaleMode());
    if (btnGroup && onGroup) btnGroup.addEventListener('click', () => onGroup());
    if (btnUngroup && onUngroup) btnUngroup.addEventListener('click', () => onUngroup());
    if (btnDelete && onDelete) btnDelete.addEventListener('click', () => onDelete());
    if (btnClearSelection && onClearSelection) btnClearSelection.addEventListener('click', () => onClearSelection());
    if (clearSelectionBtn && onClearSelection) clearSelectionBtn.addEventListener('click', () => onClearSelection());
    
    if (applySizeBtn) {
        applySizeBtn.addEventListener('click', () => {
            if (sizeX && sizeY && sizeZ && onApplySize) {
                onApplySize(parseFloat(sizeX.value), parseFloat(sizeY.value), parseFloat(sizeZ.value));
            }
        });
    }
    
    if (applyColorBtn && colorPicker && onApplyColor) {
        applyColorBtn.addEventListener('click', () => onApplyColor(colorPicker.value));
    }
    
    if (colorPicker && colorPreview) {
        colorPicker.addEventListener('input', (e) => {
            if (colorPreview) colorPreview.style.background = e.target.value;
        });
    }
    
    return { updateUI, updateObjectInfo };
}