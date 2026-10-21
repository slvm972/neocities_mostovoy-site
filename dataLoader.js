// ============================================
// DATALOADER.JS — С ПРИНУДИТЕЛЬНОЙ ОЧИСТКОЙ СТАРОГО КЕША
// ============================================

if (typeof window.DataLoader === 'undefined') {
  window.DataLoader = {
  /**
   * Поточна версія з meta.json
   */
  currentVersion: null,

  /**
   * ✅ ВИПРАВЛЕНО: Базовий шлях до папки data/
   */
  basePath: 'data/',

  /**
   * ✅ ВИПРАВЛЕНО: Шлях до чанків віршів
   */
  chunksPath: 'data/poetry-chunks/',

  /**
   * Отримує URL з параметром версії для обходу кешу
   * @param {string} filename - Ім'я файлу
   * @returns {string} - URL з параметром ?v=
   */
  getVersionedUrl(filename) {
    const version = this.currentVersion || Date.now();
    return `${this.basePath}${filename}?v=${version}`;
  },

  /**
   * ✅ НОВИЙ: Принудительно очищаємо весь старий кеш при першому запуску
   */
  forceCleanOldCache() {
    console.log('🧹 Перевірка та очистка старого кешу...');
    
    // Перевіряємо чи є старий формат siteData
    const hasSiteData = localStorage.getItem('siteData') !== null;
    const hasSiteDataVersion = localStorage.getItem('siteDataVersion') !== null;
    
    if (hasSiteData || hasSiteDataVersion) {
      console.log('🗑️ Виявлено старий формат кешу (siteData) - видаляємо...');
      
      // Видаляємо ВСЕ з localStorage для чистого старту
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        console.log(`  Видалення: ${key}`);
        localStorage.removeItem(key);
      });
      
      console.log('✅ Весь старий кеш очищено');
      return true;
    }
    
    console.log('✅ Старого кешу не виявлено');
    return false;
  },

  /**
   * Завантажує meta.json та перевіряє версію
   * @returns {Promise<number>} - Версія з meta.json
   */
  async checkVersion() {
    try {
      console.log('🔍 Перевірка версії даних...');
      
      // ✅ ДОДАНО: Спочатку очищаємо старий кеш
      this.forceCleanOldCache();
      
      const response = await fetch(this.getVersionedUrl('meta.json'));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const meta = await response.json();
      const serverVersion = meta.version || 0;
      
      console.log(`📦 Версія на сервері: ${serverVersion}`);
      
      const cachedVersion = this.getCachedVersion();
      console.log(`💾 Версія в кеші: ${cachedVersion}`);
      
      // Якщо версії відрізняються — очищаємо кеш
      if (cachedVersion !== serverVersion) {
        console.log(`🔄 Виявлено оновлення: ${cachedVersion} → ${serverVersion}`);
        this.clearCache();
      } else {
        console.log(`✅ Версія актуальна: ${serverVersion}`);
      }
      
      // Зберігаємо поточну версію
      this.currentVersion = serverVersion;
      localStorage.setItem('dataVersion', serverVersion.toString());
      
      return serverVersion;
      
    } catch (error) {
      console.error('❌ Помилка перевірки версії:', error);
      // Якщо meta.json недоступний, використовуємо timestamp
      this.currentVersion = Date.now();
      return this.currentVersion;
    }
  },

  /**
   * Отримує версію з localStorage
   * @returns {number}
   */
  getCachedVersion() {
    const version = localStorage.getItem('dataVersion');
    return version ? parseInt(version) : 0;
  },

  /**
   * Перевіряє чи є дані в кеші
   * @returns {boolean}
   */
  hasCache() {
    return localStorage.getItem('poetryIndex') !== null;
  },

  /**
   * Очищає весь кеш
   */
  clearCache() {
    console.log('🗑️ Очищення кешу...');
    
    const keysToRemove = [
      'dataVersion',
      'poetryIndex',
      'newsData',
      'mediaData',
      // Видаляємо старі ключі якщо вони є
      'siteData',
      'siteDataVersion'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ Кеш очищено');
  },

  /**
   * Зберігає індекс віршів в localStorage
   * @param {Array} poetryIndex
   */
  cachePoetryIndex(poetryIndex) {
    try {
      localStorage.setItem('poetryIndex', JSON.stringify(poetryIndex));
      console.log(`💾 Індекс віршів збережено (${poetryIndex.length} записів)`);
    } catch (error) {
      console.warn('⚠️ Не вдалося зберегти індекс в localStorage:', error);
      // Якщо переповнення — не критично, просто не кешуємо
    }
  },

  /**
   * Отримує індекс віршів з localStorage
   * @returns {Array|null}
   */
  getCachedPoetryIndex() {
    try {
      const data = localStorage.getItem('poetryIndex');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('⚠️ Помилка читання індексу з localStorage:', error);
      return null;
    }
  },

  /**
   * Зберігає новини в localStorage
   * @param {Array} news
   */
  cacheNews(news) {
    try {
      localStorage.setItem('newsData', JSON.stringify(news));
      console.log(`💾 Новини збережено (${news.length} записів)`);
    } catch (error) {
      console.warn('⚠️ Не вдалося зберегти новини:', error);
    }
  },

  /**
   * Отримує новини з localStorage
   * @returns {Array|null}
   */
  getCachedNews() {
    try {
      const data = localStorage.getItem('newsData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('⚠️ Помилка читання новин:', error);
      return null;
    }
  },

  /**
   * Зберігає медіа (треки + відео) в localStorage
   * @param {Object} media
   */
  cacheMedia(media) {
    try {
      localStorage.setItem('mediaData', JSON.stringify(media));
      console.log(`💾 Медіа збережено (${media.tracks?.length || 0} треків, ${media.videos?.length || 0} відео)`);
    } catch (error) {
      console.warn('⚠️ Не вдалося зберегти медіа:', error);
    }
  },

  /**
   * Отримує медіа з localStorage
   * @returns {Object|null}
   */
  getCachedMedia() {
    try {
      const data = localStorage.getItem('mediaData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('⚠️ Помилка читання медіа:', error);
      return null;
    }
  },

  /**
   * ✅ ВИПРАВЛЕНО: Завантажує JSON файл з версійованим URL
   * @param {string} filename - Ім'я файлу
   * @param {boolean} isChunk - Це чанк вірша (з poetry-chunks/)
   * @returns {Promise<any>}
   */
  async loadJSON(filename, isChunk = false) {
    // ✅ Чанки в окремій папці poetry-chunks/
    const basePath = isChunk ? this.chunksPath : this.basePath;
    const version = this.currentVersion || Date.now();
    const url = `${basePath}${filename}?v=${version}`;
    
    console.log(`📥 Завантаження: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },

  /**
   * Отримує статистику використання localStorage
   * @returns {Object}
   */
  getStorageStats() {
    let totalSize = 0;
    const items = {};
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length * 2; // UTF-16
        items[key] = Math.round(size / 1024); // KB
        totalSize += size;
      }
    }
    
    return {
      totalKB: Math.round(totalSize / 1024),
      items: items,
      maxKB: 5120 // Звичайний ліміт ~5MB
    };
  }
  };
}

console.log('✅ DataLoader завантажено (з ПРИНУДИТЕЛЬНОЮ очисткою старого кешу)');