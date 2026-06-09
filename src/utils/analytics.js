/**
 * VM-tipset Analytics
 *
 * Integritetsfokuserat (cookie-fritt) beteendespårningssystem.
 * Porterat från Spotlight och anpassat för Firebase/Firestore + React SPA.
 *
 * GDPR:
 *  - Inga cookies. Session-ID lagras enbart i sessionStorage och raderas vid stängning.
 *  - Lagrar aldrig personuppgifter (PII). PII-filtret nedan blockerar känslig data.
 *
 * Arkitektur:
 *  - Händelser samlas i en kö och skickas i batchar till Firestore var 5:e sekund
 *    eller när kön når 20 händelser (för att minimera Firestore-skrivningar).
 *  - Firestore writeBatch används för atomiska batch-skrivningar.
 *  - Circuit breaker: max 200 händelser per session för att förhindra runaway-loopar.
 */

import { db } from '../firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

// --- KONFIGURATION ---
const APP_NAME = 'vm-tipset';
const MAX_EVENTS_SESSION = 200;
const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;
const HESITATION_THRESHOLD_MS = 10_000; // 10 sekunder

// --- INTERN STATE ---
let _queue = [];
let _sessionEventCount = 0;
let _flushTimer = null;

// PII-mönster som aldrig ska loggas
const PII_PATTERNS = [/password/i, /passwd/i, /token/i, /secret/i, /api.?key/i, /credit.?card/i, /ssn/i, /personnummer/i];

function _containsPII(str) {
  if (typeof str !== 'string') return false;
  return PII_PATTERNS.some((p) => p.test(str));
}

// --- SESSIONS-ID ---
function getOrCreateSessionId() {
  let sid = sessionStorage.getItem('vmt_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('vmt_sid', sid);
  }
  return sid;
}

// --- KÄRNMOTOR: SPÅRNING & FLUSH ---

/**
 * Loggar en händelse. Läggs i kö och skickas i batchar till Firestore.
 * @param {string} name      - Händelsens namn, t.ex. 'rage_click'
 * @param {string} type      - Kategori: 'pageview' | 'friction' | 'error' | 'performance' | 'custom_event'
 * @param {object} extra     - Valfri metadata
 * @param {string} [tab]     - Nuvarande aktiv flik i appen (ersätter url_path för SPA)
 */
export function trackEvent(name, type = 'custom_event', extra = {}, tab = '') {
  if (_sessionEventCount >= MAX_EVENTS_SESSION) return;

  // Filtrera bort PII från händelsenamn
  if (_containsPII(name)) return;

  const event = {
    app_name: APP_NAME,
    event_type: type,
    event_name: name,
    session_id: getOrCreateSessionId(),
    url_path: tab || window.location.pathname,
    timestamp: new Date().toISOString(),
    metadata: {
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ...extra,
    },
  };

  _queue.push(event);
  _sessionEventCount++;

  if (_queue.length >= MAX_BATCH_SIZE) {
    _flush();
  }
}

/**
 * Genväg för att spåra ett tab-byte i SPA:en.
 * @param {string} tab - Nyckel för den nya fliken (t.ex. 'leaderboard', 'kupong')
 */
export function trackTab(tab) {
  trackEvent('tab_view', 'pageview', {}, tab);
}

/**
 * Skriver alla händelser i kön till Firestore i en batch.
 * Anropas automatiskt av timern och vid flikstängning.
 */
async function _flush() {
  if (_queue.length === 0) return;

  const batch = _queue.splice(0, _queue.length);
  const analyticsCollection = collection(db, 'app_analytics');

  try {
    const firestoreBatch = writeBatch(db);
    batch.forEach((event) => {
      // Varje event får ett auto-genererat doc-ID via doc() utan argument
      const newDocRef = doc(analyticsCollection);
      firestoreBatch.set(newDocRef, event);
    });
    await firestoreBatch.commit();
  } catch (err) {
    // Analytics ska aldrig krascha appen
    console.warn('[Analytics] Kunde inte skicka batch:', err);
  }
}

// --- INITIERING ---

/**
 * Startar analytics-motorn. Anropas en gång vid appstart (useEffect i App).
 */
export function initAnalytics() {
  // Starta periodisk flush
  _flushTimer = setInterval(_flush, FLUSH_INTERVAL_MS);

  // Aktivera passiva UX-friktionsdetektorer
  _initRageClickDetector();
  _initFieldHesitationDetector();

  // Flusha kvarvarande händelser när användaren stänger/minimerar fliken
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      _flush();
    }
  });
}

// --- UX-FRIKTIONSDETEKTORER ---

/** Rage Click: 3+ klick på samma element inom 1 sekund. */
function _initRageClickDetector() {
  const clickMap = new Map(); // elementKey -> { count, first }

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target;
      const key = el.id || el.className || el.tagName;
      const now = Date.now();
      const entry = clickMap.get(key) || { count: 0, first: now };

      // Nollställ om mer än 1 sekund passerat sedan första klicket
      if (now - entry.first > 1000) {
        clickMap.set(key, { count: 1, first: now });
        return;
      }

      entry.count++;
      clickMap.set(key, entry);

      if (entry.count >= 3) {
        trackEvent('rage_click', 'friction', {
          element_tag: el.tagName,
          element_id: el.id || null,
          element_class: typeof el.className === 'string' ? el.className.split(' ')[0] : null,
        });
        clickMap.delete(key); // Nollställ efter registrering
      }
    },
    { passive: true }
  );
}

/** Field Hesitation: fokus på ett fält i >10 sekunder utan att göra en ändring. */
function _initFieldHesitationDetector() {
  const focusMap = new Map(); // fieldKey -> { time, changed }

  document.addEventListener(
    'focusin',
    (e) => {
      const el = e.target;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      const key = el.id || el.name || el.tagName;
      focusMap.set(key, { time: Date.now(), changed: false });
    },
    { passive: true }
  );

  document.addEventListener(
    'input',
    (e) => {
      const key = e.target.id || e.target.name || e.target.tagName;
      const entry = focusMap.get(key);
      if (entry) entry.changed = true;
    },
    { passive: true }
  );

  document.addEventListener(
    'focusout',
    (e) => {
      const el = e.target;
      const key = el.id || el.name || el.tagName;
      const entry = focusMap.get(key);
      if (!entry) return;

      const elapsed = Date.now() - entry.time;
      if (!entry.changed && elapsed >= HESITATION_THRESHOLD_MS) {
        trackEvent('field_hesitation', 'friction', {
          field_id: key,
          duration_ms: elapsed,
        });
      }
      focusMap.delete(key);
    },
    { passive: true }
  );
}

// --- FORMULÄRSPÅRNING ---

const _formDirtyMap = new Map(); // formId -> { dirty, startTime }

/**
 * Registrerar ett formulär för avbrottsdetektering.
 * Anropa en gång per formulär (t.ex. i useEffect).
 * @param {string} formId - ID-attributet på formulärelementet
 */
export function initFormTracking(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener(
    'input',
    () => {
      if (!_formDirtyMap.has(formId)) {
        _formDirtyMap.set(formId, { dirty: true, startTime: Date.now() });
      }
    },
    { passive: true }
  );

  form.addEventListener(
    'submit',
    () => {
      _formDirtyMap.delete(formId); // Rensas vid lyckad inskickning
    },
    { passive: true }
  );
}

/**
 * Kontrollera om ett formulär lämnats halvt ifyllt.
 * Anropa vid tab-byte eller vy-navigering.
 * @param {string} formId - ID-attributet på formulärelementet
 */
export function checkFormAbandonment(formId) {
  const entry = _formDirtyMap.get(formId);
  if (entry?.dirty) {
    const elapsed = Date.now() - entry.startTime;
    trackEvent('form_abandoned', 'friction', {
      form_id: formId,
      time_spent_ms: elapsed,
    });
    _formDirtyMap.delete(formId);
  }
}
