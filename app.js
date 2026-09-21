let isPlaying = false;
    const loveSong = new Audio('DanielCaesar-Superpowers.mp3');
    loveSong.preload = 'metadata';

    // 5% más lenta: suave, sin exagerar.
    const MUSIC_SPEED = 1.0;
    const MUSIC_VOLUME = 0.45;

    loveSong.defaultPlaybackRate = MUSIC_SPEED;
    loveSong.playbackRate = MUSIC_SPEED;
    loveSong.volume = MUSIC_VOLUME;

    // Mantiene el tono original cuando el navegador lo soporta.
    if ('preservesPitch' in loveSong) loveSong.preservesPitch = true;
    if ('webkitPreservesPitch' in loveSong) loveSong.webkitPreservesPitch = true;

    const SONG_REFERENCE_DURATION = 173.0;

    /*
      Sincronización calibrable para TU MP3.
      La calibración calcula:
        lyricTime = audioTime * SYNC_SCALE + SYNC_OFFSET

      Ya no hace falta adivinar offsets a mano.
    */
    const LYRIC_SYNC_KEY = 'maye-superpowers-sync-v1';

    let SYNC_SCALE = 1.0;
    let SYNC_OFFSET = 0.50;

    try {
      const savedSync = JSON.parse(
        localStorage.getItem(LYRIC_SYNC_KEY) || 'null'
      );

      if (
        savedSync &&
        Number.isFinite(savedSync.scale) &&
        Number.isFinite(savedSync.offset)
      ) {
        SYNC_SCALE = savedSync.scale;
        SYNC_OFFSET = savedSync.offset;
      }
    } catch (error) {}
    const mixtapeSection = document.getElementById('mixtape');


    /* ==========================================================
       LETRA SINCRONIZADA — SUPERPOWERS
       Los textos vienen de la letra que vos mismo pegaste.
       ========================================================== */
    const SYNCED_LYRICS = [
      { t: 0.80, text: "Oh, you got power, superpowers" },
      { t: 8.98, text: "Do you even know how to wield them?" },
      { t: 13.00, text: "All God's children are special" },
      { t: 18.83, text: "But not like you, no, not like you" },

      { t: 24.75, text: "You're just like a flower" },
      { t: 26.63, text: "(Flower)" },
      { t: 29.32, text: "You're ever-giving, that's a given" },
      { t: 36.98, text: "All God's children are special" },
      { t: 41.06, text: "(All God's children, woah)" },
      { t: 42.88, text: "But not like you, no, not like you" },

      { t: 50.53, text: "(Lift it, lift it, lift it)" },
      { t: 51.95, text: "Lift your head to the sky" },
      { t: 55.91, text: "(To the sky, oh, sky, sky)" },
      { t: 67.56, text: "(Lift it, lift it, lift it, lift it)" },

      { t: 73.06, text: "Mmm, it's crazy to say this, but you're the greatest" },
      { t: 79.10, text: "(You are the greatest)" },
      { t: 81.94, text: "Can't explain it" },
      { t: 83.63, text: "(Oh-oh-oh)" },
      { t: 84.75, text: "I know that you know the truth" },
      { t: 88.03, text: "They can't deny you" },
      { t: 94.10, text: "Yeah, they can't deny you, it's true" },

      { t: 100.52, text: "Yeah, remember Vegas?" },
      { t: 105.56, text: "You come a long way, kid" },
      { t: 108.61, text: "And let me just say this (Ah-ah), oh yeah" },
      { t: 113.31, text: "You're the main character now (Ah-ah)" },
      { t: 118.78, text: "You're the main character now (Ah-ah)" },

      { t: 122.48, text: "(Lift it, lift it, lift it)" },
      { t: 123.83, text: "Lift your head to the sky" },
      { t: 127.69, text: "(To the sky, oh, sky, sky)" },

      { t: 139.58, text: "(You're the main character now)" },
      { t: 142.60, text: "(You're the main character now)" },
      { t: 153.01, text: "Oh, yeah" },
      { t: 158.30, text: "(Ah-ah)" },
      { t: 163.20, text: "(Ah-ah)" }
    ];

    const LYRIC_PARTS = [
      { t: 0.00, label: "verse 1" },
      { t: 50.53, label: "chorus" },
      { t: 73.06, label: "verse 2" },
      { t: 122.48, label: "chorus" },
      { t: 139.58, label: "outro" }
    ];

    function mountSyncedLyrics() {
      const stack = document.getElementById('song-message-lines');
      if (!stack || stack.dataset.realLyrics === '1') return;

      stack.dataset.realLyrics = '1';
      stack.innerHTML = '';

      let partIndex = 0;

      SYNCED_LYRICS.forEach(cue => {
        while (
          partIndex < LYRIC_PARTS.length &&
          LYRIC_PARTS[partIndex].t <= cue.t
        ) {
          const part = document.createElement('div');
          part.className = 'lyric-part';
          part.dataset.partTime = String(LYRIC_PARTS[partIndex].t);
          part.textContent = LYRIC_PARTS[partIndex].label;
          stack.appendChild(part);
          partIndex += 1;
        }

        const line = document.createElement('p');
        line.className = 'song-message-line';
        line.dataset.songTime = String(cue.t);
        line.textContent = cue.text;
        stack.appendChild(line);
      });
    }

    function getLyricElements() {
      return [...document.querySelectorAll('.song-message-line')];
    }

    function getPartElements() {
      return [...document.querySelectorAll('.lyric-part')];
    }

    function getReferenceTime() {
      return (
        loveSong.currentTime * SYNC_SCALE +
        SYNC_OFFSET
      );
    }

    function prepareLyrics() {
      getLyricElements().forEach(line => {
        if (line.dataset.prepared === '1') return;

        const text = line.textContent.trim();
        line.dataset.prepared = '1';
        line.innerHTML = '';

        text.split(/(\s+)/).forEach(token => {
          if (/^\s+$/.test(token)) {
            line.appendChild(document.createTextNode(token));
            return;
          }

          const span = document.createElement('span');
          span.className = 'lyric-word';
          span.textContent = token;
          line.appendChild(span);
        });
      });
    }

    function resetLyrics() {
      prepareLyrics();

      const panel = document.getElementById('lyrics-panel');
      const placeholder = document.getElementById('lyric-placeholder');
      const stack = document.getElementById('song-message-lines');

      panel?.classList.remove('lyrics-running');
      if (placeholder) placeholder.style.opacity = '';
      if (stack) stack.style.transform = 'translateY(0px)';

      getLyricElements().forEach(line => {
        line.classList.remove(
          'is-visible',
          'is-current',
          'is-past',
          'is-prev',
          'is-next',
          'is-far'
        );
        line.querySelectorAll('.lyric-word').forEach(word => word.classList.remove('word-on'));
      });

      getPartElements().forEach(part => part.classList.remove('is-visible'));
    }

    function centerActiveLyric(line) {
      const viewport = document.getElementById('lyrics-viewport');
      const stack = document.getElementById('song-message-lines');
      if (!viewport || !stack || !line) return;

      const desiredCenter = viewport.clientHeight * .48;
      const lineCenter = line.offsetTop + line.offsetHeight / 2;
      const shift = Math.max(0, lineCenter - desiredCenter);
      stack.style.transform = `translateY(-${shift}px)`;
    }

    function updateLyrics() {
      prepareLyrics();

      const refTime = getReferenceTime();
      const lines = getLyricElements();
      const panel = document.getElementById('lyrics-panel');

      if (loveSong.currentTime > .1) {
        panel?.classList.add('lyrics-running');
      }

      let currentIndex = -1;

      // Averiguar cuál es la línea que corresponde al momento actual.
      lines.forEach((line, index) => {
        const start = Number(line.dataset.songTime || 0);

        if (refTime >= start) {
          currentIndex = index;
        }
      });

      lines.forEach((line, index) => {
        const start = Number(line.dataset.songTime || 0);
        const nextStart = index < lines.length - 1
          ? Number(lines[index + 1].dataset.songTime || start + 7)
          : SONG_REFERENCE_DURATION;

        const words = [...line.querySelectorAll('.lyric-word')];

        line.classList.remove(
          'is-visible',
          'is-current',
          'is-past',
          'is-prev',
          'is-next',
          'is-far'
        );

        // Solamente dejamos alrededor de la línea activa.
        if (index === currentIndex) {
          line.classList.add('is-visible', 'is-current');
        } else if (index === currentIndex - 1) {
          line.classList.add('is-visible', 'is-prev', 'is-past');
        } else if (index === currentIndex + 1) {
          line.classList.add('is-visible', 'is-next');
        } else {
          line.classList.add('is-far');
        }

        // La línea actual aparece palabra por palabra.
        if (index === currentIndex && refTime >= start && refTime < nextStart) {
          const lineDuration = Math.max(1.5, nextStart - start);
          const progress = Math.min(
            1,
            Math.max(0, (refTime - start) / lineDuration)
          );

          // Un inicio un poquito más natural:
          // la primera palabra aparece enseguida y las demás acompañan.
          const easedProgress = Math.pow(progress, .82);
          const wordsOn = Math.max(
            1,
            Math.ceil(easedProgress * words.length)
          );

          words.forEach((word, wordIndex) => {
            word.classList.toggle('word-on', wordIndex < wordsOn);
          });
        } else if (index < currentIndex) {
          words.forEach(word => word.classList.add('word-on'));
        } else {
          words.forEach(word => word.classList.remove('word-on'));
        }
      });

      // El nombre de Verse / Chorus aparece solo cuando corresponde
      // a la zona actual de la canción.
      const parts = getPartElements();

      parts.forEach((part, partIndex) => {
        const at = Number(part.dataset.partTime || 0);
        const nextPartAt = partIndex < parts.length - 1
          ? Number(parts[partIndex + 1].dataset.partTime || SONG_REFERENCE_DURATION)
          : SONG_REFERENCE_DURATION;

        part.classList.toggle(
          'is-visible',
          refTime >= at && refTime < nextPartAt
        );
      });

      if (currentIndex >= 0) {
        centerActiveLyric(lines[currentIndex]);
      }
    }


    /* ==========================================================
       RELOJ VISUAL DE LETRAS
       timeupdate puede tardar ~100–250 ms entre actualizaciones.
       Este reloj consulta currentTime en cada frame.
       ========================================================== */
    let lyricClockFrame = null;

    function lyricClockLoop() {
      if (loveSong.paused || loveSong.ended) {
        lyricClockFrame = null;
        return;
      }

      updateLyrics();
      lyricClockFrame = requestAnimationFrame(lyricClockLoop);
    }

    function startLyricClock() {
      if (lyricClockFrame) return;
      lyricClockFrame = requestAnimationFrame(lyricClockLoop);
    }

    function stopLyricClock() {
      if (!lyricClockFrame) return;
      cancelAnimationFrame(lyricClockFrame);
      lyricClockFrame = null;
    }

    function updatePlayerProgress() {
      // Las letras usan requestAnimationFrame.
      // Dejamos este handler por compatibilidad con el resto del player.
    }

    loveSong.addEventListener('loadedmetadata', () => {
      resetLyrics();
    });

    loveSong.addEventListener('timeupdate', updatePlayerProgress);

    loveSong.addEventListener('play', startLyricClock);
    loveSong.addEventListener('pause', stopLyricClock);

    loveSong.addEventListener('ended', () => {
      stopLyricClock();
      isPlaying = false;
    });

    document.addEventListener('DOMContentLoaded', () => {
      mountSyncedLyrics();
      prepareLyrics();
      resetLyrics();
    });

    function triggerSecretToast(msg) {
      const toast = document.getElementById('secret-toast');
      const text = document.getElementById('toast-text');
      text.textContent = msg;
      toast.classList.remove('opacity-0', '-translate-y-4');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-4');
      }, 3200);
    }

// Reveal Secret on interactive sticky notes
    function revealNoteSecret(card, secretText) {
      const secretBox = card.querySelector('.hidden-secret');
      if (secretBox) {
        secretBox.textContent = secretText;
        secretBox.classList.remove('hidden');
        card.classList.add('border-dusty-rose');
        triggerSecretToast(secretText);
      }
    }

    // Generate gentle, slow floating petals (max 14 on screen for calmness)
    const petalContainer = document.getElementById('petal-container');
    const petalColors = ['#f6e7e4', '#e8c4c0', '#faede8', '#f8dcd8'];

    function createPetal() {
      if (!petalContainer) return;
      if (petalContainer.childElementCount > 20) return;

      const petal = document.createElement('div');
      petal.className = 'petal-particle';
      
      const size = Math.random() * 8 + 8; // 8px to 16px
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      const startX = Math.random() * window.innerWidth;
      const duration = Math.random() * 8 + 12; // 12s to 20s (very slow and gentle)
      const delay = Math.random() * 4;

      petal.style.width = `${size}px`;
      petal.style.height = `${size * 1.3}px`;
      petal.style.left = `${startX}px`;
      petal.style.top = `-20px`;
      petal.style.backgroundColor = color;
      petal.style.borderRadius = '60% 40% 70% 30% / 60% 30% 70% 40%';
      petal.style.boxShadow = '0 2px 4px rgba(126, 56, 69, 0.08)';
      petal.style.animationDuration = `${duration}s`;
      petal.style.animationDelay = `${delay}s`;

      petalContainer.appendChild(petal);

      setTimeout(() => {
        if (petal.parentNode === petalContainer) {
          petalContainer.removeChild(petal);
        }
      }, (duration + delay) * 1000);
    }

    // Spawn initial gentle petals
    for (let i = 0; i < 8; i++) {
      setTimeout(createPetal, i * 800);
    }
    setInterval(createPetal, 1650);

    // Desktop Custom Cursor Trail
    if (window.matchMedia('(pointer: fine)').matches) {
      let mouseX = 0, mouseY = 0;
      let trailX = 0, trailY = 0;
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      document.body.appendChild(trail);

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      function animateTrail() {
        trailX += (mouseX - trailX) * 0.18;
        trailY += (mouseY - trailY) * 0.18;
        trail.style.left = `${trailX}px`;
        trail.style.top = `${trailY}px`;
        requestAnimationFrame(animateTrail);
      }
      animateTrail();
    }

/* ==========================================================
       NAVEGACIÓN POR SECCIONES
       ========================================================== */
    const romanticSections = [...document.querySelectorAll('#romantic-main > section')];
    const sectionDotsBox = document.getElementById('section-dots');
    const sectionPrev = document.getElementById('section-prev');
    const sectionNext = document.getElementById('section-next');
    const sectionCurrent = document.getElementById('section-current');
    const sectionTotal = document.getElementById('section-total');

    let currentSection = 0;
    let sectionLocked = false;

    sectionTotal.textContent = String(romanticSections.length).padStart(2, '0');

    romanticSections.forEach((section, index) => {
      if (index === 0) section.classList.add('section-active');

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'section-dot' + (index === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ir a la sección ${index + 1}`);
      dot.addEventListener('click', () => goToSection(index));
      sectionDotsBox.appendChild(dot);
    });

    const sectionDots = [...document.querySelectorAll('.section-dot')];

    function updateSectionNav() {
      sectionCurrent.textContent = String(currentSection + 1).padStart(2, '0');

      sectionDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSection);
      });

      sectionPrev.disabled = currentSection === 0;
      sectionNext.disabled = currentSection === romanticSections.length - 1;
    }

    function goToSection(index) {
      if (
        sectionLocked ||
        index === currentSection ||
        index < 0 ||
        index >= romanticSections.length
      ) return;

      sectionLocked = true;

      const oldSection = romanticSections[currentSection];
      const newSection = romanticSections[index];
      const forward = index > currentSection;

      oldSection.classList.remove('section-active');

      if (forward) {
        oldSection.classList.add('section-leave-left');
      }

      newSection.style.transform = forward
        ? 'translateX(42px) scale(.992)'
        : 'translateX(-42px) scale(.992)';

      requestAnimationFrame(() => {
        newSection.classList.add('section-active');
        newSection.scrollTop = 0;
        newSection.style.transform = '';
      });

      setTimeout(() => {
        oldSection.classList.remove('section-leave-left');
        sectionLocked = false;
      }, 650);

      currentSection = index;
      updateSectionNav();
    }

    sectionPrev.addEventListener('click', () => goToSection(currentSection - 1));
    sectionNext.addEventListener('click', () => goToSection(currentSection + 1));

    document.querySelectorAll('[data-section-next]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        goToSection(currentSection + 1);
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') goToSection(currentSection + 1);
      if (event.key === 'ArrowLeft') goToSection(currentSection - 1);
    });

    let touchStartX = null;
    let touchStartY = null;

    document.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    document.addEventListener('touchend', event => {
      if (touchStartX === null) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx < 0) goToSection(currentSection + 1);
        else goToSection(currentSection - 1);
      }

      touchStartX = null;
      touchStartY = null;
    }, { passive: true });

    updateSectionNav();

    /* ==========================================================
       SOBRE
       ========================================================== */
    const loveEnvelope = document.getElementById('love-envelope');
    let envelopeOpen = false;

    async function startMusicWithLetter() {
      // Si ya estaba sonando desde el mini cassette, no la reiniciamos.
      if (!loveSong.paused) return;

      loveSong.playbackRate = MUSIC_SPEED;

      // El clic que abre el sobre permite iniciar el audio.
      const targetVolume = MUSIC_VOLUME;
      loveSong.volume = 0;

      try {
        await loveSong.play();

        // Fade-in mientras la carta se abre.
        if (window.gsap) {
          gsap.killTweensOf(loveSong);
          gsap.to(loveSong, {
            volume: targetVolume,
            duration: 1.7,
            delay: .12,
            ease: 'power1.out'
          });
        } else {
          loveSong.volume = targetVolume;
        }
      } catch (error) {
        loveSong.volume = targetVolume;
      }
    }

    function openEnvelope() {
      if (!loveEnvelope || envelopeOpen || loveEnvelope.classList.contains('letter-only')) return;

      envelopeOpen = true;

      const rect = loveEnvelope.getBoundingClientRect();
      const flap = loveEnvelope.querySelector('.env-flap');
      const seal = loveEnvelope.querySelector('.env-seal');
      const letter = loveEnvelope.querySelector('.env-letter');

      // La clase controla una sola trayectoria:
      // la hoja sale hacia el centro y NO cambia de centro después.
      loveEnvelope.classList.add('is-open');

      // Superpowers empieza junto con la apertura.
      ensureBeatFlowers();
      startMusicWithLetter();

      flowerBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height * .47,
        24,
        true
      );

      setTimeout(() => {
        flowerBurst(
          rect.left + rect.width / 2,
          rect.top + rect.height * .30,
          12,
          true
        );
      }, 430);

      // Un pequeño acabado con GSAP; nunca reposiciona la carta.
      if (window.gsap) {
        if (seal) {
          gsap.to(seal, {
            scale: .68,
            rotate: 10,
            opacity: 0,
            duration: .32,
            ease: 'power2.in'
          });
        }

        if (flap) {
          gsap.to(flap, {
            opacity: 0,
            duration: .28,
            delay: .58,
            ease: 'power2.out'
          });
        }

        if (letter) {
          gsap.fromTo(
            letter,
            { filter: 'brightness(.98)' },
            {
              filter: 'brightness(1)',
              duration: .7,
              delay: .6,
              ease: 'power2.out'
            }
          );
        }
      }

      // Después de que la hoja llegó al centro,
      // solo desaparecen las piezas del sobre.
      setTimeout(() => {
        loveEnvelope.classList.add('letter-only');
      }, 1120);

      triggerSecretToast('para vos ♡');
    }

    if (loveEnvelope) {
      loveEnvelope.addEventListener('click', event => {
        if (event.target.closest('[data-section-next]')) return;
        openEnvelope();
      });

      loveEnvelope.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && !envelopeOpen) {
          event.preventDefault();
          openEnvelope();
        }
      });
    }

    /* ==========================================================
       FLORES DESDE EL PUNTO DEL CLICK
       ========================================================== */
    const bloomSymbols = ['🌸', '🌷', '✿', '❀', '🌹', '💮'];

    function flowerBurst(x, y, amount = 8, downward = false) {
      for (let i = 0; i < amount; i++) {
        const bloom = document.createElement('span');
        bloom.className = 'click-bloom';
        bloom.textContent = bloomSymbols[Math.floor(Math.random() * bloomSymbols.length)];

        const angle = Math.random() * Math.PI * 2;
        const distance = 38 + Math.random() * 90;

        let dx = Math.cos(angle) * distance;
        let dy = Math.sin(angle) * distance;

        if (downward) {
          dx = -125 + Math.random() * 250;
          dy = 85 + Math.random() * 210;
        }

        bloom.style.left = `${x}px`;
        bloom.style.top = `${y}px`;
        bloom.style.setProperty('--bloom-x', `${dx}px`);
        bloom.style.setProperty('--bloom-y', `${dy}px`);
        bloom.style.setProperty('--bloom-rot', `${-150 + Math.random() * 300}deg`);
        bloom.style.setProperty('--bloom-size', `${13 + Math.random() * 13}px`);
        bloom.style.setProperty('--bloom-time', `${650 + Math.random() * 480}ms`);

        document.body.appendChild(bloom);
        bloom.addEventListener('animationend', () => bloom.remove(), { once: true });
      }
    }

    document.addEventListener('pointerdown', event => {
      flowerBurst(event.clientX, event.clientY, event.pointerType === 'touch' ? 9 : 7);
    });

const memoriesLink = document.querySelector('a[href="#memories"]');
    if (memoriesLink) {
      memoriesLink.addEventListener('click', event => {
        event.preventDefault();
        const target = romanticSections.findIndex(section => section.id === 'memories');
        if (target >= 0) goToSection(target);
      });
    }



/* ==========================================================
   FLORES REACTIVAS A LOS GOLPES DE LA MÚSICA
   ========================================================== */
let flowerAudioContext = null;
let flowerAnalyser = null;
let flowerAudioSource = null;
let flowerFrequencyData = null;
let flowerBeatFrame = null;

/*
  La detección pura de graves a veces se salta golpes.
  Ahora usamos una grilla musical estable y el analizador
  solamente decide CUÁN GRANDE es cada explosión.
*/
const FLOWER_BPM = 80;
const FLOWER_BEAT_INTERVAL = 60 / FLOWER_BPM;

// Ajuste de fase de los "tun". Si algún día querés correr las flores
// un poquito: 0.05, 0.10, 0.15...
const FLOWER_BEAT_OFFSET = 0.10;

let lastFlowerBeatIndex = -1;

function ensureBeatFlowers() {
  try {
    if (!flowerAudioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;

      if (AudioCtx) {
        flowerAudioContext = new AudioCtx();
        flowerAnalyser = flowerAudioContext.createAnalyser();

        // Menos resolución = menos trabajo para el navegador.
        flowerAnalyser.fftSize = 512;
        flowerAnalyser.smoothingTimeConstant = .74;

        flowerAudioSource =
          flowerAudioContext.createMediaElementSource(loveSong);

        flowerAudioSource.connect(flowerAnalyser);
        flowerAnalyser.connect(flowerAudioContext.destination);

        flowerFrequencyData = new Uint8Array(
          flowerAnalyser.frequencyBinCount
        );
      }
    }

    if (
      flowerAudioContext &&
      flowerAudioContext.state === 'suspended'
    ) {
      flowerAudioContext.resume();
    }

    if (!flowerBeatFrame) {
      monitorFlowerBeatGrid();
    }
  } catch (error) {
    // Incluso sin Web Audio, la grilla de flores sigue funcionando.
    if (!flowerBeatFrame) {
      monitorFlowerBeatGrid();
    }
  }
}

function getBeatStrength() {
  if (!flowerAnalyser || !flowerFrequencyData) {
    return 1;
  }

  flowerAnalyser.getByteFrequencyData(flowerFrequencyData);

  // Zona grave/low-mid: suficiente para saber si el golpe fue fuerte.
  let total = 0;
  let count = 0;

  for (let i = 1; i <= 8; i += 1) {
    total += flowerFrequencyData[i];
    count += 1;
  }

  const energy = count ? total / count : 0;

  if (energy > 125) return 1.45;
  if (energy > 90) return 1.22;
  if (energy > 58) return 1.08;

  return .92;
}

function flowerBeatExplosion(strength = 1, beatIndex = 0) {
  const cassette = document.getElementById('mini-cassette');
  const cassetteFace =
    cassette?.querySelector('.mini-cassette__label') ||
    cassette?.querySelector('.mini-cassette__window');

  const zones = [
    { x: .16, y: .24 },
    { x: .50, y: .18 },
    { x: .84, y: .25 },
    { x: .18, y: .71 },
    { x: .50, y: .76 },
    { x: .82, y: .69 }
  ];

  // Va rotando por zonas, no 100% aleatorio.
  const zone = zones[Math.abs(beatIndex) % zones.length];

  const jitterX = (Math.random() - .5) * window.innerWidth * .07;
  const jitterY = (Math.random() - .5) * window.innerHeight * .06;

  const x = window.innerWidth * zone.x + jitterX;
  const y = window.innerHeight * zone.y + jitterY;

  // Cada 4 pulsos hay un acento un poco más grande.
  const downBeat = beatIndex % 4 === 0;
  const strongBeat = strength > 1.25 || downBeat;

  // No hacemos 15 flores en CADA beat porque sería demasiado pesado.
  // Hay explosión en todos, pero unas son pequeñas.
  const amount = strongBeat ? 10 : 5;

  flowerBurst(x, y, amount, false);

  // Acento extra únicamente en golpes importantes.
  if (strongBeat && strength > 1.18) {
    setTimeout(() => {
      flowerBurst(
        Math.min(
          window.innerWidth - 28,
          Math.max(28, x + (Math.random() - .5) * 125)
        ),
        Math.min(
          window.innerHeight - 28,
          Math.max(28, y + (Math.random() - .5) * 85)
        ),
        4,
        false
      );
    }, 70);
  }

  /*
    El casete "respira" con el beat, pero animamos una pieza INTERNA.
    Antes animábamos el contenedor entero y chocaba con la física
    de arrastre, provocando tironcitos.
  */
  if (
    cassetteFace &&
    window.gsap &&
    !cassette?.classList.contains('is-dragging')
  ) {
    gsap.fromTo(
      cassetteFace,
      {
        scale: 1
      },
      {
        scale: strongBeat ? 1.012 : 1.006,
        duration: .10,
        yoyo: true,
        repeat: 1,
        ease: 'sine.out',
        overwrite: 'auto'
      }
    );
  }
}

function monitorFlowerBeatGrid() {
  flowerBeatFrame = requestAnimationFrame(monitorFlowerBeatGrid);

  if (loveSong.paused || loveSong.ended) {
    return;
  }

  const songTime = loveSong.currentTime - FLOWER_BEAT_OFFSET;

  if (songTime < 0) {
    return;
  }

  const beatIndex = Math.floor(
    songTime / FLOWER_BEAT_INTERVAL
  );

  if (beatIndex === lastFlowerBeatIndex) {
    return;
  }

  lastFlowerBeatIndex = beatIndex;

  const strength = getBeatStrength();

  flowerBeatExplosion(
    strength,
    beatIndex
  );
}

// Si el usuario mueve la canción o vuelve a empezar,
// recalculamos el beat desde el tiempo actual.
loveSong.addEventListener('seeked', () => {
  lastFlowerBeatIndex = -1;
});

loveSong.addEventListener('ended', () => {
  lastFlowerBeatIndex = -1;
});


/* ==========================================================
   GSAP + MINI CASETE GLOBAL
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const miniCassette = document.getElementById('mini-cassette');
  const miniPlay = document.getElementById('mini-play');
  const miniPlayIcon = document.getElementById('mini-play-icon');
  const miniReelLeft = document.getElementById('mini-reel-left');
  const miniReelRight = document.getElementById('mini-reel-right');
  const miniProgress = document.getElementById('mini-progress');
  const miniTime = document.getElementById('mini-time');

  if (!miniCassette || typeof loveSong === 'undefined') return;


  /* ----------------------------------------------------------
     CASETE ARRASTRABLE — FÍSICA GPU / MÁS PESADA
     ---------------------------------------------------------- */
  const CASSETTE_POS_KEY = 'maye-mini-cassette-position-v1';

  let cassetteDragging = false;
  let cassetteMoved = false;

  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Posición absoluta ya "guardada".
  let cassetteBaseX = 0;
  let cassetteBaseY = 0;

  // Movimiento temporal por GPU.
  let cassetteVisualX = 0;
  let cassetteVisualY = 0;
  let cassetteTargetX = 0;
  let cassetteTargetY = 0;

  let cassetteVX = 0;
  let cassetteVY = 0;

  let previousPointerX = 0;
  let previousPointerY = 0;
  let previousPointerTime = 0;

  let cassettePhysicsFrame = null;
  let cassettePhysicsMode = 'idle';

  function getCassetteSize() {
    return {
      width: miniCassette.offsetWidth,
      height: miniCassette.offsetHeight
    };
  }

  function getCassetteBounds() {
    const size = getCassetteSize();
    const pad = 8;

    return {
      minX: pad,
      minY: pad,
      maxX: Math.max(
        pad,
        window.innerWidth - size.width - pad
      ),
      maxY: Math.max(
        pad,
        window.innerHeight - size.height - pad
      )
    };
  }

  function clampXY(x, y) {
    const bounds = getCassetteBounds();

    return {
      x: Math.min(
        Math.max(bounds.minX, x),
        bounds.maxX
      ),
      y: Math.min(
        Math.max(bounds.minY, y),
        bounds.maxY
      )
    };
  }

  function setBasePosition(x, y) {
    const safe = clampXY(x, y);

    cassetteBaseX = safe.x;
    cassetteBaseY = safe.y;

    miniCassette.style.right = 'auto';
    miniCassette.style.bottom = 'auto';
    miniCassette.style.left = `${cassetteBaseX}px`;
    miniCassette.style.top = `${cassetteBaseY}px`;
  }

  function renderCassette(
    absoluteX,
    absoluteY,
    rotation = 0,
    scale = 1
  ) {
    /*
      left/top quedan quietos.
      El movimiento visible ocurre únicamente con translate3d,
      mucho más barato para el navegador.
    */
    const tx = absoluteX - cassetteBaseX;
    const ty = absoluteY - cassetteBaseY;

    miniCassette.style.transform =
      `translate3d(${tx}px, ${ty}px, 0) ` +
      `rotate(${rotation}deg) scale(${scale})`;
  }

  function commitCassettePosition(x, y) {
    const safe = clampXY(x, y);

    setBasePosition(safe.x, safe.y);

    cassetteVisualX = safe.x;
    cassetteVisualY = safe.y;
    cassetteTargetX = safe.x;
    cassetteTargetY = safe.y;

    miniCassette.style.transform =
      'translate3d(0,0,0) rotate(0deg) scale(1)';
  }

  function saveCassettePosition() {
    localStorage.setItem(
      CASSETTE_POS_KEY,
      JSON.stringify({
        left: cassetteVisualX,
        top: cassetteVisualY
      })
    );
  }

  function restoreCassettePosition() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CASSETTE_POS_KEY) || 'null'
      );

      if (
        saved &&
        Number.isFinite(saved.left) &&
        Number.isFinite(saved.top)
      ) {
        commitCassettePosition(
          saved.left,
          saved.top
        );

        return;
      }
    } catch (error) {}

    const rect = miniCassette.getBoundingClientRect();

    commitCassettePosition(
      rect.left,
      rect.top
    );
  }

  function stopCassettePhysics() {
    if (cassettePhysicsFrame) {
      cancelAnimationFrame(cassettePhysicsFrame);
      cassettePhysicsFrame = null;
    }

    cassettePhysicsMode = 'idle';
  }

  function settleCassette() {
    cassettePhysicsMode = 'idle';

    commitCassettePosition(
      cassetteVisualX,
      cassetteVisualY
    );

    saveCassettePosition();

    // El "acomodo" ocurre en una pieza interna para no pelear
    // con el transform que mueve el cassette.
    const face =
      miniCassette.querySelector('.mini-cassette__label');

    if (face && window.gsap) {
      gsap.fromTo(
        face,
        {
          rotate: cassetteVX > 0 ? .7 : -.7
        },
        {
          rotate: 0,
          duration: .42,
          ease: 'elastic.out(1, .5)',
          overwrite: 'auto'
        }
      );
    }
  }

  function cassettePhysicsLoop() {
    cassettePhysicsFrame =
      requestAnimationFrame(cassettePhysicsLoop);

    if (cassettePhysicsMode === 'drag') {
      /*
        0.38 da un pequeño retraso agradable.
        Antes seguía el mouse 1:1 y se sentía liviano.
      */
      const follow = .38;

      cassetteVisualX +=
        (cassetteTargetX - cassetteVisualX) * follow;

      cassetteVisualY +=
        (cassetteTargetY - cassetteVisualY) * follow;

      const tilt = Math.max(
        -4.2,
        Math.min(4.2, cassetteVX * .30)
      );

      renderCassette(
        cassetteVisualX,
        cassetteVisualY,
        tilt,
        1.012
      );

      return;
    }

    if (cassettePhysicsMode === 'inertia') {
      const bounds = getCassetteBounds();

      /*
        Velocidad más baja y fricción mayor:
        ahora se siente un poquito más pesado.
      */
      cassetteVisualX += cassetteVX;
      cassetteVisualY += cassetteVY;

      const bounce = -.24;

      if (cassetteVisualX < bounds.minX) {
        cassetteVisualX = bounds.minX;
        cassetteVX *= bounce;
      }

      if (cassetteVisualX > bounds.maxX) {
        cassetteVisualX = bounds.maxX;
        cassetteVX *= bounce;
      }

      if (cassetteVisualY < bounds.minY) {
        cassetteVisualY = bounds.minY;
        cassetteVY *= bounce;
      }

      if (cassetteVisualY > bounds.maxY) {
        cassetteVisualY = bounds.maxY;
        cassetteVY *= bounce;
      }

      cassetteVX *= .875;
      cassetteVY *= .875;

      const tilt = Math.max(
        -3.3,
        Math.min(3.3, cassetteVX * .34)
      );

      renderCassette(
        cassetteVisualX,
        cassetteVisualY,
        tilt,
        1
      );

      if (
        Math.abs(cassetteVX) < .055 &&
        Math.abs(cassetteVY) < .055
      ) {
        stopCassettePhysics();
        settleCassette();
      }
    }
  }

  function ensureCassettePhysicsLoop() {
    if (!cassettePhysicsFrame) {
      cassettePhysicsFrame =
        requestAnimationFrame(cassettePhysicsLoop);
    }
  }

  restoreCassettePosition();

  miniCassette.addEventListener(
    'pointerdown',
    event => {
      if (event.target.closest('button')) return;

      stopCassettePhysics();

      /*
        Si había una transformación visual pendiente,
        consolidamos su posición una única vez.
      */
      const rect =
        miniCassette.getBoundingClientRect();

      commitCassettePosition(
        rect.left,
        rect.top
      );

      cassetteDragging = true;
      cassetteMoved = false;
      cassettePhysicsMode = 'drag';

      dragOffsetX =
        event.clientX - cassetteVisualX;

      dragOffsetY =
        event.clientY - cassetteVisualY;

      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      previousPointerTime = performance.now();

      cassetteVX = 0;
      cassetteVY = 0;

      miniCassette.classList.add(
        'is-dragging'
      );

      miniCassette.setPointerCapture?.(
        event.pointerId
      );

      ensureCassettePhysicsLoop();

      event.preventDefault();
    }
  );

  miniCassette.addEventListener(
    'pointermove',
    event => {
      if (!cassetteDragging) return;

      const now = performance.now();
      const dt = Math.max(
        10,
        now - previousPointerTime
      );

      const dx =
        event.clientX - previousPointerX;

      const dy =
        event.clientY - previousPointerY;

      /*
        Menos multiplicador que antes:
        el lanzamiento posterior es más pesado.
      */
      const rawVX = (dx / dt) * 9.0;
      const rawVY = (dy / dt) * 9.0;

      // Promedio suave = menos microtirones.
      cassetteVX =
        cassetteVX * .58 +
        rawVX * .42;

      cassetteVY =
        cassetteVY * .58 +
        rawVY * .42;

      const desired = clampXY(
        event.clientX - dragOffsetX,
        event.clientY - dragOffsetY
      );

      cassetteTargetX = desired.x;
      cassetteTargetY = desired.y;

      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      previousPointerTime = now;

      cassetteMoved = true;

      event.preventDefault();
    }
  );

  function finishCassetteDrag(event) {
    if (!cassetteDragging) return;

    cassetteDragging = false;

    miniCassette.classList.remove(
      'is-dragging'
    );

    miniCassette.releasePointerCapture?.(
      event.pointerId
    );

    if (!cassetteMoved) {
      stopCassettePhysics();
      settleCassette();
      return;
    }

    /*
      Un pequeño "peso":
      no conserva el 100% de la velocidad de la mano.
    */
    cassetteVX *= .72;
    cassetteVY *= .72;

    cassetteVX = Math.max(
      -8.5,
      Math.min(8.5, cassetteVX)
    );

    cassetteVY = Math.max(
      -8.5,
      Math.min(8.5, cassetteVY)
    );

    cassettePhysicsMode = 'inertia';

    ensureCassettePhysicsLoop();
  }

  miniCassette.addEventListener(
    'pointerup',
    finishCassetteDrag
  );

  miniCassette.addEventListener(
    'pointercancel',
    finishCassetteDrag
  );

  miniCassette.addEventListener(
    'touchstart',
    event => event.stopPropagation(),
    { passive: true }
  );

  miniCassette.addEventListener(
    'touchend',
    event => event.stopPropagation(),
    { passive: true }
  );

  window.addEventListener('resize', () => {
    stopCassettePhysics();

    const safe = clampXY(
      cassetteVisualX,
      cassetteVisualY
    );

    commitCassettePosition(
      safe.x,
      safe.y
    );

    saveCassettePosition();
  });


  // Entrada suave con GSAP.
  if (window.gsap) {
    gsap.to(miniCassette, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: .85,
      delay: .35,
      ease: 'power3.out'
    });

    const cassetteFace =
      miniCassette.querySelector('.mini-cassette__label');

    if (cassetteFace) {
      miniCassette.addEventListener('mouseenter', () => {
        if (cassetteDragging) return;

        gsap.to(cassetteFace, {
          y: -1.5,
          scale: 1.006,
          duration: .22,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      miniCassette.addEventListener('mouseleave', () => {
        if (cassetteDragging) return;

        gsap.to(cassetteFace, {
          y: 0,
          scale: 1,
          duration: .28,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    }
  } else {
    miniCassette.style.opacity = '1';
    miniCassette.style.transform = 'none';
  }

  function formatTime(value) {
    if (!Number.isFinite(value)) return '--:--';
    const min = Math.floor(value / 60);
    const sec = Math.floor(value % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  function syncMiniPlayer() {
    const playing = !loveSong.paused;

    miniPlayIcon.textContent = playing ? '❚❚' : '▶';
    miniReelLeft?.classList.toggle('is-spinning', playing);
    miniReelRight?.classList.toggle('is-spinning', playing);

    const duration = loveSong.duration;
    const progress = Number.isFinite(duration) && duration > 0
      ? (loveSong.currentTime / duration) * 100
      : 0;

    if (miniProgress) miniProgress.style.width = `${progress}%`;

    if (miniTime) {
      miniTime.textContent =
        `${formatTime(loveSong.currentTime)} / ${formatTime(duration)}`;
    }
  }

  miniPlay?.addEventListener('click', async (event) => {
    event.stopPropagation();

    if (loveSong.paused) {
      try {
        ensureBeatFlowers();

        if (loveSong.currentTime < .5) resetLyrics();
        loveSong.playbackRate = MUSIC_SPEED;
        loveSong.volume = MUSIC_VOLUME;
        await loveSong.play();
        updateLyrics();

        if (window.gsap) {
          gsap.fromTo(
            miniCassette,
            { scale: .96 },
            { scale: 1, duration: .35, ease: 'back.out(2)' }
          );
        }
      } catch (error) {
        triggerSecretToast('falta DanielCaesar-Superpowers.mp3 ♡');
      }
    } else {
      loveSong.pause();
    }

    syncMiniPlayer();
  });

  loveSong.addEventListener('play', syncMiniPlayer);
  loveSong.addEventListener('pause', syncMiniPlayer);
  loveSong.addEventListener('timeupdate', syncMiniPlayer);
  loveSong.addEventListener('loadedmetadata', syncMiniPlayer);
  loveSong.addEventListener('ended', syncMiniPlayer);

  syncMiniPlayer();

  // Mejora ligera de transición de secciones con GSAP, sin cambiar su diseño.
  romanticSections?.forEach(section => {
    section.addEventListener('transitionend', () => {
      if (!section.classList.contains('section-active') || !window.gsap) return;

      const content = [...section.children].filter(el =>
        !el.classList.contains('section-flower')
      );

      gsap.fromTo(
        content,
        { opacity: .6, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: .5,
          stagger: .04,
          ease: 'power2.out',
          overwrite: true
        }
      );
    });
  });
});


/* ==========================================================
   LOGO FLORAL
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const flowerLogo = document.querySelector('.site-flower-logo');

  flowerLogo?.addEventListener('click', event => {
    event.preventDefault();

    if (typeof goToSection === 'function' && currentSection !== 0) {
      goToSection(0);
    }

    if (window.gsap) {
      gsap.fromTo(
        flowerLogo,
        { rotate: -10, scale: .9 },
        {
          rotate: 0,
          scale: 1,
          duration: .5,
          ease: 'back.out(2)'
        }
      );
    }
  });
});


/* ==========================================================
   PAPEL FIJO — no seleccionable ni copiable con el mouse
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const FIXED_PAPER_SELECTOR = [
    '.env-letter',
    '#letter .deckled-paper',
    '#poem .deckled-paper',
    '.song-paper'
  ].join(',');

  document.addEventListener('copy', event => {
    if (event.target.closest?.(FIXED_PAPER_SELECTOR)) {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', event => {
    if (event.target.closest?.(FIXED_PAPER_SELECTOR)) {
      event.preventDefault();
    }
  });

  document.addEventListener('contextmenu', event => {
    if (event.target.closest?.(FIXED_PAPER_SELECTOR)) {
      event.preventDefault();
    }
  });
});



/* ==========================================================
   CALIBRADOR DE SINCRONIZACIÓN
   Dos puntos corrigen offset + pequeñas diferencias de tiempo.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const miniCassette = document.getElementById('mini-cassette');

  if (!miniCassette || typeof loveSong === 'undefined') return;

  const syncButton = document.createElement('button');
  syncButton.type = 'button';
  syncButton.className = 'cassette-sync-button';
  syncButton.textContent = 'SYNC';
  syncButton.setAttribute('aria-label', 'Calibrar letra con la canción');

  miniCassette.appendChild(syncButton);

  const panel = document.createElement('div');
  panel.className = 'lyrics-sync-panel';
  panel.innerHTML = `
    <div class="lyrics-sync-card">
      <div class="lyrics-sync-title">Sincronizar letra ♡</div>
      <div class="lyrics-sync-step" id="lyrics-sync-step">
        Vamos a marcar dos frases de tu MP3.
      </div>

      <div class="lyrics-sync-quote" id="lyrics-sync-quote">
        Esto tarda menos de un minuto.
      </div>

      <div class="lyrics-sync-actions">
        <button type="button" id="lyrics-sync-cancel">Cancelar</button>
        <button type="button" id="lyrics-sync-mark">Empezar</button>
      </div>

      <div class="lyrics-sync-help">
        Cuando escuches exactamente la frase indicada, tocá <b>MARCAR</b>.
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const stepText = panel.querySelector('#lyrics-sync-step');
  const quoteText = panel.querySelector('#lyrics-sync-quote');
  const markButton = panel.querySelector('#lyrics-sync-mark');
  const cancelButton = panel.querySelector('#lyrics-sync-cancel');

  /*
    Puntos bastante separados:
    - corrigen el inicio;
    - corrigen cualquier pequeño drift de tu versión.
  */
  const anchors = [
    {
      cueTime: 0.80,
      seekTime: 0,
      quote: '“Oh, you got power…”'
    },
    {
      cueTime: 51.95,
      seekTime: 47,
      quote: '“Lift your head to the sky”'
    }
  ];

  let calibrationStep = -1;
  let marks = [];
  let savedTime = 0;
  let wasPlaying = false;

  function closeSyncPanel(restore = true) {
    panel.classList.remove('show');

    if (restore) {
      loveSong.pause();
      loveSong.currentTime = Math.min(
        savedTime,
        Number.isFinite(loveSong.duration)
          ? loveSong.duration
          : savedTime
      );

      if (wasPlaying) {
        loveSong.play().catch(() => {});
      }
    }

    calibrationStep = -1;
    marks = [];
  }

  async function startAnchor(index) {
    calibrationStep = index;

    const anchor = anchors[index];

    stepText.textContent =
      `Paso ${index + 1} de ${anchors.length}`;

    quoteText.textContent = anchor.quote;
    markButton.textContent = 'MARCAR';

    loveSong.pause();
    loveSong.currentTime = anchor.seekTime;

    try {
      await loveSong.play();
    } catch (error) {}
  }

  function finishCalibration() {
    const actual1 = marks[0];
    const actual2 = marks[1];

    const cue1 = anchors[0].cueTime;
    const cue2 = anchors[1].cueTime;

    const actualSpan = actual2 - actual1;
    const cueSpan = cue2 - cue1;

    if (actualSpan <= 5) {
      stepText.textContent = 'Las marcas quedaron demasiado juntas.';
      quoteText.textContent = 'Probemos otra vez.';
      markButton.textContent = 'Reintentar';
      calibrationStep = -1;
      marks = [];
      return;
    }

    const scale = cueSpan / actualSpan;
    const offset = cue1 - scale * actual1;

    /*
      Protección contra un click accidental.
      Las distintas ediciones deberían seguir muy cerca de 1.0.
    */
    if (scale < .94 || scale > 1.06 || offset < -5 || offset > 5) {
      stepText.textContent = 'Una marca quedó fuera de lugar.';
      quoteText.textContent = 'Hagámoslo de nuevo con calma.';
      markButton.textContent = 'Reintentar';
      calibrationStep = -1;
      marks = [];
      return;
    }

    SYNC_SCALE = scale;
    SYNC_OFFSET = offset;

    localStorage.setItem(
      LYRIC_SYNC_KEY,
      JSON.stringify({
        scale: SYNC_SCALE,
        offset: SYNC_OFFSET
      })
    );

    stepText.textContent = 'Listo ♡';
    quoteText.textContent =
      `Sincronización guardada · ${SYNC_OFFSET >= 0 ? '+' : ''}${SYNC_OFFSET.toFixed(2)} s`;

    markButton.textContent = 'Cerrar';

    calibrationStep = 99;

    updateLyrics();

    setTimeout(() => {
      closeSyncPanel(true);
      triggerSecretToast('letra sincronizada con tu MP3 ♡');
    }, 1100);
  }

  syncButton.addEventListener('click', event => {
    event.stopPropagation();

    savedTime = loveSong.currentTime;
    wasPlaying = !loveSong.paused;

    panel.classList.add('show');

    stepText.textContent = 'Vamos a calibrar tu MP3';
    quoteText.textContent =
      'Primero vamos al comienzo de la canción.';

    markButton.textContent = 'Empezar';

    calibrationStep = -1;
    marks = [];
  });

  markButton.addEventListener('click', async () => {
    if (calibrationStep === 99) {
      closeSyncPanel(true);
      return;
    }

    if (calibrationStep === -1) {
      await startAnchor(0);
      return;
    }

    marks[calibrationStep] = loveSong.currentTime;

    if (calibrationStep === 0) {
      loveSong.pause();

      stepText.textContent = 'Primera marca guardada ✓';
      quoteText.textContent =
        'Ahora saltamos cerca del coro.';

      markButton.textContent = 'Continuar';

      calibrationStep = -2;
      return;
    }

    if (calibrationStep === -2) {
      await startAnchor(1);
      return;
    }

    if (calibrationStep === 1) {
      loveSong.pause();
      finishCalibration();
    }
  });

  cancelButton.addEventListener('click', () => {
    closeSyncPanel(true);
  });

  panel.addEventListener('click', event => {
    if (event.target === panel) {
      closeSyncPanel(true);
    }
  });
});

