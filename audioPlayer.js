// ============================================
// AUDIOPLAYER.JS — КОМПАКТНА ВЕРСІЯ
// Універсальний плеєр для віршів і музики
// ============================================

if (typeof window.AudioPlayer === 'undefined') {
  window.AudioPlayer = {
  currentAudio: null,
  currentButton: null,

  /**
   * ✅ НОВИЙ: Створює КОМПАКТНИЙ плеєр для треку
   * Підтримує: MP3, OGG з archive.org, SoundCloud (посилання відкривається в новій вкладці)
   */
  createPlayer(track) {
    if (!track.audio && !track.link) {
      return '';
    }

    const playerId = `player-${this.sanitizeId(track.title)}`;
    const audioSource = track.audio || track.link;
    const audioType = typeof detectAudioType !== 'undefined' 
      ? detectAudioType(audioSource) 
      : 'unknown';
    
    // SoundCloud → відкриваємо в новому вікні (не вбудовуємо)
    if (audioType === 'soundcloud') {
      return `
        <div class="audio-compact-container">
          <div class="audio-compact-info">
            <div class="audio-compact-title">${this.escapeHtml(track.title)}</div>
          </div>
          <a 
            href="${this.escapeHtml(audioSource)}" 
            target="_blank"
            class="audio-compact-btn audio-soundcloud-btn"
            title="Слухати на SoundCloud">
            <span class="audio-icon">🔊</span>
            <span class="audio-label">SoundCloud</span>
          </a>
        </div>
      `;
    }
    
    // Прямий MP3/OGG → HTML5 плеєр
    if (audioType === 'direct') {
      return `
        <div class="audio-compact-container" id="${playerId}">
          <button 
            class="audio-compact-btn" 
            onclick="AudioPlayer.togglePlay('${playerId}')"
            title="Відтворити">
            <span class="audio-icon">▶</span>
          </button>
          
          <div class="audio-compact-info">
            <div class="audio-compact-title">${this.escapeHtml(track.title)}</div>
            <div class="audio-compact-progress" onclick="AudioPlayer.seek(event, '${playerId}')">
              <div class="audio-compact-bar"></div>
            </div>
            <div class="audio-compact-time">
              <span class="audio-current">0:00</span>
              <span class="audio-duration">0:00</span>
            </div>
          </div>
          
          <audio 
            src="${this.escapeHtml(audioSource)}" 
            preload="metadata"
            crossorigin="anonymous">
          </audio>
        </div>
      `;
    }
    
    // Невідомий формат
    return `
      <div class="audio-compact-container">
        <div class="audio-compact-info">
          <div class="audio-compact-title">${this.escapeHtml(track.title)}</div>
          <a href="${this.escapeHtml(audioSource)}" target="_blank" class="audio-compact-link">
            🔗 Відкрити у браузері
          </a>
        </div>
      </div>
    `;
  },

  /**
   * ✅ НОВИЙ: Створює МІНІМАЛЬНУ кнопку для вірша
   * Малий розмір, ідеально для модальних вікон
   */
  createPoemButton(poem) {
    if (!poem.audio) {
      return '';
    }

    const buttonId = `poem-audio-${poem.id}`;
    const audioType = typeof detectAudioType !== 'undefined' 
      ? detectAudioType(poem.audio) 
      : 'unknown';
    
    // SoundCloud → відкриваємо в новому вікні
    if (audioType === 'soundcloud') {
      return `
        <a 
          href="${this.escapeHtml(poem.audio)}" 
          target="_blank"
          class="poem-audio-btn poem-audio-soundcloud"
          style="text-decoration: none;">
          <span class="poem-audio-icon">🔊</span>
          <span class="poem-audio-text">${typeof LanguageManager !== 'undefined' ? LanguageManager.get('listen') : 'Слухати'} на SoundCloud</span>
        </a>
      `;
    }
    
    // Прямий MP3 → компактний inline плеєр
    return `
      <div class="poem-audio-inline-player" id="${buttonId}">
        <button 
          class="poem-audio-btn-mini" 
          onclick="AudioPlayer.togglePoemAudio('${poem.id}', '${this.escapeForJs(poem.audio)}')"
          title="${typeof LanguageManager !== 'undefined' ? LanguageManager.get('listen') : 'Слухати'}">
          <span class="poem-audio-icon">🔊</span>
          <span class="poem-audio-text">${typeof LanguageManager !== 'undefined' ? LanguageManager.get('listen') : 'Слухати'}</span>
        </button>
        
        <div class="poem-audio-progress-mini">
          <div class="poem-audio-bar-mini"></div>
        </div>
        
        <span class="poem-audio-time-mini">0:00</span>
      </div>
    `;
  },

  /**
   * Play/Pause для треку
   */
  togglePlay(playerId) {
    const container = document.getElementById(playerId);
    if (!container) return;

    const audio = container.querySelector('audio');
    const button = container.querySelector('.audio-compact-btn');

    if (!audio || !button) return;

    // Зупиняємо інший трек якщо грає
    if (this.currentAudio && this.currentAudio !== audio) {
      this.currentAudio.pause();
      if (this.currentButton) {
        this.currentButton.querySelector('.audio-icon').textContent = '▶';
        this.currentButton.classList.remove('playing');
      }
    }

    this.currentAudio = audio;
    this.currentButton = button;

    if (audio.paused) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            button.querySelector('.audio-icon').textContent = '⏸';
            button.classList.add('playing');
            this.attachEventListeners(playerId);
          })
          .catch(err => {
            console.error('Помилка відтворення:', err);
            this.showError(playerId, 'Не вдалося відтворити аудіо');
          });
      }
    } else {
      audio.pause();
      button.querySelector('.audio-icon').textContent = '▶';
      button.classList.remove('playing');
    }
  },

  /**
   * Play/Pause для вірша
   */
  togglePoemAudio(poemId, audioSrc) {
    const container = document.getElementById(`poem-audio-${poemId}`);
    const button = container?.querySelector('.poem-audio-btn-mini');
    
    if (!button) return;

    // Зупиняємо поточне аудіо
    if (this.currentAudio && this.currentAudio.dataset.poemId !== poemId) {
      this.currentAudio.pause();
      if (this.currentButton) {
        this.currentButton.querySelector('.poem-audio-icon').textContent = '🔊';
        this.currentButton.classList.remove('playing');
      }
    }

    // Створюємо або знаходимо аудіо елемент
    let audio = document.getElementById(`poem-audio-element-${poemId}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `poem-audio-element-${poemId}`;
      audio.dataset.poemId = poemId;
      audio.src = audioSrc;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      document.body.appendChild(audio);

      // Оновлення прогресу
      audio.addEventListener('timeupdate', () => {
        const progressBar = container.querySelector('.poem-audio-bar-mini');
        const timeEl = container.querySelector('.poem-audio-time-mini');
        
        if (progressBar && audio.duration) {
          const percent = (audio.currentTime / audio.duration) * 100;
          progressBar.style.width = `${percent}%`;
        }
        
        if (timeEl) {
          timeEl.textContent = this.formatTime(audio.currentTime);
        }
      });

      // Коли аудіо закінчується
      audio.addEventListener('ended', () => {
        button.classList.remove('playing');
        const icon = button.querySelector('.poem-audio-icon');
        if (icon) icon.textContent = '🔊';
        
        const progressBar = container.querySelector('.poem-audio-bar-mini');
        if (progressBar) progressBar.style.width = '0%';
      });

      // Коли метадані завантажені
      audio.addEventListener('loadedmetadata', () => {
        const timeEl = container.querySelector('.poem-audio-time-mini');
        if (timeEl && audio.duration) {
          timeEl.textContent = this.formatTime(audio.duration);
        }
      });
    }

    if (audio.paused) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            button.classList.add('playing');
            const icon = button.querySelector('.poem-audio-icon');
            if (icon) icon.textContent = '⏸';
          })
          .catch(err => {
            console.error('Помилка відтворення вірша:', err);
            alert('Не вдалося відтворити аудіо');
          });
      }
    } else {
      audio.pause();
      button.classList.remove('playing');
      const icon = button.querySelector('.poem-audio-icon');
      if (icon) icon.textContent = '🔊';
    }

    this.currentAudio = audio;
    this.currentButton = button;
  },

  /**
   * Додає обробники подій для плеєра
   */
  attachEventListeners(playerId) {
    const container = document.getElementById(playerId);
    if (!container) return;

    const audio = container.querySelector('audio');
    if (!audio || audio.dataset.listenersAttached) return;

    // Оновлення прогресу
    audio.addEventListener('timeupdate', () => {
      const progressBar = container.querySelector('.audio-compact-bar');
      const currentTime = container.querySelector('.audio-current');
      
      if (progressBar && audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }
      
      if (currentTime) {
        currentTime.textContent = this.formatTime(audio.currentTime);
      }
    });

    // Коли аудіо закінчується
    audio.addEventListener('ended', () => {
      const button = container.querySelector('.audio-compact-btn');
      if (button) {
        button.querySelector('.audio-icon').textContent = '▶';
        button.classList.remove('playing');
      }
      const progressBar = container.querySelector('.audio-compact-bar');
      if (progressBar) progressBar.style.width = '0%';
    });

    // Коли метадані завантажені
    audio.addEventListener('loadedmetadata', () => {
      const duration = container.querySelector('.audio-duration');
      if (duration && audio.duration) {
        duration.textContent = this.formatTime(audio.duration);
      }
    });

    // Обробка помилок
    audio.addEventListener('error', () => {
      console.error(`Помилка завантаження аудіо для ${playerId}`);
      this.showError(playerId, 'Не вдалося завантажити аудіо');
    });

    audio.dataset.listenersAttached = 'true';
  },

  /**
   * Перемотка аудіо
   */
  seek(event, playerId) {
    const container = document.getElementById(playerId);
    if (!container) return;

    const audio = container.querySelector('audio');
    const progressContainer = event.currentTarget;
    
    const rect = progressContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    
    if (audio.duration) {
      audio.currentTime = audio.duration * percent;
    }
  },

  /**
   * Обробка помилок
   */
  showError(playerId, message) {
    const container = document.getElementById(playerId);
    if (!container) return;

    const info = container.querySelector('.audio-compact-info');
    if (info) {
      info.innerHTML = `<div class="audio-error">⚠️ ${message}</div>`;
    }
  },

  /**
   * Форматування часу (секунди -> MM:SS)
   */
  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Утиліти
   */
  sanitizeId(text) {
    return text.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  escapeForJs(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
};
}

console.log('✅ AudioPlayer завантажено (КОМПАКТНА ВЕРСІЯ)');