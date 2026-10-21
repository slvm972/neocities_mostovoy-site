// ============================================
// UIMANAGER.JS — З DRAGGABLE КНОПКОЮ (СПРОЩЕНА ВЕРСІЯ)
// ============================================

if (typeof window.UIManager === 'undefined') {
  window.UIManager = {
  
  // ✅ Стан для draggable кнопки
  supportButton: {
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startBottom: 0,
    hasMoved: false // Відстежуємо чи була кнопка переміщена
  },
  
  init() {
    console.log('🎨 Ініціалізація UIManager...');
    
    this.renderLanguageButtons();
    this.renderSupportButton();
    this.setupSupportButtonDrag(); // ✅ Draggable на всіх пристроях
    this.setupEasterEgg();
    
    console.log('✅ UIManager ініціалізовано');
  },

  renderLanguageButtons() {
    const container = document.getElementById('langButtons');
    if (!container) {
      console.warn('⚠️ Контейнер langButtons не знайдено');
      return;
    }

    if (typeof LanguageManager === 'undefined') {
      console.error('❌ LanguageManager не завантажено - не можу відрендерити кнопки мов');
      return;
    }

    const languages = [
      { code: 'ru', flag: '🇷🇺', name: 'Русский' },
      { code: 'uk', flag: '🇺🇦', name: 'Українська' },
      { code: 'en', flag: '🇬🇧', name: 'English' },
      { code: 'he', flag: '🇮🇱', name: 'עברית' }
    ];

    const buttonsHtml = languages.map(lang => `
      <button 
        class="lang-btn ${LanguageManager.currentLang === lang.code ? 'active' : ''}" 
        onclick="UIManager.switchLanguage('${lang.code}')"
        data-lang="${lang.code}">
        ${lang.flag} ${lang.name}
      </button>
    `).join('');
    
    container.innerHTML = buttonsHtml;
    console.log(`🌐 Кнопки мов відрендерені, поточна: ${LanguageManager.currentLang}`);
  },

  switchLanguage(lang) {
    console.log(`🌐 Перемикання на мову: ${lang}`);
    
    if (typeof LanguageManager === 'undefined') {
      console.error('❌ LanguageManager не завантажено');
      return;
    }
    
    LanguageManager.switchLanguage(lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const poetryModal = document.getElementById('poetryModal');
    if (poetryModal && poetryModal.style.display === 'block') {
      console.log('📖 Оновлення модального вікна поезії після зміни мови');
      
      if (typeof MediaManager !== 'undefined' && MediaManager.loadCollectionFilter && MediaManager.renderPoetryModal) {
        requestAnimationFrame(() => {
          MediaManager.loadCollectionFilter();
          MediaManager.renderPoetryModal();
        });
      } else {
        console.warn('⚠️ MediaManager недоступний - не можу оновити модальне вікно');
      }
    }

    this.renderSupportButton();

    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.pushState({}, '', url);

    console.log(`✅ Мова змінена на: ${lang}`);
  },

  /**
   * ✅ Рендеринг кнопки підтримки з drag handle
   */
  renderSupportButton() {
    if (typeof LanguageManager === 'undefined') {
      console.warn('⚠️ LanguageManager недоступний для кнопки підтримки');
      return;
    }
    
    const container = document.getElementById('support-button-container');
    if (!container) {
      console.warn('⚠️ Контейнер кнопки підтримки не знайдено');
      return;
    }
    
    const title = LanguageManager.get('supportTitle');
    const text = LanguageManager.get('supportText');
    const isRTL = LanguageManager.currentLang === 'he';
    
    container.innerHTML = `
      <a 
        href="https://ko-fi.com/L3L11T20B5" 
        target="_blank" 
        class="support-floating-button"
        dir="${isRTL ? 'rtl' : 'ltr'}"
        title="${this.escapeHtml(text)}"
        id="support-button-link">
        <span class="support-drag-handle">⋮⋮</span>
        <div class="support-icon">☕</div>
        <div class="support-content">
          <div class="support-title">${this.escapeHtml(title)}</div>
          <div class="support-text">${this.escapeHtml(text)}</div>
        </div>
      </a>
    `;
    
    console.log(`☕ Кнопка підтримки відрендерена: "${title}"`);
    
    // Перевстановлюємо drag listeners після ре-рендеру
    setTimeout(() => this.setupSupportButtonDrag(), 100);
  },

  /**
   * ✅ Налаштування draggable (працює на всіх пристроях)
   */
  setupSupportButtonDrag() {
    const container = document.getElementById('support-button-container');
    if (!container) {
      console.warn('⚠️ Контейнер кнопки не знайдено для draggable');
      return;
    }
    
    // Видаляємо старі listeners якщо є
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    
    const freshContainer = document.getElementById('support-button-container');
    
    // Touch events (мобільні)
    freshContainer.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
    freshContainer.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
    freshContainer.addEventListener('touchend', (e) => this.handleDragEnd(e), { passive: false });
    
    // Mouse events (десктоп)
    freshContainer.addEventListener('mousedown', (e) => this.handleDragStart(e));
    document.addEventListener('mousemove', (e) => this.handleDragMove(e));
    document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
    
    console.log('✅ Draggable кнопка підтримки активована (всі пристрої)');
  },

  /**
   * ✅ Початок перетягування
   */
  handleDragStart(e) {
    const container = document.getElementById('support-button-container');
    if (!container) return;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    this.supportButton.isDragging = true;
    this.supportButton.hasMoved = false;
    this.supportButton.startX = clientX;
    this.supportButton.startY = clientY;
    
    const rect = container.getBoundingClientRect();
    this.supportButton.startLeft = rect.left;
    this.supportButton.startBottom = window.innerHeight - rect.bottom;
    
    container.classList.add('dragging');
    
    // Запобігаємо відкриттю посилання
    e.preventDefault();
  },

  /**
   * ✅ Процес перетягування
   */
  handleDragMove(e) {
    if (!this.supportButton.isDragging) return;
    
    const container = document.getElementById('support-button-container');
    if (!container) return;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - this.supportButton.startX;
    const deltaY = clientY - this.supportButton.startY;
    
    // Позначаємо що була переміщена якщо зміщення > 5px
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.supportButton.hasMoved = true;
    }
    
    const newLeft = this.supportButton.startLeft + deltaX;
    const newBottom = this.supportButton.startBottom - deltaY;
    
    // Обмеження по краях
    const rect = container.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 10;
    const maxBottom = window.innerHeight - rect.height - 10;
    
    const boundedLeft = Math.max(10, Math.min(newLeft, maxLeft));
    const boundedBottom = Math.max(10, Math.min(newBottom, maxBottom));
    
    container.style.left = `${boundedLeft}px`;
    container.style.bottom = `${boundedBottom}px`;
    container.style.right = 'auto';
    container.style.top = 'auto';
    
    e.preventDefault();
  },

  /**
   * ✅ Кінець перетягування
   */
  handleDragEnd(e) {
    if (!this.supportButton.isDragging) return;
    
    const container = document.getElementById('support-button-container');
    if (!container) return;
    
    this.supportButton.isDragging = false;
    container.classList.remove('dragging');
    
    // ✅ РОЗУМНЕ ПРИЛИПАННЯ: тільки до лівого/правого краю (не верх/низ)
    this.snapToVerticalEdge(container);
    
    // Якщо це був просто клік (без переміщення) - дозволяємо відкрити посилання
    if (!this.supportButton.hasMoved) {
      // Посилання відкриється автоматично (не блокуємо default)
      const link = container.querySelector('.support-floating-button');
      if (link && e.type === 'mouseup') {
        // Для mouse events - симулюємо клік
        window.open(link.href, '_blank');
      }
    }
  },

  /**
   * ✅ ОПТИМІЗОВАНЕ: Прилипання тільки до лівого/правого краю
   * Верх/низ залишаємо як є - так користувач сам вибирає висоту
   */
  snapToVerticalEdge(container) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const screenWidth = window.innerWidth;
    
    // Визначаємо до якого краю ближче
    const snapToLeft = centerX < screenWidth / 2;
    
    // Прилипаємо тільки ліворуч або праворуч
    if (snapToLeft) {
      container.style.left = '10px';
      container.style.right = 'auto';
    } else {
      container.style.right = '10px';
      container.style.left = 'auto';
    }
    
    // Верх/низ НЕ чіпаємо - залишаємо як є
    // Це дає користувачу повний контроль по вертикалі
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  setupEasterEgg() {
    const title = document.getElementById('mainTitle');
    if (!title) return;
    
    title.addEventListener('click', () => {
      let stats = '📊 Статистика сайту:\n━━━━━━━━━━━━━━━━━━━\n';
      
      if (typeof MediaManager !== 'undefined' && MediaManager.data) {
        stats += `📖 Віршів: ${MediaManager.data.poetry?.length || 0}\n`;
        stats += `🎵 Треків: ${MediaManager.data.tracks?.length || 0}\n`;
        stats += `🎬 Відео: ${MediaManager.data.videos?.length || 0}\n`;
        stats += `📰 Новин: ${MediaManager.data.news?.length || 0}\n`;
      } else {
        stats += '⚠️ MediaManager недоступний\n';
      }
      
      if (typeof LanguageManager !== 'undefined') {
        stats += `🌐 Поточна мова: ${LanguageManager.currentLang}\n`;
      }
      
      if (typeof DataLoader !== 'undefined') {
        const version = DataLoader.currentVersion;
        stats += `🔢 Версія даних: ${version || 'невідома'}\n`;
        
        const storageStats = DataLoader.getStorageStats();
        stats += `💾 localStorage: ${storageStats.totalKB} KB / ${storageStats.maxKB} KB\n`;
      }
      
      stats += '━━━━━━━━━━━━━━━━━━━';
      
      alert(stats);
    });
  }
};
}

console.log('✅ UIManager завантажено (DRAGGABLE НА ВСІХ ПРИСТРОЯХ)');