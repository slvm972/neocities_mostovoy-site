// ============================================
// UTILS.JS - Утиліти для сайту (CHROME-СУМІСНА ВЕРСІЯ)
// З НОРМАЛІЗАЦІЄЮ YOUTUBE ПОСИЛАНЬ
// ============================================

/**
 * ✅ НОВА ФУНКЦІЯ: Нормалізує будь-яке YouTube посилання до чистого ID
 * 
 * Приймає:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (11 символів)
 * 
 * Повертає: VIDEO_ID (11 символів) або null
 * 
 * @param {string} input - URL або ID
 * @returns {string|null} - Чистий ID або null
 */
function normalizeYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  // 1. Якщо вже чистий ID (11 символів)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // 2. Якщо це URL з embed (може бути забруднений параметрами)
  if (trimmed.includes('/embed/')) {
    const match = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  
  // 3. Стандартні формати YouTube
  try {
    const url = new URL(trimmed);
    
    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      const id = url.searchParams.get('v');
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    
    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1).split('?')[0].split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    
    // youtube.com/shorts/VIDEO_ID або youtube.com/embed/VIDEO_ID
    if (url.hostname.includes('youtube.com')) {
      const match = url.pathname.match(/\/(shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
      if (match && match[2]) return match[2];
    }
  } catch (e) {
    // Не є валідним URL, пробуємо як простий текст
  }
  
  // 4. Останній шанс: шукаємо 11-символьний ID в тексті
  const match = trimmed.match(/([a-zA-Z0-9_-]{11})/);
  if (match) {
    // Перевіряємо що це справді схоже на YouTube ID (не просто 11 символів)
    const possibleId = match[1];
    if (!/^[0-9-_]{11}$/.test(possibleId)) { // Якщо не тільки цифри та дефіси
      return possibleId;
    }
  }
  
  return null;
}

/**
 * ✅ НОВА ФУНКЦІЯ: Створює строго embed URL для YouTube
 * 
 * @param {string} input - Будь-який формат YouTube посилання/ID
 * @param {Object} options - Параметри embed
 * @returns {string} - https://www.youtube-nocookie.com/embed/VIDEO_ID?params або ''
 */
function normalizeYouTubeEmbedUrl(input, options = {}) {
  const videoId = normalizeYouTubeId(input);
  if (!videoId) {
    console.error('❌ Не вдалося нормалізувати YouTube посилання:', input);
    return '';
  }
  
  const {
    autoplay = false,
    muted = false,
    controls = true,
    modestbranding = true,
    rel = false,
    loop = false,
    start = null,
    end = null
  } = options;
  
  const params = new URLSearchParams({
    origin: window.location.origin,
    enablejsapi: '1',
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    controls: controls ? '1' : '0',
    modestbranding: modestbranding ? '1' : '0',
    rel: rel ? '1' : '0',
    playsinline: '1',
    iv_load_policy: '3',
    fs: '1'
  });
  
  if (loop) {
    params.append('loop', '1');
    params.append('playlist', videoId);
  }
  
  if (start !== null && start > 0) {
    params.append('start', start.toString());
  }
  
  if (end !== null && end > 0) {
    params.append('end', end.toString());
  }
  
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * ✅ ОНОВЛЕНО: Витягує YouTube Video ID (використовує нормалізацію)
 * 
 * @deprecated Використовуйте normalizeYouTubeId() замість цього
 */
function extractYouTubeId(input) {
  console.warn('⚠️ extractYouTubeId() застарів, використовуйте normalizeYouTubeId()');
  return normalizeYouTubeId(input);
}

/**
 * ✅ ОНОВЛЕНО: Створює HTML для вбудованого YouTube плеєра
 * Тепер ЗАВЖДИ нормалізує посилання
 * 
 * @param {string} input - Будь-який формат YouTube посилання/ID
 * @param {Object} options - Опції
 * @returns {string} - HTML код iframe
 */
function createYouTubeEmbed(input, options = {}) {
  const videoId = normalizeYouTubeId(input);
  if (!videoId) {
    console.error('❌ Некоректне YouTube посилання:', input);
    return `<div style="padding: 20px; text-align: center; background: #f8d7da; color: #721c24; border-radius: 8px;">
      ⚠️ Помилка завантаження відео<br>
      <small>Некоректний YouTube ID: ${input}</small>
    </div>`;
  }
  
  const {
    width = '100%',
    height = '100%',
    aspectRatio = '16/9' // '16/9' або '9/16'
  } = options;
  
  // Використовуємо нормалізований embed URL
  const embedUrl = normalizeYouTubeEmbedUrl(input, options);
  
  return `
    <iframe 
      width="${width}" 
      height="${height}" 
      src="${embedUrl}" 
      title="YouTube video player" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      loading="lazy"
      style="aspect-ratio: ${aspectRatio}; border: none; border-radius: 12px;">
    </iframe>
  `;
}

/**
 * Валідація YouTube ID
 * 
 * @param {string} videoId - ID відео
 * @returns {boolean}
 */
function isValidYouTubeId(videoId) {
  if (!videoId) return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Генерує URL мініатюри YouTube
 * 
 * @param {string} input - Будь-який формат YouTube посилання/ID
 * @param {string} quality - Якість ('default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault')
 * @returns {string}
 */
function getYouTubeThumbnail(input, quality = 'hqdefault') {
  const videoId = normalizeYouTubeId(input);
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * ✅ НОВИЙ: Тестування нормалізації (для діагностики)
 * Викликайте в консолі: testYouTubeNormalization()
 */
function testYouTubeNormalization() {
  const testCases = [
    'dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    'invalid-link',
    '',
    null
  ];
  
  console.log('🧪 Тестування нормалізації YouTube посилань:\n');
  
  testCases.forEach(test => {
    const result = normalizeYouTubeId(test);
    const status = result === 'dQw4w9WgXcQ' || (test === 'invalid-link' && result === null) || 
                   (test === '' && result === null) || (test === null && result === null) 
                   ? '✅' : '❌';
    console.log(`${status} "${test}" → "${result}"`);
  });
  
  console.log('\n🔗 Приклад embed URL:');
  const embedUrl = normalizeYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    autoplay: true,
    muted: true
  });
  console.log(embedUrl);
}

/**
 * ✅ НОВИЙ: Створює віджет SoundCloud
 * 
 * @param {string} trackUrl - URL треку на SoundCloud
 * @param {Object} options - Опції
 * @returns {string} - HTML код iframe
 */
function createSoundCloudEmbed(trackUrl, options = {}) {
  if (!trackUrl) return '';
  
  const {
    height = 166,
    color = 'ff5500',
    autoPlay = false,
    hideRelated = false,
    showComments = true,
    showUser = true,
    showReposts = false,
    visual = false
  } = options;
  
  const params = new URLSearchParams({
    url: trackUrl,
    color: color,
    auto_play: autoPlay,
    hide_related: hideRelated,
    show_comments: showComments,
    show_user: showUser,
    show_reposts: showReposts,
    visual: visual
  });
  
  return `
    <iframe 
      width="100%" 
      height="${height}" 
      scrolling="no" 
      frameborder="no" 
      allow="autoplay"
      src="https://w.soundcloud.com/player/?${params.toString()}"
      loading="lazy">
    </iframe>
  `;
}

/**
 * ✅ НОВИЙ: Визначає чи є аудіо прямим посиланням на файл
 * 
 * @param {string} url - URL аудіо
 * @returns {boolean}
 */
function isDirectAudioLink(url) {
  if (!url) return false;
  
  // Перевіряємо розширення файлу
  const audioExtensions = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac'];
  const hasAudioExtension = audioExtensions.some(ext => url.toLowerCase().includes(ext));
  
  // Перевіряємо домени з прямими посиланнями
  const directDomains = ['archive.org', 'ia801', 'ia802', 'ia803', 'ia804'];
  const isDirectDomain = directDomains.some(domain => url.includes(domain));
  
  return hasAudioExtension || isDirectDomain;
}

/**
 * ✅ НОВИЙ: Визначає тип аудіо (SoundCloud, прямий файл, тощо)
 * 
 * @param {string} url - URL аудіо
 * @returns {string} - 'soundcloud', 'direct', 'unknown'
 */
function detectAudioType(url) {
  if (!url) return 'unknown';
  
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (isDirectAudioLink(url)) return 'direct';
  
  return 'unknown';
}

/**
 * Екранує HTML для безпечного виводу
 * 
 * @param {string} text - Текст для екранування
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Визначає мову тексту
 * 
 * @param {string} text - Текст для аналізу
 * @returns {string} - Код мови
 */
function detectLanguage(text) {
  if (!text) return 'ru';
  
  const hasHebrew = /[\u0590-\u05FF]/.test(text);
  if (hasHebrew) return 'he';
  
  const hasUkrainian = /[єіїґЄІЇҐ]/i.test(text);
  if (hasUkrainian) return 'uk';
  
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  
  if (hasCyrillic && !hasUkrainian) return 'ru';
  if (hasLatin && !hasCyrillic) return 'en';
  
  return 'ru';
}

console.log('✅ Utils завантажено (з НОРМАЛІЗАЦІЄЮ YouTube посилань)');
console.log('💡 Викличте testYouTubeNormalization() для перевірки');