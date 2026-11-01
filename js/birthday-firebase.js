/**
 * Birthday Firebase Integration — Happy Birthday Nonty 🎂
 * Cloud synchronization for Photo Gallery, Cairo Stages/Countdown, and RSVP notes/voice.
 */

window.BirthdayFirebase = (function () {
  const firebaseConfig = {
    projectId: "nonty-birthday-2026",
    appId: "1:1066593263358:web:0641f1c34519405dc6cfaf",
    storageBucket: "nonty-birthday-2026.firebasestorage.app",
    apiKey: "AIzaSyCKkGymap1k8-ZOElEtPGCxu9tSK5SXgO0",
    authDomain: "nonty-birthday-2026.firebaseapp.com",
    messagingSenderId: "1066593263358"
  };

  let db = null;
  let isInitialized = false;

  function init() {
    if (isInitialized) return db;
    if (typeof firebase === 'undefined') {
      console.warn('[BirthdayFirebase] Firebase SDK not loaded, using offline fallback.');
      return null;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      isInitialized = true;
      console.log('[BirthdayFirebase] Cloud Firestore successfully connected! 🚀');
      return db;
    } catch (e) {
      console.warn('[BirthdayFirebase] Failed to initialize Firestore:', e);
      return null;
    }
  }

  // Auto-init if firebase is available
  if (typeof firebase !== 'undefined') {
    init();
  }

  /* ─────────────────────────────────────────────────────────────
     1. STAGES & COUNTDOWN CLOUD SYNC
     ───────────────────────────────────────────────────────────── */

  /**
   * Listen to settings/stages document in real time.
   * Updates local storage and triggers onUpdate callback.
   */
  function listenStages(onUpdate) {
    const firestore = init();
    if (!firestore) return () => {};

    try {
      return firestore.collection('settings').doc('stages').onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data() || {};
          
          if (data.stage2_visible !== undefined) {
            localStorage.setItem('stage2_visible', String(data.stage2_visible));
          }
          if (data.stage3_visible !== undefined) {
            localStorage.setItem('stage3_visible', String(data.stage3_visible));
          }
          if (data.stage2_unlock_time) {
            localStorage.setItem('stage2_unlock_time', String(data.stage2_unlock_time));
          }
          if (data.stage3_unlock_time) {
            localStorage.setItem('stage3_unlock_time', String(data.stage3_unlock_time));
          }
          if (data.secret_surprise_visible !== undefined) {
            localStorage.setItem('secret_surprise_visible', String(data.secret_surprise_visible));
          }
          if (data.secret_surprise_audio) {
            localStorage.setItem('secret_surprise_audio', String(data.secret_surprise_audio));
          }
          if (data.secret_surprise_custom) {
            localStorage.setItem('secret_surprise_custom', typeof data.secret_surprise_custom === 'string' ? data.secret_surprise_custom : JSON.stringify(data.secret_surprise_custom));
          }

          if (typeof onUpdate === 'function') {
            onUpdate(data);
          }
        }
      }, (err) => {
        console.warn('[BirthdayFirebase] stages listener warning:', err);
      });
    } catch (err) {
      console.warn('[BirthdayFirebase] listenStages error:', err);
      return () => {};
    }
  }

  /**
   * Save stages settings to Cloud Firestore.
   */
  async function saveStagesCloud(stagesData) {
    const firestore = init();
    if (!firestore) return false;

    try {
      const payload = {
        ...stagesData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await firestore.collection('settings').doc('stages').set(payload, { merge: true });
      return true;
    } catch (err) {
      console.error('[BirthdayFirebase] Error saving stages to cloud:', err);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     2. PHOTO GALLERY CLOUD SYNC
     ───────────────────────────────────────────────────────────── */

  /**
   * Listen to gallery collection in real time.
   * Calls onUpdate with array of { id, src, caption, createdAt }
   */
  function listenGallery(onUpdate) {
    const firestore = init();
    if (!firestore) return () => {};

    try {
      return firestore.collection('gallery')
        .orderBy('createdAt', 'asc')
        .onSnapshot((snapshot) => {
          const photos = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            photos.push({
              id: doc.id,
              src: data.src,
              caption: data.caption || '',
              createdAt: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt) : Date.now()
            });
          });

          // Sync to localStorage
          try {
            localStorage.setItem('gallery_photos', JSON.stringify(photos));
          } catch (_) {}

          if (typeof onUpdate === 'function') {
            onUpdate(photos);
          }
        }, (err) => {
          console.warn('[BirthdayFirebase] gallery listener warning:', err);
        });
    } catch (err) {
      console.warn('[BirthdayFirebase] listenGallery error:', err);
      return () => {};
    }
  }

  /**
   * Upload / Add a photo to Cloud Firestore gallery.
   */
  async function addPhotoCloud(photo) {
    const firestore = init();
    if (!firestore) return null;

    try {
      const docRef = await firestore.collection('gallery').add({
        src: photo.src,
        caption: photo.caption || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('[BirthdayFirebase] Error adding photo to cloud:', err);
      return null;
    }
  }

  /**
   * Delete photo from Cloud Firestore gallery by doc ID.
   */
  async function deletePhotoCloud(docId) {
    const firestore = init();
    if (!firestore) return false;

    try {
      await firestore.collection('gallery').doc(docId).delete();
      return true;
    } catch (err) {
      console.error('[BirthdayFirebase] Error deleting photo from cloud:', err);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     3. RSVP FORM & VOICE NOTE CLOUD SYNC
     ───────────────────────────────────────────────────────────── */

  /**
   * Submit RSVP to Cloud Firestore with automatic chunking for long/high-bitrate voice notes.
   */
  async function submitRSVPCloud(entry) {
    let cairoTime = '';
    try {
      cairoTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
      }).format(new Date()) + ' (Cairo 🇪🇬)';
    } catch (_) {
      cairoTime = new Date().toLocaleString();
    }

    const firestore = init();
    if (!firestore) {
      console.warn('[BirthdayFirebase] Firestore offline, saving RSVP to local fallback.');
      return false;
    }

    const rawAudio = entry.audioBase64 || null;
    const CHUNK_LIMIT = 600000; // 600KB chunks (well below Firestore 1MB document limit)

    try {
      if (rawAudio && rawAudio.length > CHUNK_LIMIT) {
        // Large audio: Split across subcollection chunks
        const chunks = [];
        for (let i = 0; i < rawAudio.length; i += CHUNK_LIMIT) {
          chunks.push(rawAudio.substring(i, i + CHUNK_LIMIT));
        }

        const payload = {
          accepted: Boolean(entry.accepted),
          note: String(entry.note || '').substring(0, 2000),
          hasAudio: true,
          audioChunksCount: chunks.length,
          audioBase64: null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          cairoTime: cairoTime
        };

        const docRef = await firestore.collection('rsvp').add(payload);
        console.log('[BirthdayFirebase] RSVP parent doc created:', docRef.id, 'with', chunks.length, 'chunks');

        // Write each chunk to subcollection
        for (let idx = 0; idx < chunks.length; idx++) {
          await docRef.collection('chunks').doc(String(idx)).set({
            chunkIndex: idx,
            data: chunks[idx],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        console.log('[BirthdayFirebase] All audio chunks uploaded successfully! 🎙️');
        return docRef.id;
      } else {
        // Standard audio: store inline in single document
        const payload = {
          accepted: Boolean(entry.accepted),
          note: String(entry.note || '').substring(0, 2000),
          hasAudio: Boolean(rawAudio),
          audioChunksCount: 0,
          audioBase64: rawAudio,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          cairoTime: cairoTime
        };

        const docRef = await firestore.collection('rsvp').add(payload);
        console.log('[BirthdayFirebase] RSVP saved to cloud with ID:', docRef.id);
        return docRef.id;
      }
    } catch (err) {
      console.error('[BirthdayFirebase] Error submitting RSVP to cloud:', err);
      return false;
    }
  }

  /**
   * Listen to RSVP collection in real time (for admin dashboard).
   * Automatically reassembles chunked audio if present.
   */
  function listenRSVPs(onUpdate) {
    const firestore = init();
    if (!firestore) return () => {};

    try {
      return firestore.collection('rsvp')
        .onSnapshot(async (snapshot) => {
          const rsvps = [];
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            let fullAudio = data.audioBase64 || null;

            // If audio was chunked into subcollection, fetch and reassemble
            if ((data.audioChunksCount > 0 || data.hasAudio) && !fullAudio) {
              try {
                const chunksSnap = await doc.ref.collection('chunks').get();
                if (!chunksSnap.empty) {
                  const sortedChunkDocs = chunksSnap.docs.sort((a, b) => {
                    return (a.data().chunkIndex || 0) - (b.data().chunkIndex || 0);
                  });
                  let assembled = '';
                  sortedChunkDocs.forEach((cDoc) => {
                    assembled += (cDoc.data().data || '');
                  });
                  fullAudio = assembled;
                }
              } catch (chunkErr) {
                console.warn('[BirthdayFirebase] Warning reading audio chunks for doc', doc.id, chunkErr);
              }
            }

            rsvps.push({
              id: doc.id,
              accepted: data.accepted,
              note: data.note || data.text || '',
              audioBase64: fullAudio,
              hasAudio: Boolean(fullAudio || data.hasAudio),
              cairoTime: data.cairoTime || '',
              timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : new Date().toISOString()
            });
          }

          // Sort descending by timestamp in JavaScript
          rsvps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          // Sync to localStorage
          try {
            localStorage.setItem('rsvp_responses', JSON.stringify(rsvps));
          } catch (_) {}

          if (typeof onUpdate === 'function') {
            onUpdate(rsvps);
          }
        }, (err) => {
          console.warn('[BirthdayFirebase] rsvp listener warning:', err);
        });
    } catch (err) {
      console.warn('[BirthdayFirebase] listenRSVPs error:', err);
      return () => {};
    }
  }

  /**
   * Delete an RSVP by doc ID (including any chunk subdocuments).
   */
  async function deleteRSVPCloud(docId) {
    const firestore = init();
    if (!firestore) return false;

    try {
      const docRef = firestore.collection('rsvp').doc(docId);
      const chunksSnap = await docRef.collection('chunks').get();
      if (!chunksSnap.empty) {
        const batch = firestore.batch();
        chunksSnap.forEach((cDoc) => {
          batch.delete(cDoc.ref);
        });
        batch.delete(docRef);
        await batch.commit();
      } else {
        await docRef.delete();
      }
      return true;
    } catch (err) {
      console.error('[BirthdayFirebase] Error deleting RSVP:', err);
      return false;
    }
  }

  return {
    init,
    getDb: () => db,
    listenStages,
    saveStagesCloud,
    listenGallery,
    addPhotoCloud,
    deletePhotoCloud,
    submitRSVPCloud,
    listenRSVPs,
    deleteRSVPCloud
  };
})();
