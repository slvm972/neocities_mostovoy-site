// ============================================
// MAIN.JS — Головна точка входу (ВИПРАВЛЕНО)
// ============================================

console.log('🚀 Ініціалізація сайту (виправлена версія)...');

/**
 * Безпечна перевірка існування модуля
 * @param {string} moduleName - Назва модуля
 * @returns {boolean}
 */
function isModuleLoaded(moduleName) {
  return typeof window[moduleName] !== 'undefined' && window[moduleName] !== null;
}

/**
 * Безпечний виклик методу модуля з fallback
 * @param {string} moduleName - Назва модуля
 * @param {string} methodName - Назва методу
 * @param {Array} args - Аргументи
 * @returns {*}
 */
function safeCall(moduleName, methodName, ...args) {
  if (!isModuleLoaded(moduleName)) {
    console.warn(`⚠️ Модуль ${moduleName} не завантажено`);
    return null;
  }
  
  const module = window[moduleName];
  if (typeof module[methodName] !== 'function') {
    console.warn(`⚠️ Метод ${moduleName}.${methodName}() не існує`);
    return null;
  }
  
  try {
    return module[methodName](...args);
  } catch (error) {
    console.error(`❌ Помилка в ${moduleName}.${methodName}():`, error);
    return null;
  }
}

/**
 * ✅ ВИПРАВЛЕНО: ОСНОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ
 * Виконується поетапно з перевіркою кожного кроку
 */
async function initializeSite() {
  try {
    console.log('📋 Початок ініціалізації...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ Крок 0: Перевірка критичних модулів
    console.log('0️⃣ Перевірка завантаження модулів...');
    const requiredModules = [
      'DataLoader',
      'LanguageManager', 
      'MediaManager', 
      'ModalManager', 
      'UIManager'
    ];
    
    const missingModules = requiredModules.filter(name => !isModuleLoaded(name));
    
    if (missingModules.length > 0) {
      console.error('❌ КРИТИЧНА ПОМИЛКА: Не завантажені модулі:', missingModules);
      console.error('💡 Перезавантажте сторінку або перевірте файли скриптів');
      return;
    }
    
    console.log('   ✅ Всі критичні модулі завантажені');
    
    // ✅ Крок 1: Перевірка версії даних
    console.log('1️⃣ Перевірка версії даних...');
    if (isModuleLoaded('DataLoader')) {
      await safeCall('DataLoader', 'checkVersion');
      console.log('   ✅ Версія даних перевірена');
    }
    
    // ✅ Крок 2: Ініціалізація мови (ПІСЛЯ завантаження UIManager!)
    console.log('2️⃣ Ініціалізація LanguageManager...');
    if (isModuleLoaded('LanguageManager')) {
      safeCall('LanguageManager', 'init');
      console.log('   ✅ LanguageManager готовий');
    } else {
      console.error('   ❌ LanguageManager не завантажено');
    }
    
    // ✅ Крок 3: Завантаження даних (CHUNK-BASED)
    console.log('3️⃣ Завантаження даних...');
    if (isModuleLoaded('MediaManager')) {
      await safeCall('MediaManager', 'loadData');
      console.log('   ✅ MediaManager готовий (індекси завантажені)');
    } else {
      console.error('   ❌ MediaManager не завантажено - контент не буде відображатися');
    }
    
    // ✅ Крок 4: Рендеринг новин
    console.log('4️⃣ Рендеринг новин...');
    if (isModuleLoaded('MediaManager')) {
      safeCall('MediaManager', 'renderNews');
      console.log('   ✅ Новини відображені');
    }
    
    // ✅ Крок 5: Ініціалізація UI
    console.log('5️⃣ Ініціалізація UIManager...');
    if (isModuleLoaded('UIManager')) {
      safeCall('UIManager', 'init');
      console.log('   ✅ UIManager готовий');
    } else {
      console.error('   ❌ UIManager не завантажено - кнопки мов не працюватимуть');
    }
    
    // ✅ Крок 6: Ініціалізація модальних вікон
    console.log('6️⃣ Ініціалізація ModalManager...');
    if (isModuleLoaded('ModalManager')) {
      safeCall('ModalManager', 'init');
      console.log('   ✅ ModalManager готовий');
    } else {
      console.error('   ❌ ModalManager не завантажено - модальні вікна не працюватимуть');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Ініціалізація завершена!');
    
    // ✅ Статистика
    if (isModuleLoaded('MediaManager')) {
      const data = window.MediaManager.data || {};
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 СТАТИСТИКА САЙТУ:');
      console.log(`   📖 Віршів (індекс): ${data.poetry?.length || 0}`);
      console.log(`   🎵 Треків: ${data.tracks?.length || 0}`);
      console.log(`   🎬 Відео: ${data.videos?.length || 0}`);
      console.log(`   📰 Новин: ${data.news?.length || 0}`);
      if (isModuleLoaded('LanguageManager')) {
        console.log(`   🌐 Мова: ${window.LanguageManager.currentLang || 'невідома'}`);
      }
      if (isModuleLoaded('DataLoader')) {
        const version = window.DataLoader.currentVersion;
        console.log(`   🔢 Версія даних: ${version || 'невідома'}`);
        
        // Статистика localStorage
        const stats = window.DataLoader.getStorageStats();
        console.log(`   💾 localStorage: ${stats.totalKB} KB / ${stats.maxKB} KB`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
  } catch (error) {
    console.error('❌ Критична помилка ініціалізації:', error);
    console.error('💡 Спробуйте перезавантажити сторінку');
    
    // Показуємо користувачу повідомлення про помилку
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Помилка завантаження</h2>
          <p style="margin-bottom: 20px;">Виникла помилка при завантаженні сайту.</p>
          <button 
            onclick="location.reload()" 
            style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            🔄 Перезавантажити сторінку
          </button>
        </div>
      `;
    }
  }
}

/**
 * ✅ ВИПРАВЛЕНО: Запуск після завантаження DOM
 * Використовуємо більш надійний метод
 */
if (document.readyState === 'loading') {
  // DOM ще не готовий
  document.addEventListener('DOMContentLoaded', initializeSite);
} else {
  // DOM вже завантажений - запускаємо одразу
  initializeSite();
}

/**
 * ✅ Глобальні обробники помилок
 */
window.addEventListener('error', (event) => {
  console.error('🔴 Глобальна помилка:', event.error);
  console.error('   Файл:', event.filename);
  console.error('   Рядок:', event.lineno + ':' + event.colno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Необроблений Promise rejection:', event.reason);
});

console.log('✅ main.js завантажено (ВИПРАВЛЕНА ВЕРСІЯ)');