// ============================================
// MODALMANAGER.JS — Управління модальними вікнами (З ЧАНКАМИ)
// ============================================

if (typeof window.ModalManager === 'undefined') {
  window.ModalManager = {
  init() {
    console.log('🎭 Ініціалізація ModalManager...');
    
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });

    const closeBtns = [
      { id: 'closeMusicModalBtn', modalId: 'musicModal' },
      { id: 'closeVideoModalBtn', modalId: 'videoModal' },
      { id: 'closePoetryModalBtn', modalId: 'poetryModal' },
      { id: 'closePoemViewBtn', modalId: 'poemViewModal' }
    ];

    closeBtns.forEach(({ id, modalId }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => this.closeModal(modalId);
      }
    });

    const backBtn = document.getElementById('backToPoemListBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        this.closeModal('poemViewModal');
        this.openPoetryModal();
      };
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    console.log('✅ ModalManager ініціалізовано');
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
    document.body.style.overflow = '';
  },

  openMusicModal() {
    MediaManager.renderMusicModal();
    this.openModal('musicModal');
  },

  openVideoModal() {
    MediaManager.renderVideoModal();
    this.openModal('videoModal');
  },

  openPoetryModal() {
    this.openModal('poetryModal');
    
    setTimeout(() => {
      if (typeof MediaManager !== 'undefined') {
        MediaManager.loadCollectionFilter();
        MediaManager.renderPoetryModal();
        console.log('📖 Фільтри та список поезії завантажені');
      }
    }, 10);
    
    console.log('📖 Модальне вікно поезії відкрито');
  },

  openVideoView(link, title) {
    const videoId = typeof extractYouTubeId !== 'undefined' ? extractYouTubeId(link) : null;
    if (!videoId) {
      console.error('❌ Не вдалося витягти YouTube ID з посилання:', link);
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    
    const modalHtml = `
      <div class="modal" id="videoViewModal" style="display:block;">
        <div class="modal-content video-modal-wide">
          <div class="modal-header">
            <h2>${typeof escapeHtml !== 'undefined' ? escapeHtml(title) : title}</h2>
            <button class="close-btn" onclick="document.getElementById('videoViewModal').remove()">✕</button>
          </div>
          <div class="video-container-16-9">
            <iframe 
              src="${embedUrl}" 
              frameborder="0" 
              allow="autoplay; encrypted-media; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('videoViewModal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },

  /**
   * ✅ ОНОВЛЕНО: Відкриття вірша з підтримкою ЧАНКІВ
   * 
   * Алгоритм:
   * 1. Отримуємо базову інформацію з індексу
   * 2. Показуємо loader
   * 3. Завантажуємо чанк з повним текстом
   * 4. Відображаємо вірш
   */
  async openPoemView(poemId) {
    console.log(`📖 Відкриваю вірш: ${poemId}`);
    
    // 1. Получаем базовую информацию из индекса
    const poemIndex = MediaManager.getPoemById(poemId);
    
    if (!poemIndex) {
      console.error(`❌ Вірш з ID "${poemId}" не знайдено в індексі`);
      alert('Помилка: вірш не знайдено');
      return;
    }
    
    // 2. Открываем модальное окно с заголовком
    this.closeModal('poetryModal');
    this.openModal('poemViewModal');
    
    const titleEl = document.getElementById('poemViewTitle');
    if (titleEl) {
      titleEl.textContent = poemIndex.title;
    }
    
    const contentEl = document.getElementById('poemViewContent');
    const translationsEl = document.getElementById('poemTranslations');
    
    // 3. Показываем loader (пока загружается текст)
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; min-height: 300px;">
          <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 20px; color: #666; font-size: 16px;">Завантаження тексту...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      contentEl.dir = poemIndex.lang === 'he' ? 'rtl' : 'ltr';
      contentEl.style.textAlign = poemIndex.lang === 'he' ? 'right' : 'left';
    }
    
    // Очищаем переводы пока грузится текст
    if (translationsEl) {
      translationsEl.innerHTML = '';
    }
    
    // 4. Загружаем полный текст из чанка
    try {
      const fullPoem = await MediaManager.getPoemFullText(poemId);
      
      if (!fullPoem || !fullPoem.text) {
        throw new Error('Текст вірша не знайдено в чанку');
      }
      
      console.log(`✅ Текст вірша "${poemIndex.title}" завантажено`);
      
      // 5. Отображаем полный контент
      this.renderPoemContent(fullPoem);
      
    } catch (error) {
      console.error(`❌ Помилка завантаження вірша "${poemId}":`, error);
      
      // Показываем ошибку пользователю
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="padding: 40px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc3545; margin-bottom: 15px;">Не вдалося завантажити текст</h3>
            <p style="color: #666; margin-bottom: 25px;">Можливо, файл тимчасово недоступний.</p>
            <button 
              class="btn-view-all" 
              onclick="ModalManager.closeModal('poemViewModal'); ModalManager.openPoetryModal();"
              style="margin-top: 20px;">
              ← Назад до списку
            </button>
          </div>
        `;
      }
    }
  },

  /**
   * ✅ НОВИЙ МЕТОД: Рендеринг повного вмісту вірша
   */
  renderPoemContent(poem) {
    const contentEl = document.getElementById('poemViewContent');
    const translationsEl = document.getElementById('poemTranslations');
    
    if (!contentEl) return;
    
    // 1. Відео (якщо є)
    const youtubeId = poem.youtubeId || (poem.youtubeVideo && typeof extractYouTubeId !== 'undefined' ? extractYouTubeId(poem.youtubeVideo) : null);
    
    let videoEmbed = '';
    if (youtubeId && typeof isValidYouTubeId !== 'undefined' && isValidYouTubeId(youtubeId)) {
      videoEmbed = `
        <div class="poem-video-container">
          <div class="video-embed-container">
            ${typeof createYouTubeEmbed !== 'undefined' ? createYouTubeEmbed(youtubeId) : `
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${youtubeId}?modestbranding=1&rel=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen
                loading="lazy">
              </iframe>
            `}
          </div>
        </div>
      `;
    }
    
    // 2. Аудіо (якщо є)
    let audioButton = '';
    if (poem.audio && typeof AudioPlayer !== 'undefined') {
      audioButton = AudioPlayer.createPoemButton(poem);
    }
    
    // 3. Текст
    contentEl.innerHTML = `
      ${videoEmbed}
      ${audioButton}
      <div style="margin-top: ${audioButton || videoEmbed ? '20px' : '0'}; white-space: pre-wrap; line-height: 1.8;">
        ${typeof escapeHtml !== 'undefined' ? escapeHtml(poem.text) : poem.text}
      </div>
    `;
    
    contentEl.dir = poem.lang === 'he' ? 'rtl' : 'ltr';
    contentEl.style.textAlign = poem.lang === 'he' ? 'right' : 'left';
    
    // 4. Переклади
    if (translationsEl) {
      this.renderTranslations(poem, translationsEl);
    }
  },

  /**
   * ✅ ВИПРАВЛЕНО: Рендеринг перекладів з правильним визначенням мови
   */
  renderTranslations(poem, translationsEl) {
    translationsEl.innerHTML = '';
    
    const translations = poem.translations || [];
    
    if (translations.length === 0) {
      console.log(`ℹ️ Немає перекладів для "${poem.title}"`);
      return;
    }
    
    console.log(`🌐 Знайдено ${translations.length} перекладів для "${poem.title}"`);
    
    const translationButtons = translations.map(t => {
      let targetPoemId, targetLang, targetLink;
      
      if (typeof t === 'object') {
        targetPoemId = t.poem_id || t.poemId || t.id;
        targetLang = t.lang || null;
        targetLink = t.link || null;
      } else if (typeof t === 'string') {
        targetPoemId = t;
        targetLang = null;
        targetLink = null;
      }
      
      // ✅ ВИПРАВЛЕННЯ: Якщо мова не вказана, намагаємося визначити з ID вірша
      if (!targetLang && targetPoemId && typeof MediaManager !== 'undefined') {
        const targetPoem = MediaManager.getPoemById(targetPoemId);
        if (targetPoem && targetPoem.lang) {
          targetLang = targetPoem.lang;
          console.log(`  → Визначено мову з індексу: ${targetLang}`);
        }
      }
      
      // Якщо мову все одно не визначено, використовуємо 'unknown'
      if (!targetLang) {
        targetLang = 'unknown';
      }
      
      if (targetPoemId) {
        console.log(`  → Переклад ${targetLang}: poem_id = ${targetPoemId}`);
        
        return `
          <button 
            class="lang-link" 
            onclick="ModalManager.openPoemView('${targetPoemId}')"
            type="button">
            ${this.getLangIcon(targetLang)} ${this.getLangName(targetLang)}
          </button>
        `;
      } else if (targetLink) {
        console.log(`  → Переклад ${targetLang}: зовнішнє посилання ${targetLink}`);
        
        return `
          <a 
            href="${typeof escapeHtml !== 'undefined' ? escapeHtml(targetLink) : targetLink}" 
            target="_blank" 
            class="lang-link">
            ${this.getLangIcon(targetLang)} ${this.getLangName(targetLang)} 🔗
          </a>
        `;
      } else {
        console.warn(`⚠️ Переклад без poem_id та link:`, t);
        return '';
      }
    }).filter(Boolean).join('');
    
    if (translationButtons) {
      translationsEl.innerHTML = `
        <div style="border-top: 2px solid #ddd; padding-top: 20px;">
          <h3 style="margin-bottom: 15px;">${LanguageManager.get('readInOtherLangs')}</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${translationButtons}
          </div>
        </div>
      `;
    }
  },

  getLangIcon(lang) {
    const icons = {
      ru: '🇷🇺',
      uk: '🇺🇦',
      en: '🇬🇧',
      he: '🇮🇱',
      unknown: '🌐'
    };
    return icons[lang] || icons.unknown;
  },

  /**
   * ✅ ВИПРАВЛЕНО: getLangName тепер правильно обробляє 'unknown'
   */
  getLangName(lang) {
    // Спочатку перевіряємо чи це 'unknown'
    if (lang === 'unknown') {
      if (typeof LanguageManager !== 'undefined') {
        const currentLang = LanguageManager.currentLang;
        const unknownNames = {
          ru: 'Другой язык',
          uk: 'Інша мова',
          en: 'Other language',
          he: 'שפה אחרת'
        };
        return unknownNames[currentLang] || unknownNames.ru;
      }
      return 'Інша мова';
    }
    
    // Для відомих мов використовуємо LanguageManager
    if (typeof LanguageManager !== 'undefined') {
      const key = 'lang' + lang.charAt(0).toUpperCase() + lang.slice(1);
      const translation = LanguageManager.get(key);
      
      // Якщо переклад знайдено і це не ключ (не починається з 'lang')
      if (translation && !translation.startsWith('lang')) {
        return translation;
      }
    }
    
    // Fallback на назви мов
    const fallbackNames = {
      ru: 'Русский',
      uk: 'Українська',
      en: 'English',
      he: 'עברית'
    };
    
    return fallbackNames[lang] || lang;
  }
};
}

console.log('✅ ModalManager завантажено (з підтримкою ЧАНКІВ і виправленим визначенням мови)');
