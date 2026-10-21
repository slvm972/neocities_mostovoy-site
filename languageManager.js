// ============================================
// LANGUAGEMANAGER.JS - Управління мовами (АВТОНОМНИЙ)
// ============================================

if (typeof window.LanguageManager === 'undefined') {
  window.LanguageManager = {
  currentLang: 'ru',

  // ✅ Посилання на Stihi.ru для різних мов
  stihiLinks: {
    ru: 'https://stihi.ru/avtor/slvm3',           // Основний профіль (всі вірші)
    uk: 'https://stihi.ru/avtor/slvm3&book=8#8',  // Збірка українською
    en: 'https://stihi.ru/avtor/slvm3&book=6#6',  // Збірка англійською/івритом
    he: 'https://stihi.ru/avtor/slvm3&book=6#6'   // Збірка англійською/івритом
  },

  init() {
    console.log('🌐 Ініціалізація LanguageManager...');
    this.currentLang = this.detectBrowserLanguage();
    this.switchLanguage(this.currentLang);
    console.log(`✅ Встановлено мову: ${this.currentLang}`);
  },

  detectBrowserLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && ['ru', 'uk', 'en', 'he'].includes(langFromUrl)) {
      return langFromUrl;
    }
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    return ['ru', 'uk', 'en', 'he'].includes(browserLang) ? browserLang : 'ru';
  },

  get(key) {
    return translations[this.currentLang][key] || key;
  },

  // ✅ НОВИЙ МЕТОД: Отримання посилання на Stihi.ru для поточної мови
  getStihiLink() {
    return this.stihiLinks[this.currentLang] || this.stihiLinks.ru;
  },

  switchLanguage(lang) {
    this.currentLang = lang;
    const textDir = lang === 'he' ? 'rtl' : 'ltr';

    // Заголовки та основні блоки
    const mainTitle = document.getElementById('mainTitle');
    const subtitle = document.getElementById('subtitle');
    const poetryTitle = document.getElementById('poetryTitle');
    const musicTitle = document.getElementById('musicTitle');
    const videoTitle = document.getElementById('videoTitle');
    const followTitle = document.getElementById('followTitle');
    const newsTitle = document.getElementById('newsTitle');

    if (mainTitle) mainTitle.textContent = this.get('mainTitle');
    if (subtitle) subtitle.textContent = this.get('subtitle');
    if (poetryTitle) poetryTitle.textContent = this.get('poetryTitle');
    if (musicTitle) musicTitle.textContent = this.get('musicTitle');
    if (videoTitle) videoTitle.textContent = this.get('videoTitle');
    if (followTitle) followTitle.textContent = this.get('followTitle');
    if (newsTitle) newsTitle.textContent = this.get('newsBlockTitle');

    // ✅ ОНОВЛЕНО: Поезія з мовним посиланням
    const poetryTextEl = document.getElementById('poetryText');
    if (poetryTextEl) {
      poetryTextEl.innerHTML = this.get('poetryText').replace(
        'Stihi.ru',
        `<a href="${this.getStihiLink()}" target="_blank">Stihi.ru</a>`
      );
      poetryTextEl.dir = textDir;
    }

    const viewPoetryBtn = document.getElementById('viewPoetryBtn');
    const poetryExternalLink = document.getElementById('poetryExternalLink');
    if (viewPoetryBtn) viewPoetryBtn.textContent = this.get('viewPoetry');
    
    // ✅ ОНОВЛЕНО: Зовнішнє посилання на Stihi.ru
    if (poetryExternalLink) {
      poetryExternalLink.textContent = this.get('externalLinkPoetry');
      poetryExternalLink.href = this.getStihiLink();
    }

    // Музика
    const musicTextEl = document.getElementById('musicText');
    if (musicTextEl) {
      musicTextEl.innerHTML = this.get('musicText').replace(
        'SoundCloud',
        '<a href="https://soundcloud.com/slava-mostovoy" target="_blank">SoundCloud</a>'
      );
      musicTextEl.dir = textDir;
    }
    
    const openMusicModalBtn = document.getElementById('openMusicModalBtn');
    const musicExternalLink = document.getElementById('musicExternalLink');
    if (openMusicModalBtn) openMusicModalBtn.textContent = this.get('viewAllMusic');
    if (musicExternalLink) musicExternalLink.textContent = this.get('externalLinkMusic');

    // Відео
    const videoTextEl = document.getElementById('videoText');
    if (videoTextEl) {
      videoTextEl.innerHTML = this.get('videoText').replace(
        'YouTube',
        '<a href="https://www.youtube.com/@slvm3" target="_blank">YouTube</a>'
      );
      videoTextEl.dir = textDir;
    }
    
    const openVideoModalBtn = document.getElementById('openVideoModalBtn');
    const videoExternalLink = document.getElementById('videoExternalLink');
    if (openVideoModalBtn) openVideoModalBtn.textContent = this.get('viewAllVideos');
    if (videoExternalLink) videoExternalLink.textContent = this.get('externalLinkVideo');

    // Блок "Слідкуйте за новими публікаціями"
    const followTextEl = document.getElementById('followText');
    if (followTextEl) {
      followTextEl.innerHTML = `
        ${this.get('followText').replace(
          'Facebook',
          '<a href="https://facebook.com/slava.mostovoy" target="_blank">Facebook</a>'
        )}
        <a href="mailto:slvm972@gmail.com">slvm972@gmail.com</a>, 
        <a href="mailto:slvm3@yandex.ru">slvm3@yandex.ru</a>, 
        <a href="mailto:slvm3@hotmail.com">slvm3@hotmail.com</a>.
      `;
      followTextEl.dir = textDir;
    }

    // ✅ ВИПРАВЛЕНО: Безпечне оновлення новин (перевіряємо MediaManager)
    if (typeof MediaManager !== 'undefined' && MediaManager.renderNews) {
      MediaManager.renderNews();
    }

    // Атрибути напрямку та мови документа
    document.documentElement.dir = textDir;
    document.documentElement.lang = lang;
    document.body.dir = textDir;

    // Тексти в модалках
    this.updateModalTranslations();
  },

  updateModalTranslations() {
    // Модалка поезії
    const poetryModalTitle = document.getElementById('poetryModalTitle');
    const poetrySearchInput = document.getElementById('poetrySearchInput');
    const poetryCollectionLabel = document.getElementById('poetryCollectionLabel');
    
    if (poetryModalTitle) poetryModalTitle.textContent = this.get('poetryModalTitle');
    if (poetrySearchInput) poetrySearchInput.placeholder = this.get('searchPlaceholder');
    if (poetryCollectionLabel) poetryCollectionLabel.textContent = this.get('collectionLabel');
    
    // Модалка музики
    const musicModalTitle = document.getElementById('musicModalTitle');
    const musicModalLink = document.getElementById('musicModalLink');
    if (musicModalTitle) musicModalTitle.textContent = this.get('viewAllMusic');
    if (musicModalLink) musicModalLink.textContent = '→ ' + this.get('myProfile') + ' на SoundCloud';
    
    // Модалка відео
    const videoModalTitle = document.getElementById('videoModalTitle');
    const videoModalLink = document.getElementById('videoModalLink');
    if (videoModalTitle) videoModalTitle.textContent = this.get('viewAllVideos');
    if (videoModalLink) videoModalLink.textContent = '→ ' + this.get('myChannel') + ' на YouTube';
    
    // Кнопки закриття
    const closePoetryModalBtn = document.getElementById('closePoetryModalBtn');
    const closeMusicModalBtn = document.getElementById('closeMusicModalBtn');
    const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
    const closePoemViewBtn = document.getElementById('closePoemViewBtn');
    const backToPoemListBtn = document.getElementById('backToPoemListBtn');
    const poetryModalStihiLink = document.getElementById('poetryModalStihiLink');
    
    if (closePoetryModalBtn) closePoetryModalBtn.textContent = '✕';
    if (closeMusicModalBtn) closeMusicModalBtn.textContent = '✕';
    if (closeVideoModalBtn) closeVideoModalBtn.textContent = '✕';
    if (closePoemViewBtn) closePoemViewBtn.textContent = '✕';
    if (backToPoemListBtn) backToPoemListBtn.textContent = this.get('backToList');
    
    // ✅ ОНОВЛЕНО: Посилання в модалці поезії
    if (poetryModalStihiLink) {
      poetryModalStihiLink.textContent = '→ ' + this.get('myProfile') + ' на Stihi.ru';
      poetryModalStihiLink.href = this.getStihiLink();
    }
  }
};
}

console.log('✅ LanguageManager завантажено (АВТОНОМНИЙ)');