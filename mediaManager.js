// ============================================
// MEDIAMANAGER.JS — Чанкованная загрузка контента
// ============================================

// ✅ ИСПРАВЛЕНО: Безопасное объявление без дубликатов
if (typeof window.MediaManager === 'undefined') {
  window.MediaManager = {
  data: {
    news: [],
    tracks: [],
    videos: [],
    poetry: [] // Только индекс БЕЗ полных текстов
  },

  currentCollectionFilter: 'all',
  
  /**
   * Кеш загруженных чанков
   * Структура: { "ru-1": [...poems with text...], "uk-1": [...] }
   */
  loadedChunks: {},

  /**
   * Основной метод загрузки данных
   */
  async loadData() {
    console.log('🔥 Початок завантаження даних (chunk-based)...');
    
    try {
      // 1. Проверяем версию и очищаем кеш если нужно
      await DataLoader.checkVersion();
      
      // 2. Пробуем загрузить из кеша
      const cachedPoetry = DataLoader.getCachedPoetryIndex();
      const cachedNews = DataLoader.getCachedNews();
      const cachedMedia = DataLoader.getCachedMedia();
      
      if (cachedPoetry && cachedNews && cachedMedia) {
        console.log('💾 Використовуємо дані з кешу');
        this.data.poetry = cachedPoetry;
        this.data.news = cachedNews;
        this.data.tracks = cachedMedia.tracks || [];
        this.data.videos = cachedMedia.videos || [];
        this.logDataStats();
        return;
      }
      
      // 3. Загружаем индексные файлы с сервера
      console.log('🌐 Завантаження індексних файлів з сервера...');
      
      // Параллельная загрузка всех индексов
      const [poetryIndex, news, media] = await Promise.all([
        DataLoader.loadJSON('poetry-index.json'),
        DataLoader.loadJSON('news.json'),
        DataLoader.loadJSON('media.json')
      ]);
      
      // 4. Сохраняем данные
      this.data.poetry = Array.isArray(poetryIndex) ? poetryIndex : [];
      this.data.news = Array.isArray(news) ? news : [];
      this.data.tracks = media.tracks || [];
      this.data.videos = media.videos || [];
      
      console.log('✅ Індексні файли завантажені');
      this.logDataStats();
      
      // 5. Кешируем в localStorage
      DataLoader.cachePoetryIndex(this.data.poetry);
      DataLoader.cacheNews(this.data.news);
      DataLoader.cacheMedia({ tracks: this.data.tracks, videos: this.data.videos });
      
    } catch (error) {
      console.error('❌ Помилка завантаження даних:', error);
      
      // Пробуем загрузить хоть что-то из кеша
      const cachedPoetry = DataLoader.getCachedPoetryIndex();
      const cachedNews = DataLoader.getCachedNews();
      const cachedMedia = DataLoader.getCachedMedia();
      
      if (cachedPoetry || cachedNews || cachedMedia) {
        console.warn('⚠️ Використовуємо застарілі дані з кешу');
        this.data.poetry = cachedPoetry || [];
        this.data.news = cachedNews || [];
        this.data.tracks = cachedMedia?.tracks || [];
        this.data.videos = cachedMedia?.videos || [];
        this.logDataStats();
      } else {
        console.error('🔴 Немає даних для відображення');
        this.data = { news: [], tracks: [], videos: [], poetry: [] };
      }
    }
  },

  /**
   * Загружает чанк с полными текстами стихов
   * @param {string} chunkName - Имя чанка (например, "ru-1")
   * @returns {Promise<Array>} - Массив стихов с текстами
   */
  async loadChunk(chunkName) {
    // Проверяем кеш в памяти
    if (this.loadedChunks[chunkName]) {
      console.log(`💾 Чанк "${chunkName}" вже в пам'яті`);
      return this.loadedChunks[chunkName];
    }
    
    try {
      console.log(`📥 Завантаження чанку: ${chunkName}.json`);
      
      // ✅ ВИПРАВЛЕНО: Передаємо isChunk=true для завантаження з poetry-chunks/
      const chunkData = await DataLoader.loadJSON(`${chunkName}.json`, true);
      
      if (!Array.isArray(chunkData)) {
        throw new Error(`Чанк ${chunkName} має некоректний формат (очікується масив)`);
      }
      
      // Сохраняем в кеш памяти
      this.loadedChunks[chunkName] = chunkData;
      
      console.log(`✅ Чанк "${chunkName}" завантажено (${chunkData.length} віршів)`);
      
      return chunkData;
      
    } catch (error) {
      console.error(`❌ Помилка завантаження чанку "${chunkName}":`, error);
      throw error;
    }
  },

  /**
   * Получает полный текст стихотворения (с подгрузкой чанка если нужно)
   * @param {string} poemId - ID стихотворения
   * @returns {Promise<Object|null>} - Полный объект стиха с текстом
   */
  async getPoemFullText(poemId) {
    // 1. Находим стих в индексе
    const poemIndex = this.data.poetry.find(p => p.id === poemId);
    
    if (!poemIndex) {
      console.error(`❌ Вірш з ID "${poemId}" не знайдено в індексі`);
      return null;
    }
    
    // 2. Проверяем есть ли уже текст (на случай если он был загружен ранее)
    if (poemIndex.text) {
      console.log(`✅ Текст вірша "${poemId}" вже завантажено`);
      return poemIndex;
    }
    
    // 3. Получаем имя чанка
    const chunkName = poemIndex.chunk;
    
    if (!chunkName) {
      console.error(`❌ У вірша "${poemId}" відсутнє поле "chunk"`);
      return null;
    }
    
    // 4. Загружаем чанк
    try {
      const chunkData = await this.loadChunk(chunkName);
      
      // 5. Находим стих в чанке
      const poemWithText = chunkData.find(p => p.id === poemId);
      
      if (!poemWithText || !poemWithText.text) {
        console.error(`❌ Текст вірша "${poemId}" не знайдено в чанку "${chunkName}"`);
        return null;
      }
      
      // 6. Объединяем данные из индекса и чанка
      const fullPoem = {
        ...poemIndex,
        text: poemWithText.text
      };
      
      // 7. Обновляем индекс (чтобы в следующий раз не грузить снова)
      Object.assign(poemIndex, fullPoem);
      
      console.log(`✅ Текст вірша "${poemId}" завантажено з чанку "${chunkName}"`);
      
      return fullPoem;
      
    } catch (error) {
      console.error(`❌ Помилка завантаження тексту вірша "${poemId}":`, error);
      return null;
    }
  },

  /**
   * Получает стих по ID из индекса (БЕЗ текста)
   * @param {string} poemId
   * @returns {Object|null}
   */
  getPoemById(poemId) {
    return this.data.poetry.find(p => p.id === poemId) || null;
  },

  logDataStats() {
    console.log(`📖 Віршів: ${this.data.poetry?.length || 0}`);
    console.log(`🎵 Треків: ${this.data.tracks?.length || 0}`);
    console.log(`🎬 Відео: ${this.data.videos?.length || 0}`);
    console.log(`📰 Новин: ${this.data.news?.length || 0}`);
  },

  renderNews() {
    const el = document.getElementById("newsContent");
    if (!el) return;

    el.innerHTML = "";

    if (!this.data.news || this.data.news.length === 0) {
      el.innerHTML = `<p>${typeof LanguageManager !== 'undefined' ? LanguageManager.get("noNews") : 'Новостей пока нет'}</p>`;
      return;
    }

    const currentLang = typeof LanguageManager !== 'undefined' ? LanguageManager.currentLang : 'ru';

    const newsToShow = this.data.news
      .filter(n => {
        if (n.translations && typeof n.translations === 'object') {
          return n.translations[currentLang] && n.translations[currentLang].trim();
        }
        return n.text;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (newsToShow.length === 0) {
      el.innerHTML = `<p>${typeof LanguageManager !== 'undefined' ? LanguageManager.get("noNews") : 'Новостей пока нет'}</p>`;
      return;
    }

    const newsHtml = newsToShow.map(n => {
      let newsText = '';
      
      if (n.translations && typeof n.translations === 'object') {
        newsText = n.translations[currentLang] || n.translations['ru'] || '';
      } else {
        newsText = n.text || '';
      }

      return `
        <div class="news-item">
          <span class="news-date">${this.escapeHtml(n.date)}</span> ${this.escapeHtml(newsText)}
          ${n.link ? `<a href="${this.escapeHtml(n.link)}" target="_blank">→</a>` : ""}
        </div>
      `;
    }).join('');

    el.innerHTML = newsHtml;

    console.log(`📰 Відображено новин на ${currentLang}: ${newsToShow.length}`);
  },

  renderMusicModal() {
    const el = document.getElementById("musicModalList");
    if (!el) return;

    el.innerHTML = "";

    if (!this.data.tracks || this.data.tracks.length === 0) {
      el.innerHTML = `<p style="text-align:center; color:#999;">Треків ще немає.</p>`;
      return;
    }

    const sorted = [...this.data.tracks].sort((a, b) => (a.order || 999) - (b.order || 999));

    const tracksHtml = sorted.map(t => {
      if (t.audio || t.link) {
        return `
          <div class="media-item" style="display: block;">
            ${typeof AudioPlayer !== 'undefined' 
              ? AudioPlayer.createPlayer(t)
              : `
                <div class="media-item-title">${this.escapeHtml(t.title)}</div>
                <a href="${this.escapeHtml(t.link || t.audio)}" target="_blank" class="media-item-link">
                  ${typeof LanguageManager !== 'undefined' ? LanguageManager.get("listen") : 'Слухати'}
                </a>
              `
            }
          </div>
        `;
      } else {
        return `
          <div class="media-item">
            <div class="media-item-title">${this.escapeHtml(t.title)}</div>
            <p style="color:#999; font-size:13px;">⚠️ Аудіо недоступне</p>
          </div>
        `;
      }
    }).join('');

    el.innerHTML = tracksHtml;

    console.log(`🎵 Відображено треків: ${sorted.length}`);
  },

  renderVideoModal() {
    const el = document.getElementById("videoModalList");
    if (!el) return;

    el.innerHTML = "";

    if (!this.data.videos || this.data.videos.length === 0) {
      el.innerHTML = `<p style="text-align:center; color:#999;">Відео ще немає.</p>`;
      return;
    }

    const sorted = [...this.data.videos].sort((a, b) => (a.order || 999) - (b.order || 999));

    const grid = document.createElement('div');
    grid.className = 'video-grid';

    sorted.forEach(v => {
      const youtubeId = v.youtubeId || (typeof extractYouTubeId !== 'undefined' ? extractYouTubeId(v.link) : null);
      
      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';

      if (youtubeId) {
        videoCard.innerHTML = `
          <div class="video-container-16-9">
            ${typeof createYouTubeEmbed !== 'undefined' 
              ? createYouTubeEmbed(youtubeId, { aspectRatio: '16/9' })
              : `<p style="padding:20px; text-align:center; color:#666;">⚠️ YouTube функція недоступні</p>`
            }
          </div>
          <div style="padding: 15px;">
            <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">
              ${this.escapeHtml(v.title)}
            </h4>
            <a href="${this.escapeHtml(v.link)}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 14px;">
              🔗 Відкрити на YouTube
            </a>
          </div>
        `;
      } else {
        videoCard.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
              ${this.escapeHtml(v.title)}
            </h4>
            <a href="${this.escapeHtml(v.link)}" target="_blank" class="media-item-link">
              ${typeof LanguageManager !== 'undefined' ? LanguageManager.get("watch") : 'Дивитись'}
            </a>
          </div>
        `;
      }

      grid.appendChild(videoCard);
    });

    el.appendChild(grid);
    console.log(`🎬 Відображено відео: ${sorted.length}`);
  },

  loadCollectionFilter() {
    const container = document.getElementById("poetryCollectionFilter");
    if (!container) {
      console.warn('⚠️ Контейнер poetryCollectionFilter не знайдено');
      return;
    }

    const currentLang = typeof LanguageManager !== 'undefined' ? LanguageManager.currentLang : 'ru';
    console.log(`📚 Завантаження фільтрів для мови: ${currentLang}`);

    container.innerHTML = '';

    const poemsInCurrentLang = this.data.poetry.filter(p => 
      p.lang && p.lang.toLowerCase().startsWith(currentLang.toLowerCase())
    );
    
    if (poemsInCurrentLang.length === 0) {
      console.warn(`⚠️ Немає віршів мовою ${currentLang}`);
      container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#999; padding:20px;">Немає віршів цією мовою.</p>`;
      return;
    }

    const collections = [...new Set(
      poemsInCurrentLang
        .map(p => p.collection)
        .filter(Boolean)
    )].sort();

    const collectionCounts = {};
    collections.forEach(c => {
      collectionCounts[c] = poemsInCurrentLang.filter(p => p.collection === c).length;
    });

    const buttonsHtml = [];

    buttonsHtml.push(`
      <button 
        class="collection-filter-btn ${this.currentCollectionFilter === 'all' ? 'active' : ''}" 
        onclick="MediaManager.setCollectionFilter('all')">
        <span class="collection-icon">📚</span>
        <span class="collection-name">${typeof LanguageManager !== 'undefined' ? LanguageManager.get("allCollections") : 'Всі збірки'}</span>
        <span class="collection-count">${poemsInCurrentLang.length}</span>
      </button>
    `);

    collections.forEach(c => {
      buttonsHtml.push(`
        <button 
          class="collection-filter-btn ${this.currentCollectionFilter === c ? 'active' : ''}" 
          onclick="MediaManager.setCollectionFilter('${this.escapeForJs(c)}')">
          <span class="collection-icon">📖</span>
          <span class="collection-name">${this.escapeHtml(c)}</span>
          <span class="collection-count">${collectionCounts[c]}</span>
        </button>
      `);
    });

    container.innerHTML = buttonsHtml.join('');

    console.log(`📚 Створено кнопок: ${collections.length + 1} (+ "Всі збірки")`);
  },

  setCollectionFilter(collection) {
    console.log(`🔍 Фільтр встановлено: ${collection}`);
    this.currentCollectionFilter = collection;
    this.loadCollectionFilter();
    this.renderPoetryModal();
  },

  renderPoetryModal() {
    const container = document.getElementById("poetryListContainer");
    const search = document.getElementById("poetrySearchInput");

    if (!container) {
      console.warn('⚠️ Контейнер poetryListContainer не знайдено');
      return;
    }

    if (!search) {
      console.warn('⚠️ Поле пошуку poetrySearchInput не знайдено');
      return;
    }

    const currentLang = typeof LanguageManager !== 'undefined' ? LanguageManager.currentLang : 'ru';
    console.log(`📖 Рендер списку віршів для мови: ${currentLang}`);

    const render = () => {
      const q = search.value.toLowerCase();
      const col = this.currentCollectionFilter;

      const list = this.data.poetry.filter(p => {
        const matchText = (p.title && p.title.toLowerCase().includes(q));
        const matchCol = col === "all" || p.collection === col;
        const matchLang = p.lang && p.lang.toLowerCase().startsWith(currentLang.toLowerCase());

        return matchText && matchCol && matchLang;
      });

      list.sort((a, b) => {
        if (!a.date_published) return 1;
        if (!b.date_published) return -1;
        return new Date(b.date_published) - new Date(a.date_published);
      });

      if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; padding:20px;">Не знайдено віршів.</p>`;
        return;
      }

      const poemsHtml = list.map(p => {
        const date = p.date_published ? new Date(p.date_published).toLocaleDateString('uk-UA') : '';
        const hasTranslations = p.translations && p.translations.length > 0;
        const translationsIcon = hasTranslations ? ' 🌐' : '';
        const hasAudio = p.audio ? ' 🔊' : '';
        const hasVideo = p.youtubeId ? ' 🎬' : '';
        
        return `
          <div class="poem-list-item" onclick="ModalManager.openPoemView('${p.id}')">
            <div class="poem-item-title">📖 ${this.escapeHtml(p.title)}${translationsIcon}${hasAudio}${hasVideo}</div>
            ${date ? `<div class="poem-item-date">${date}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = poemsHtml;

      console.log(`📖 Відображено віршів: ${list.length}`);
    };

    search.oninput = render;
    render();
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  escapeForJs(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  }
};
}

console.log('✅ MediaManager завантажено (ВИПРАВЛЕНО - видалено дублікат)');
