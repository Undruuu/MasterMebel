// ========== МОБИЛЬНОЕ МЕНЮ ==========
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });
}

// ========== ПЛАВНАЯ ПРОКРУТКА ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#') return;
        
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
        
        if (navLinks) {
            navLinks.classList.remove('active');
        }
    });
});

// ========== ФИЛЬТРАЦИЯ ПОРТФОЛИО ==========
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        
        const filterValue = this.getAttribute('data-filter');
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        portfolioItems.forEach(item => {
            if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// ========== ФОРМА ОБРАТНОЙ СВЯЗИ ==========
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = this.querySelector('input[placeholder="Ваше имя"]').value;
        const phone = this.querySelector('input[placeholder="Ваш телефон"]').value;
        
        alert(`Спасибо, ${name}! Ваша заявка принята.\n\nЯ свяжусь с вами по номеру ${phone} в ближайшее время для уточнения деталей.`);
        
        this.reset();
    });
}

// ========== КАЛЬКУЛЯТОР СТОИМОСТИ ==========

// Цены и коэффициенты
const priceConfig = {
    // Базовая цена за единицу измерения (руб)
    basePrice: {
        kitchen: 25000,      // руб/пог.м - кухня
        wardrobe: 18000,     // руб/пог.м - шкаф-купе
        dressing: 22000,     // руб/кв.м - гардеробная
        hallway: 15000       // руб/пог.м - прихожая
    },
    
    // Коэффициенты для материала корпуса
    material: {
        ldsp: 1.0,
        mdf: 1.4,
        massive: 2.2
    },
    
    // Коэффициенты для фасада
    facade: {
        ldsp: 1.0,
        mdf_pvc: 1.3,
        mdf_enamel: 1.8,
        glass: 1.5
    },
    
    // Коэффициенты для фурнитуры
    fittings: {
        economy: 1.0,
        standard: 1.2,
        premium: 1.6
    },
    
    // Стоимость дополнительных опций (руб)
    options: {
        lighting: 5000,
        installation: 8000,
        delivery: 3000
    },
    
    // Размеры в метрах для разных вариантов
    sizes: {
        small: 2.0,
        medium: 3.5,
        large: 6.0
    }
};

// Названия для отображения в заявке
const displayNames = {
    productType: {
        kitchen: 'Кухня',
        wardrobe: 'Шкаф-купе',
        dressing: 'Гардеробная',
        hallway: 'Прихожая'
    },
    size: {
        small: 'маленький (до 2 м)',
        medium: 'средний (2-4 м)',
        large: 'большой (более 4 м)'
    },
    material: {
        ldsp: 'ЛДСП (бюджетный)',
        mdf: 'МДФ (качественный)',
        massive: 'Массив дерева (премиум)'
    },
    facade: {
        ldsp: 'Ламинат / Пластик',
        mdf_pvc: 'Пленка ПВХ',
        mdf_enamel: 'Краска (эмаль)',
        glass: 'Стекло / Зеркало'
    },
    fittings: {
        economy: 'Эконом (Китай)',
        standard: 'Стандарт (Турция/Польша)',
        premium: 'Премиум (Blum, Hettich)'
    }
};

// Получение выбранного размера
function getSelectedSize() {
    const selectedRadio = document.querySelector('input[name="sizeRadio"]:checked');
    if (selectedRadio) {
        const sizeValue = selectedRadio.getAttribute('data-size');
        return parseFloat(sizeValue);
    }
    return 3.5; // значение по умолчанию
}

// Получение текстового названия размера
function getSelectedSizeName() {
    const selectedRadio = document.querySelector('input[name="sizeRadio"]:checked');
    if (selectedRadio) {
        return displayNames.size[selectedRadio.value];
    }
    return 'средний (2-4 м)';
}

// Функция обновления цены
function updatePrice() {
    // Получаем значения всех параметров
    const productType = document.getElementById('productType').value;
    const size = getSelectedSize();
    const material = document.getElementById('material').value;
    const facade = document.getElementById('facade').value;
    const fittings = document.getElementById('fittings').value;
    
    // Получаем дополнительные опции
    const lighting = document.getElementById('lighting').checked;
    const installation = document.getElementById('installation').checked;
    const delivery = document.getElementById('delivery').checked;
    
    // Рассчитываем базовую стоимость
    let basePrice = priceConfig.basePrice[productType] * size;
    
    // Применяем коэффициенты
    let totalPrice = basePrice * 
                    priceConfig.material[material] * 
                    priceConfig.facade[facade] * 
                    priceConfig.fittings[fittings];
    
    // Округляем до целых
    totalPrice = Math.round(totalPrice);
    
    // Рассчитываем стоимость дополнительных опций
    let optionsPrice = 0;
    if (lighting) optionsPrice += priceConfig.options.lighting;
    if (installation) optionsPrice += priceConfig.options.installation;
    if (delivery) optionsPrice += priceConfig.options.delivery;
    
    // Итоговая цена
    const finalPrice = totalPrice + optionsPrice;
    
    // Обновляем отображение цены с форматированием
    document.getElementById('totalPrice').textContent = finalPrice.toLocaleString('ru-RU');
    document.getElementById('basePrice').textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('optionsPrice').textContent = optionsPrice.toLocaleString('ru-RU') + ' ₽';
    
    // Добавляем анимацию при обновлении цены
    const priceElement = document.getElementById('totalPrice');
    priceElement.style.transform = 'scale(1.1)';
    setTimeout(() => {
        priceElement.style.transform = 'scale(1)';
    }, 200);
}

// Функция отправки заявки с параметрами калькулятора
function sendCalculationRequest() {
    // Получаем все параметры
    const productType = document.getElementById('productType').value;
    const productText = displayNames.productType[productType];
    const sizeText = getSelectedSizeName();
    const material = document.getElementById('material').value;
    const materialText = displayNames.material[material];
    const facade = document.getElementById('facade').value;
    const facadeText = displayNames.facade[facade];
    const fittings = document.getElementById('fittings').value;
    const fittingsText = displayNames.fittings[fittings];
    
    const lighting = document.getElementById('lighting').checked;
    const installation = document.getElementById('installation').checked;
    const delivery = document.getElementById('delivery').checked;
    const totalPrice = document.getElementById('totalPrice').textContent;
    
    // Формируем понятное сообщение
    let message = `Здравствуйте! Хочу заказать мебель:\n\n`;
    message += `📦 Тип: ${productText}\n`;
    message += `📏 Размер: ${sizeText}\n`;
    message += `🪵 Материал корпуса: ${materialText}\n`;
    message += `🎨 Отделка фасадов: ${facadeText}\n`;
    message += `🔧 Фурнитура: ${fittingsText}\n`;
    message += `✨ Дополнительно: `;
    
    const options = [];
    if (lighting) options.push('подсветка');
    if (installation) options.push('монтаж');
    if (delivery) options.push('доставка');
    
    message += options.length > 0 ? options.join(', ') : 'нет';
    message += `\n\n💰 Примерная стоимость: ${totalPrice} ₽\n\n`;
    message += `Жду звонка для уточнения деталей и записи на бесплатный замер.`;
    
    // Находим поле сообщения в форме контактов
    const contactMessageField = document.querySelector('.contact-form textarea');
    if (contactMessageField) {
        contactMessageField.value = message;
    }
    
    // Плавно скроллим к форме
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Подсвечиваем поле сообщения
    if (contactMessageField) {
        contactMessageField.style.backgroundColor = '#fff3e0';
        contactMessageField.style.border = '2px solid #e67e22';
        setTimeout(() => {
            contactMessageField.style.backgroundColor = '';
            contactMessageField.style.border = '';
        }, 2000);
    }
    
    // Анимация кнопки
    const calcBtn = document.getElementById('sendCalcRequest');
    if (calcBtn) {
        const originalText = calcBtn.innerHTML;
        calcBtn.innerHTML = '<i class="fas fa-check"></i> Параметры переданы!';
        calcBtn.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            calcBtn.innerHTML = originalText;
            calcBtn.style.backgroundColor = '';
        }, 2000);
    }
}

// Добавляем обработчики событий для всех элементов калькулятора
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли элементы калькулятора на странице
    const productType = document.getElementById('productType');
    if (!productType) return;
    
    // Обработчики для селектов и чекбоксов
    const elements = [
        'productType', 'material', 'facade', 'fittings',
        'lighting', 'installation', 'delivery'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.addEventListener('change', updatePrice);
            } else {
                element.addEventListener('change', updatePrice);
            }
        }
    });
    
    // Обработчики для радио-кнопок размера
    const sizeRadios = document.querySelectorAll('input[name="sizeRadio"]');
    sizeRadios.forEach(radio => {
        radio.addEventListener('change', updatePrice);
    });
    
    // Обработчик для кнопки отправки
    const sendBtn = document.getElementById('sendCalcRequest');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendCalculationRequest);
    }
    
    // Запускаем расчёт при загрузке
    updatePrice();
});

// ========== АНИМАЦИЯ ПРИ ПРОКРУТКЕ ==========
function checkScroll() {
    const elements = document.querySelectorAll('.feature-card, .portfolio-item, .step, .calculator-container');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 100) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Изначально скрываем элементы для анимации
document.querySelectorAll('.feature-card, .portfolio-item, .step, .calculator-container').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

// Проверяем при загрузке и при прокрутке
window.addEventListener('load', checkScroll);
window.addEventListener('scroll', checkScroll);

// ========== ЗАКРЫТИЕ МОБИЛЬНОГО МЕНЮ ПРИ КЛИКЕ ВНЕ ЕГО ==========
document.addEventListener('click', function(event) {
    if (!navLinks) return;
    
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (navLinks.classList.contains('active') && 
        !navLinks.contains(event.target) && 
        !mobileMenuBtn.contains(event.target)) {
        navLinks.classList.remove('active');
    }
});

// ========== ИЗМЕНЕНИЕ ШАПКИ ПРИ СКРОЛЛЕ ==========
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// ========== ОБРАБОТКА ПРОЕКТА ИЗ КОНСТРУКТОРА ==========
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли данные из конструктора
    const urlParams = new URLSearchParams(window.location.search);
    const openForm = urlParams.get('openForm');
    const messageFromUrl = urlParams.get('message');
    
    // Если есть сообщение из конструктора
    if (messageFromUrl) {
        const messageField = document.querySelector('.contact-form textarea');
        if (messageField) {
            messageField.value = decodeURIComponent(messageFromUrl);
            messageField.style.backgroundColor = '#fff3e0';
            messageField.style.border = '2px solid #e67e22';
            setTimeout(() => {
                messageField.style.backgroundColor = '';
                messageField.style.border = '';
            }, 3000);
        }
    }
    
    // Если нужно открыть форму
    if (openForm === 'true') {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            setTimeout(() => {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }
    
    // Проверяем localStorage на наличие проекта из конструктора
    const savedProject = localStorage.getItem('constructorProject');
    const savedMessage = localStorage.getItem('constructorMessage');
    
    if (savedProject && savedMessage && !messageFromUrl) {
        const messageField = document.querySelector('.contact-form textarea');
        if (messageField) {
            messageField.value = savedMessage;
            messageField.style.backgroundColor = '#fff3e0';
            messageField.style.border = '2px solid #e67e22';
            
            // Показываем уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: #27ae60;
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                z-index: 1000;
                font-weight: 600;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Проект из 3D конструктора загружен! Заполните форму для расчета.';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
            
            setTimeout(() => {
                messageField.style.backgroundColor = '';
                messageField.style.border = '';
            }, 3000);
        }
        
        // Очищаем localStorage после использования
        // localStorage.removeItem('constructorProject');
        // localStorage.removeItem('constructorMessage');
    }
});

// Добавляем анимации если их нет
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}