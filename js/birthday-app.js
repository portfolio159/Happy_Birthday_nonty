/**
 * Birthday App — Dynamic functionality for Nonty's birthday celebration website.
 * Handles mystery countdown stages, photo gallery empty states, voice recorder, and RSVP form.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderStages();
  startCountdownTicker();
  renderGallery();
  initVoiceRecorder();
  initRSVPForm();
});

/* =========================================================================
   1. STAGES RENDERING & MYSTERY COUNTDOWN
   ========================================================================= */

/**
 * Returns default unlock ISO string if none set in localStorage.
 * Stage 2: Friday Oct 30, 2026 at 19:00 (7:00 PM)
 * Stage 3: Saturday Oct 31, 2026 at 06:30 AM
 */
function getStageUnlockTime(stageNum) {
  const stored = localStorage.getItem('stage' + stageNum + '_unlock_time');
  if (stored) return stored;

  if (stageNum === 2) return '2026-10-30T19:00';
  if (stageNum === 3) return '2026-10-31T06:30';
  return '';
}

/**
 * Checks whether a stage is unlocked.
 * A stage is unlocked if:
 * 1. Manually forced visible via localStorage ('stageX_visible' === 'true')
 * 2. OR current time has passed the target unlock time (and not manually forced 'false')
 */
function isStageUnlocked(stageNum) {
  const manualVisible = localStorage.getItem('stage' + stageNum + '_visible');
  if (manualVisible === 'true') return true;
  if (manualVisible === 'false') return false;

  const unlockTimeStr = getStageUnlockTime(stageNum);
  if (!unlockTimeStr) return false;

  const target = new Date(unlockTimeStr).getTime();
  if (isNaN(target)) return false;

  return Date.now() >= target;
}

/**
 * Renders the 3 birthday stage cards into #stages-container.
 * When a stage is locked, ALL specific details (venue, destination, schedule)
 * are concealed behind an exciting Mystery Countdown Card.
 */
function renderStages() {
  const container = document.getElementById('stages-container');
  if (!container) return;

  const stage2Unlocked = isStageUnlocked(2);
  const stage3Unlocked = isStageUnlocked(3);

  const stages = [
    // Stage 1: Always Unlocked
    {
      svg: 'img/shape-rect-wedding-event-1.svg',
      title: 'Unwrap Your Gift 🎁',
      subtitle: 'Stage 1 • Open With Love',
      description: 'A special birthday gift chosen just for you with all my heart. Enjoy every single moment of it and let the celebration begin!',
      badgeText: 'Available Now ✨',
      badgeClass: 'bg-primary',
      isLocked: false,
      countdownStage: null,
    },
    // Stage 2: Friday Date (Concealed when locked)
    {
      svg: 'img/shape-rect-wedding-event-2.svg',
      title: stage2Unlocked ? 'Our Special Date 💕' : 'Mystery Surprise',
      subtitle: stage2Unlocked ? 'Stage 2 • Friday Evening' : 'Stage 2 • Surprise Locked',
      description: stage2Unlocked
        ? 'Get dressed up for an unforgettable evening together! A romantic date planned with all the special details you adore.'
        : 'A special surprise prepared just for you with love. What could it be? The secret will unlock right here when the timer ends! ✨',
      badgeText: '🎉 Unlocked & Ready!',
      badgeClass: 'bg-success',
      isLocked: !stage2Unlocked,
      countdownStage: 2,
    },
    // Stage 3: Alexandria Adventure (Concealed when locked)
    {
      svg: 'img/shape-rect-wedding-event-1.svg',
      title: stage3Unlocked ? 'Alexandria Adventure 🌊' : 'Secret Surprise',
      subtitle: stage3Unlocked ? 'Saturday • 06:30 AM Sharp' : 'Stage 3 • Surprise Locked',
      description: stage3Unlocked
        ? 'Pack your bag and set your alarm! We are hitting the road at 6:30 AM sharp for a full day of sea, fresh air, and unforgettable surprises.'
        : 'Another exciting surprise is waiting for you! All the details will be revealed right here when the countdown reaches zero! 🎁✨',
      badgeText: '🌅 Unlocked & Ready!',
      badgeClass: 'bg-success',
      isLocked: !stage3Unlocked,
      countdownStage: 3,
    },
  ];

  container.innerHTML = stages.map((stage) => {
    const lockIcon = stage.isLocked
      ? `<div class="stage-lock-icon mb-2">🔒</div>`
      : '';

    let countdownHtml = '';
    if (stage.isLocked && stage.countdownStage) {
      const sNum = stage.countdownStage;
      countdownHtml = `
        <div class="stage-countdown-box">
          <div class="stage-countdown-title">
            <span>⏳</span>
            <span>Surprise Unlocks In:</span>
          </div>
          <div class="stage-countdown-timer">
            <div class="stage-countdown-unit">
              <span class="num" id="s${sNum}-days">00</span>
              <span class="lbl">Days</span>
            </div>
            <span class="stage-colon">:</span>
            <div class="stage-countdown-unit">
              <span class="num" id="s${sNum}-hours">00</span>
              <span class="lbl">Hours</span>
            </div>
            <span class="stage-colon">:</span>
            <div class="stage-countdown-unit">
              <span class="num" id="s${sNum}-mins">00</span>
              <span class="lbl">Mins</span>
            </div>
            <span class="stage-colon">:</span>
            <div class="stage-countdown-unit">
              <span class="num" id="s${sNum}-secs">00</span>
              <span class="lbl">Secs</span>
            </div>
          </div>
          <div class="stage-mystery-tag">🔒 Surprise Locked</div>
        </div>`;
    }

    // Only render separate bottom badge if unlocked
    const badgeHtml = !stage.isLocked
      ? `<div class="mt-3"><span class="badge ${stage.badgeClass} px-4 py-2 rounded-pill fs-7 shadow-sm">${stage.badgeText}</span></div>`
      : '';

    // Delicate divider for unlocked stage to fill the space beautifully
    const midDividerHtml = !stage.isLocked
      ? `<span class="divider divider-floral my-3"></span>`
      : '';

    return `
      <div class="col-12 col-md-6 col-xl-4 mb-5 mb-xl-0">
        <div class="position-relative h-100">
          <div class="d-flex flex-column h-100 justify-content-center position-absolute start-0 text-center top-0 w-100 px-3 px-sm-4 py-4 z-2">
            <div class="px-2">
              <span class="divider divider-heart mb-3"></span>
              <h3 class="font-alt fs-2 mb-1">${stage.title}</h3>
              <h4 class="font-alt fs-5 text-primary mb-2">${stage.subtitle}</h4>
              ${midDividerHtml}
              <p class="lead mb-2 text-body-secondary fs-7" style="line-height: 1.6; max-width: 290px; margin: 0 auto;">${stage.description}</p>
              ${countdownHtml}
              ${badgeHtml}
            </div>
          </div>
          <img src="${stage.svg}" alt="" class="img-fluid w-100">
        </div>
      </div>`;
  }).join('');

  // Immediate countdown tick right after rendering
  tickCountdowns();
}

/**
 * Ticks the countdown clocks for locked stages.
 */
function tickCountdowns() {
  [2, 3].forEach((stageNum) => {
    if (isStageUnlocked(stageNum)) return;

    const unlockTimeStr = getStageUnlockTime(stageNum);
    if (!unlockTimeStr) return;

    const target = new Date(unlockTimeStr).getTime();
    const diff = target - Date.now();

    if (diff <= 0) {
      // Countdown reached zero -> re-render to unlock automatically!
      renderStages();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const dEl = document.getElementById(`s${stageNum}-days`);
    const hEl = document.getElementById(`s${stageNum}-hours`);
    const mEl = document.getElementById(`s${stageNum}-mins`);
    const sEl = document.getElementById(`s${stageNum}-secs`);

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  });
}

let countdownInterval = null;
function startCountdownTicker() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(tickCountdowns, 1000);
}


/* =========================================================================
   2. PHOTO GALLERY (With Romantic Empty State When No Photos)
   ========================================================================= */

/**
 * Renders the photo gallery grid into #gallery-grid-container.
 * If no photos have been added yet, renders an elegant romantic placeholder
 * saying memories will be added soon.
 */
function renderGallery() {
  const container = document.getElementById('gallery-grid-container');
  if (!container) return;

  let photos = [];
  try {
    const stored = localStorage.getItem('gallery_photos');
    if (stored) photos = JSON.parse(stored);
  } catch (_) {
    /* ignore malformed JSON */
  }

  // If no photos uploaded yet -> Show Romantic "Coming Soon" placeholder
  if (!photos || photos.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="gallery-empty-card text-center">
          <span class="empty-gallery-icon mb-3">📸✨</span>
          <h3 class="font-alt fs-2 text-primary mb-2">Our Memories Are Coming Soon... 💕</h3>
          <p class="fs-6 text-body-secondary mb-4" style="line-height: 1.8; max-width: 520px; margin: 0 auto;">
            Every sweet smile and unforgettable moment will be documented and displayed here as our celebration begins! Stay tuned for beautiful memories. ✨
          </p>
          <div class="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill bg-white shadow-sm" style="border: 1px solid rgba(184, 67, 81, 0.2);">
            <span class="text-primary fw-semibold" style="font-size: 0.9rem;">🌸 Photos will appear right here as we celebrate</span>
          </div>
        </div>
      </div>`;
    return;
  }

  // Render photo grid
  container.innerHTML = photos.map((photo) => `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <a href="${photo.src}" class="venobox d-block h-100 text-decoration-none" data-gall="gallery" data-title="${photo.caption || ''}">
        <figure class="rounded-4 overflow-hidden shadow-sm m-0 position-relative" style="aspect-ratio: 1; background: #fdf2f4;">
          <img src="${photo.src}" alt="${photo.caption || ''}" class="img-fluid w-100 h-100" style="object-fit: cover;">
          <div class="position-absolute bottom-0 start-0 w-100 p-2 text-white text-center" style="background: linear-gradient(transparent, rgba(0,0,0,0.65)); font-size: 0.85rem;">
            <span>${photo.caption || ''}</span>
          </div>
        </figure>
      </a>
    </div>`).join('');

  // Initialise Venobox lightbox if available
  if (typeof window.VenoBox === 'function') {
    new window.VenoBox({
      selector: '.venobox',
      numeration: true,
      infinigall: true,
      share: false,
      spinner: 'rotating-plane'
    });
  }
}


/* =========================================================================
   3. VOICE RECORDER (Cross-Browser Safari & Chrome MediaRecorder)
   ========================================================================= */

/**
 * Returns the best supported audio MIME type for the client browser.
 * Safari on macOS / iOS requires audio/mp4 or audio/aac.
 * Chrome / Firefox prefer audio/webm.
 */
function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=aac',
    'audio/mp4',
    'audio/aac',
    'audio/ogg'
  ];
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
  }
  return '';
}

/**
 * Initialises the voice recorder controls.
 */
function initVoiceRecorder() {
  const recordBtn = document.getElementById('record-btn');
  const stopBtn = document.getElementById('stop-record-btn');
  const deleteBtn = document.getElementById('delete-record-btn');
  const timerEl = document.getElementById('record-timer');
  const statusEl = document.getElementById('record-status');
  const previewContainer = document.getElementById('audio-preview-container');
  const previewAudio = document.getElementById('audio-preview');

  if (!recordBtn || !stopBtn) return;

  let mediaRecorder = null;
  let audioChunks = [];
  let timerInterval = null;
  let elapsedSeconds = 0;
  /** @type {Blob|null} */
  let recordedBlob = null;

  function formatTime(totalSeconds) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedSeconds = 0;
    if (timerEl) timerEl.textContent = '00:00';
  }

  function setIdleState() {
    recordBtn.classList.remove('d-none');
    stopBtn.classList.add('d-none');
    recordBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';

    if (statusEl && !recordedBlob) {
      statusEl.textContent = 'Tap above to start recording a voice note with your microphone.';
      statusEl.classList.remove('text-danger');
    }
    resetTimer();
  }

  // Ensure initial display state is guaranteed (no overlap!)
  recordBtn.style.display = 'inline-flex';
  stopBtn.style.display = 'none';

  // Start Recording
  recordBtn.addEventListener('click', async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (statusEl) statusEl.textContent = 'Audio recording is not supported in this browser.';
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : {};

      mediaRecorder = new MediaRecorder(stream, options);
      const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/mp4';
      audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        stream.getTracks().forEach((t) => t.stop());

        recordedBlob = new Blob(audioChunks, { type: actualMimeType });

        // If recording was empty or tapped too quickly
        if (!recordedBlob || recordedBlob.size < 100) {
          recordedBlob = null;
          setIdleState();
          if (statusEl) {
            statusEl.innerHTML = '<span class="text-danger fw-semibold">⚠️ Recording was empty. Please speak into your mic and try again!</span>';
          }
          return;
        }

        const blobUrl = URL.createObjectURL(recordedBlob);

        if (previewAudio) {
          previewAudio.src = blobUrl;
          previewAudio.load();
          previewAudio.onerror = () => {
            console.warn('Audio preview format warning, fallback active');
          };
        }
        if (previewContainer) previewContainer.classList.remove('d-none');
        if (deleteBtn) deleteBtn.classList.remove('d-none');

        setIdleState();
        if (statusEl) {
          statusEl.innerHTML = '<span class="text-success fw-semibold">✓ Voice note recorded! Tap play to listen. 🎵</span>';
        }
      });

      // Collect data every 100ms
      mediaRecorder.start(100);

      recordBtn.classList.add('d-none');
      stopBtn.classList.remove('d-none');
      recordBtn.style.display = 'none';
      stopBtn.style.display = 'inline-flex';

      if (deleteBtn) deleteBtn.classList.add('d-none');
      if (previewContainer) previewContainer.classList.add('d-none');

      if (statusEl) {
        statusEl.innerHTML = '<span class="text-danger fw-bold">● Recording now… Speak into your mic! 🎙️</span>';
      }

      elapsedSeconds = 0;
      if (timerEl) timerEl.textContent = '00:00';
      timerInterval = setInterval(() => {
        elapsedSeconds++;
        if (timerEl) timerEl.textContent = formatTime(elapsedSeconds);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      if (statusEl) {
        statusEl.innerHTML = '<span class="text-danger">⚠️ Microphone access was not granted. Please enable microphone permissions in your browser.</span>';
      }
    }
  });

  // Stop Recording
  stopBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.requestData();
      } catch (_) {}
      mediaRecorder.stop();
    }
  });

  // Delete Recording
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      recordedBlob = null;
      audioChunks = [];

      if (previewAudio) {
        previewAudio.pause();
        previewAudio.removeAttribute('src');
        previewAudio.load();
      }
      if (previewContainer) previewContainer.classList.add('d-none');
      deleteBtn.classList.add('d-none');
      setIdleState();
      if (statusEl) {
        statusEl.textContent = 'Recording deleted. You can record a new one anytime.';
      }
    });
  }

  window.__getRecordedBlob = () => recordedBlob;
}


/* =========================================================================
   4. RSVP FORM SUBMISSION
   ========================================================================= */

/**
 * Handles RSVP form submission.
 * Saves responses to localStorage and shows smooth romantic celebration card.
 */
function initRSVPForm() {
  const form = document.getElementById('birthday-rsvp-form');
  const successAlert = document.getElementById('rsvp-success-alert');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const acceptedEl = document.getElementById('rsvp-accept-check');
    const noteEl = document.getElementById('rsvp-note');

    const accepted = acceptedEl ? acceptedEl.checked : true;
    const note = noteEl ? noteEl.value.trim() : '';

    let audioBase64 = null;
    const blob = typeof window.__getRecordedBlob === 'function' ? window.__getRecordedBlob() : null;

    if (blob) {
      audioBase64 = await blobToBase64(blob);
    }

    const entry = {
      accepted,
      note,
      audioBase64,
      timestamp: new Date().toISOString(),
    };

    let responses = [];
    try {
      const stored = localStorage.getItem('rsvp_responses');
      if (stored) responses = JSON.parse(stored);
    } catch (_) {
      /* ignore */
    }
    responses.push(entry);
    localStorage.setItem('rsvp_responses', JSON.stringify(responses));

    // Smooth transition: Hide form, show celebration card
    form.classList.add('d-none');
    if (successAlert) {
      successAlert.classList.remove('d-none');
      successAlert.style.opacity = '0';
      successAlert.style.transition = 'opacity 0.5s ease';
      void successAlert.offsetWidth;
      successAlert.style.opacity = '1';
    }
  });
}

/**
 * Converts a Blob to a base64-encoded data URL string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
