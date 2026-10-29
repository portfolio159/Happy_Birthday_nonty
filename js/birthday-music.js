/**
 * Birthday Background Music Controller — Happy Birthday Nonty 🎂🎶
 *
 * Implements smooth auto-play with browser policy handling:
 * 1. Tries immediate autoplay on page load.
 * 2. If blocked by browser autoplay policy, captures the very first user interaction
 *    (tap, click, scroll, touchstart) and starts the music immediately with smooth fade-in.
 * 3. Provides a floating interactive widget with rotating vinyl disc and animated equalizer bars.
 * 4. Smooth volume ramping (fade-in / fade-out) to avoid abrupt cuts.
 * 5. Automatically ducks/pauses background music when playing voice notes in the RSVP section.
 */

(function () {
  'use strict';

  const AUDIO_SRC = 'audio/audio.mp3';
  const TARGET_VOLUME = 0.65;
  let bgAudio = null;
  let isPlaying = false;
  let fadeInterval = null;
  let hasUserInteracted = false;

  function createAudioElement() {
    bgAudio = new Audio(AUDIO_SRC);
    bgAudio.id = 'bg-music-player';
    bgAudio.preload = 'auto';
    bgAudio.loop = true;
    bgAudio.volume = 0; // Start at 0 for smooth fade-in
  }

  function fadeIn(target = TARGET_VOLUME, durationMs = 1200) {
    clearInterval(fadeInterval);
    if (!bgAudio) return;
    const stepMs = 50;
    const steps = durationMs / stepMs;
    const volumeStep = target / steps;

    fadeInterval = setInterval(() => {
      if (!bgAudio) {
        clearInterval(fadeInterval);
        return;
      }
      if (bgAudio.volume + volumeStep < target) {
        bgAudio.volume += volumeStep;
      } else {
        bgAudio.volume = target;
        clearInterval(fadeInterval);
      }
    }, stepMs);
  }

  function fadeOut(durationMs = 600, callback) {
    clearInterval(fadeInterval);
    if (!bgAudio) {
      if (callback) callback();
      return;
    }
    const stepMs = 50;
    const steps = durationMs / stepMs;
    const volumeStep = bgAudio.volume / steps;

    fadeInterval = setInterval(() => {
      if (!bgAudio) {
        clearInterval(fadeInterval);
        if (callback) callback();
        return;
      }
      if (bgAudio.volume - volumeStep > 0) {
        bgAudio.volume -= volumeStep;
      } else {
        bgAudio.volume = 0;
        clearInterval(fadeInterval);
        bgAudio.pause();
        if (callback) callback();
      }
    }, stepMs);
  }

  function playMusic() {
    if (!bgAudio) return;
    const playPromise = bgAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          fadeIn(TARGET_VOLUME, 1200);
          updateUI(true);
        })
        .catch(() => {
          // Autoplay was prevented by browser policy until interaction
          isPlaying = false;
          updateUI(false, true);
          setupFirstInteractionListener();
        });
    }
  }

  function pauseMusic() {
    if (!bgAudio) return;
    isPlaying = false;
    updateUI(false);
    fadeOut(500);
  }

  function toggleMusic() {
    if (isPlaying) {
      pauseMusic();
      sessionStorage.setItem('music_user_paused', 'true');
    } else {
      sessionStorage.removeItem('music_user_paused');
      playMusic();
    }
  }

  function updateUI(playing, isBlocked = false) {
    const widget = document.getElementById('music-player-widget');
    const statusText = document.getElementById('music-status-text');
    if (!widget) return;

    if (playing) {
      widget.classList.add('is-playing');
      widget.classList.remove('is-paused', 'pending-interaction');
      if (statusText) statusText.textContent = 'Music On';
    } else if (isBlocked) {
      widget.classList.remove('is-playing');
      widget.classList.add('is-paused', 'pending-interaction');
      if (statusText) statusText.textContent = 'Play Music 🎵';
    } else {
      widget.classList.remove('is-playing', 'pending-interaction');
      widget.classList.add('is-paused');
      if (statusText) statusText.textContent = 'Paused 🔇';
    }
  }

  function setupFirstInteractionListener() {
    if (hasUserInteracted) return;

    const interactionEvents = ['click', 'touchstart', 'scroll', 'keydown', 'pointerdown'];

    function handleInteraction() {
      if (hasUserInteracted) return;
      hasUserInteracted = true;

      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleInteraction, { capture: true });
      });

      // If user hasn't explicitly clicked pause before, play now
      if (sessionStorage.getItem('music_user_paused') !== 'true') {
        playMusic();
      }
    }

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleInteraction, { capture: true, once: true });
    });
  }

  function createWidget() {
    if (document.getElementById('music-player-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'music-player-widget';
    widget.className = 'music-player-widget pending-interaction';
    widget.title = 'Background Birthday Music 🎵';
    widget.innerHTML = `
      <button id="music-toggle-btn" class="music-toggle-btn" aria-label="Toggle background music">
        <span class="music-disc-icon">
          <span class="music-disc-inner">🎵</span>
        </span>
        <span class="music-wave-bars">
          <span class="bar bar-1"></span>
          <span class="bar bar-2"></span>
          <span class="bar bar-3"></span>
          <span class="bar bar-4"></span>
        </span>
        <span class="music-status-text" id="music-status-text">Play Music 🎵</span>
      </button>
    `;

    document.body.appendChild(widget);

    const btn = document.getElementById('music-toggle-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusic();
      });
    }
  }

  function hookRsvpAudioDucking() {
    // When user plays voice recording preview in RSVP form, duck background music
    document.addEventListener('play', (e) => {
      if (e.target && e.target.id === 'audio-preview' && isPlaying && bgAudio) {
        bgAudio.volume = 0.12;
      }
    }, true);

    document.addEventListener('pause', (e) => {
      if (e.target && e.target.id === 'audio-preview' && isPlaying && bgAudio) {
        fadeIn(TARGET_VOLUME, 500);
      }
    }, true);

    document.addEventListener('ended', (e) => {
      if (e.target && e.target.id === 'audio-preview' && isPlaying && bgAudio) {
        fadeIn(TARGET_VOLUME, 500);
      }
    }, true);
  }

  function init() {
    createAudioElement();
    createWidget();
    hookRsvpAudioDucking();

    // Check if user previously paused in this session
    if (sessionStorage.getItem('music_user_paused') === 'true') {
      updateUI(false);
      return;
    }

    // Try immediate autoplay
    playMusic();

    // If autoplay was restricted by browser policy, first tap/scroll will trigger it
    setupFirstInteractionListener();
  }

  window.toggleBirthdayMusic = toggleMusic;
  window.playBirthdayMusic = playMusic;
  window.pauseBirthdayMusic = pauseMusic;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
