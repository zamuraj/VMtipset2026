import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import {
  Activity,
  MousePointerClick,
  RefreshCw,
  Users,
  XCircle,
  Loader2,
  MessageSquare,
  Timer,
  AlertTriangle,
  User,
} from 'lucide-react';

// VM 2026 startdatum
const VM_START = new Date('2026-06-11T00:00:00');

// -------------------------------------------------------------------
// Hjälpfunktioner
// -------------------------------------------------------------------
function friendlyTabName(tab) {
  const map = {
    leaderboard: '🏆 Tabell',
    kupong: '📝 Kupong',
    live: '⚡ Live',
    schema: '📅 Schema',
    grupper: '🗂 Grupper',
    statistik: '📊 Statistik',
    admin: '⚙️ Admin',
    'hall-of-fame': '🌟 Hall of Fame',
    chat: '💬 Snackis',
    groups: '🗂 Grupper',
    h2h: '⚔️ Head 2 Head',
    matches: '📅 Matcher',
    hof: '🌟 Hall of Fame',
  };
  return map[tab] || tab;
}

function formatDuration(sec) {
  if (!sec || sec < 0) return '–';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(dateStr) {
  // dateStr is like "2026-06-15"
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function classifyDevice(screen) {
  if (!screen) return 'unknown';
  const w = parseInt(screen.split('x')[0], 10);
  if (isNaN(w)) return 'unknown';
  if (w < 768) return 'mobile';
  if (w < 1200) return 'tablet';
  return 'desktop';
}

// -------------------------------------------------------------------
// Subkomponent: Sektionsrubrik
// -------------------------------------------------------------------
function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div className="mb-4">
      <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h4>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: KPI-kort
// -------------------------------------------------------------------
function KpiCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    emerald: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    violet: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div
      style={{ border: `1px solid ${c.border}`, background: '#fff' }}
      className="p-5 rounded-2xl shadow-sm flex flex-col gap-3"
    >
      <div
        style={{ background: c.bg, color: c.text }}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 self-start"
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-3xl font-black text-slate-900 leading-none tabular-nums">{value}</div>
        <div className="text-sm font-bold text-slate-700 mt-1">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: Horisontell stapel
// -------------------------------------------------------------------
function HBar({ label, value, max, sub, color = '#6366f1', dimmed = false }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="shrink-0 font-bold text-slate-700 truncate"
        style={{ width: '9rem', fontSize: '0.8rem' }}
        title={label}
      >
        {label}
      </div>
      <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height: 10 }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: dimmed ? '#cbd5e1' : color }}
        />
      </div>
      <div className="text-xs font-black text-slate-600 text-right tabular-nums" style={{ width: '5rem' }}>
        {value}
        {sub && <span className="font-normal text-slate-400 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: Dag-för-dag stapeldiagram (CSS only)
// -------------------------------------------------------------------
function DayChart({ sessionsByDay, todayStr }) {
  if (sessionsByDay.length === 0) {
    return <p className="text-sm text-slate-400 font-bold">Ingen data ännu.</p>;
  }
  const maxCount = Math.max(...sessionsByDay.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 120 }}>
      {sessionsByDay.map(({ date, count }) => {
        const isToday = date === todayStr;
        const heightPct = Math.max(8, Math.round((count / maxCount) * 100));
        return (
          <div key={date} className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 44 }}>
            <div className="text-xs font-black text-slate-700 tabular-nums">{count}</div>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${heightPct}px`,
                minHeight: 8,
                background: isToday
                  ? 'linear-gradient(to top, #4338ca, #818cf8)'
                  : 'linear-gradient(to top, #94a3b8, #cbd5e1)',
                boxShadow: isToday ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
              }}
            />
            <div
              className="text-[9px] font-bold text-center"
              style={{ color: isToday ? '#4338ca' : '#94a3b8' }}
            >
              {formatDate(date)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: Konverteringstratt
// -------------------------------------------------------------------
function Funnel({ title, icon: Icon, steps }) {
  const topCount = steps[0]?.count || 1;
  return (
    <div className="p-5 bg-slate-50 rounded-2xl border space-y-3">
      <h5 className="font-black text-sm text-slate-700 flex items-center gap-2">
        <Icon size={14} className="text-indigo-400" /> {title}
      </h5>
      {steps.map((step, i) => {
        const pct = topCount > 0 ? Math.round((step.count / topCount) * 100) : 0;
        const dropoff =
          i > 0 ? Math.round(((steps[i - 1].count - step.count) / (steps[i - 1].count || 1)) * 100) : null;
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">
                {step.emoji} {step.label}
              </span>
              <span className="text-sm font-black text-slate-600 tabular-nums">
                {step.count}
                {dropoff !== null && dropoff > 0 && (
                  <span className="ml-2 text-red-400 font-bold text-xs">−{dropoff}%</span>
                )}
              </span>
            </div>
            <div className="bg-slate-200 rounded-full overflow-hidden" style={{ height: 10 }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: i === 0 ? '#6366f1' : i === steps.length - 1 ? '#10b981' : '#8b5cf6',
                }}
              />
            </div>
          </div>
        );
      })}
      {steps[0]?.count === 0 && (
        <p className="text-sm text-slate-400 font-bold">Ingen data ännu.</p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Huvud-komponent
// -------------------------------------------------------------------
const ALL_TABS = ['leaderboard', 'kupong', 'chat', 'h2h', 'groups', 'matches', 'hof'];

export default function AnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // 1 = 24h, 7 = 7d, 0 = Hela VM
  const [lastFetched, setLastFetched] = useState(null);
  const [hideAdmin, setHideAdmin] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'app_analytics'), orderBy('timestamp', 'desc'), limit(1000));
      const snap = await getDocs(q);
      const allEvents = snap.docs.map((d) => d.data());

      let since;
      if (timeRange === 0) {
        since = VM_START;
      } else {
        since = new Date();
        since.setDate(since.getDate() - timeRange);
      }

      setEvents(allEvents.filter((e) => new Date(e.timestamp) >= since));
      setLastFetched(new Date());
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'PERMISSION_DENIED' : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Filtrera bort admin-trafik
  const filteredEvents = useMemo(
    () => (hideAdmin ? events.filter((e) => !e.metadata?.is_admin) : events),
    [events, hideAdmin]
  );

  // --- KPI: Unika sessioner ---
  const uniqueSessions = useMemo(
    () => new Set(filteredEvents.map((e) => e.session_id)).size,
    [filteredEvents]
  );

  // --- KPI: Genomsnittlig sessionstid ---
  const avgSessionDuration = useMemo(() => {
    const ends = filteredEvents.filter((e) => e.event_name === 'session_end' && e.metadata?.session_duration_sec > 0);
    if (ends.length === 0) return null;
    const total = ends.reduce((s, e) => s + e.metadata.session_duration_sec, 0);
    return Math.round(total / ends.length);
  }, [filteredEvents]);

  // --- KPI: Bounce Rate ---
  const bounceRate = useMemo(() => {
    const ends = filteredEvents.filter((e) => e.event_name === 'session_end');
    if (ends.length === 0) return null;
    const bounces = ends.filter((e) => e.metadata?.is_bounce).length;
    return Math.round((bounces / ends.length) * 100);
  }, [filteredEvents]);

  // --- KPI: Login ---
  const loginFailed = useMemo(
    () => filteredEvents.filter((e) => e.event_name === 'login_failed').length,
    [filteredEvents]
  );
  const loginSuccess = useMemo(
    () => filteredEvents.filter((e) => e.event_name === 'login_success').length,
    [filteredEvents]
  );

  // --- Flik-popularitet + genomsnittlig tid ---
  const tabStats = useMemo(() => {
    const views = {};
    const durTotals = {};
    const durCounts = {};

    filteredEvents.filter((e) => e.event_name === 'tab_view').forEach((e) => {
      const tab = e.url_path || 'okänd';
      views[tab] = (views[tab] || 0) + 1;
    });

    filteredEvents.filter((e) => e.event_name === 'tab_duration').forEach((e) => {
      const tab = e.url_path || 'okänd';
      const sec = e.metadata?.duration_sec || 0;
      durTotals[tab] = (durTotals[tab] || 0) + sec;
      durCounts[tab] = (durCounts[tab] || 0) + 1;
    });

    const allKnownTabs = new Set([...Object.keys(views), ...ALL_TABS]);
    return Array.from(allKnownTabs)
      .map((tab) => ({
        tab,
        views: views[tab] || 0,
        avgDurationSec: durCounts[tab] ? Math.round(durTotals[tab] / durCounts[tab]) : null,
      }))
      .sort((a, b) => b.views - a.views);
  }, [filteredEvents]);

  const maxTabViews = tabStats[0]?.views || 1;

  // --- Dag-för-dag sessioner ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const sessionsByDay = useMemo(() => {
    const counts = {};
    filteredEvents
      .filter((e) => e.event_name === 'session_start')
      .forEach((e) => {
        const day = e.timestamp?.slice(0, 10);
        if (day) counts[day] = (counts[day] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  }, [filteredEvents]);

  // --- Match-engagemang: top 5 visade matcher ---
  const topMatches = useMemo(() => {
    const counts = {};
    const meta = {};
    filteredEvents
      .filter((e) => e.event_name === 'match_viewed')
      .forEach((e) => {
        const id = e.metadata?.match_id || 'okänd';
        counts[id] = (counts[id] || 0) + 1;
        if (!meta[id]) meta[id] = { team1: e.metadata?.team1 || id, team2: e.metadata?.team2 || '' };
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count, label: `${meta[id].team1} – ${meta[id].team2}` }));
  }, [filteredEvents]);

  // --- Snackis-tratt ---
  const chatFunnel = useMemo(() => {
    const sessionsSawChat = new Set(
      filteredEvents.filter((e) => e.event_name === 'tab_view' && e.url_path === 'chat').map((e) => e.session_id)
    ).size;
    const sessionsFocused = new Set(
      filteredEvents.filter((e) => e.event_name === 'chat_input_focused').map((e) => e.session_id)
    ).size;
    const sessionsSent = new Set(
      filteredEvents.filter((e) => e.event_name === 'chat_message_sent').map((e) => e.session_id)
    ).size;
    return [
      { emoji: '👁', label: 'Öppnade Snackis', count: sessionsSawChat },
      { emoji: '✏️', label: 'Klickade i fältet', count: sessionsFocused },
      { emoji: '✅', label: 'Skickade meddelande', count: sessionsSent },
    ];
  }, [filteredEvents]);

  // --- Enheter ---
  const deviceBreakdown = useMemo(() => {
    const counts = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    new Set(filteredEvents.map((e) => e.session_id)).forEach((sid) => {
      const evt = filteredEvents.find((e) => e.session_id === sid);
      const type = classifyDevice(evt?.metadata?.screen);
      counts[type] = (counts[type] || 0) + 1;
    });
    const total = counts.mobile + counts.tablet + counts.desktop || 1;
    return [
      { label: '📱 Mobil', count: counts.mobile, pct: Math.round((counts.mobile / total) * 100) },
      { label: '💻 Tablet', count: counts.tablet, pct: Math.round((counts.tablet / total) * 100) },
      { label: '🖥 Desktop', count: counts.desktop, pct: Math.round((counts.desktop / total) * 100) },
    ];
  }, [filteredEvents]);

  // --- Rage Clicks ---
  const rageClicks = useMemo(() => {
    const counts = {};
    filteredEvents
      .filter((e) => e.event_name === 'rage_click')
      .forEach((e) => {
        const key =
          e.metadata?.element_id ||
          (typeof e.metadata?.element_class === 'string'
            ? e.metadata.element_class.split(' ').find(Boolean)
            : null) ||
          e.metadata?.element_tag ||
          'okänt';
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredEvents]);

  // --- Profilvisningar ---
  const profileViews = useMemo(() => {
    const counts = {};
    filteredEvents
      .filter((e) => e.event_name === 'player_profile_viewed')
      .forEach((e) => {
        const name = e.metadata?.player_name || 'okänd';
        counts[name] = (counts[name] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredEvents]);

  const timeLabels = { 1: '24h', 7: '7 dagar', 0: 'Hela VM' };

  // --- Felvy: Behörighet ---
  if (error === 'PERMISSION_DENIED') {
    return (
      <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex gap-4">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <div className="font-black text-amber-800">Uppdatera Firestore-reglerna för att se dashboardet</div>
          <div className="text-xs text-amber-700 mt-1 font-bold">
            Lägg till <code className="bg-amber-100 px-1 rounded">allow read: if true;</code> under{' '}
            <code className="bg-amber-100 px-1 rounded">{'match /app_analytics/{document}'}</code> i{' '}
            <a
              href="https://console.firebase.google.com/project/kroppsoptimering/firestore/rules"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Firebase Console → Firestore Rules
            </a>
            .
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" /> Analytics
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Hur folk använder VM-tipset</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin-filter */}
          <button
            type="button"
            role="switch"
            aria-checked={hideAdmin}
            onClick={() => setHideAdmin((v) => !v)}
            className="flex items-center gap-1.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-lg p-1"
          >
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${hideAdmin ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${hideAdmin ? 'left-4' : 'left-0.5'}`}
              />
            </div>
            <span className="text-xs font-bold text-slate-500">Bara spelare</span>
          </button>

          {/* Tidsfilter */}
          {[1, 7, 0].map((d) => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
                timeRange === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {timeLabels[d]}
            </button>
          ))}

          <button
            onClick={fetchData}
            disabled={loading}
            title="Uppdatera"
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-bold">Hämtar analytics-data…</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
          Fel: {error}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-dashed rounded-3xl text-center text-slate-400 text-sm font-bold">
          Ingen data insamlad ännu för vald period.
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════
              1. KPI-KORT
          ══════════════════════════════════════════ */}
          <div>
            <SectionHeader emoji="📊" title="Nyckeltal" subtitle={`Senaste ${timeLabels[timeRange]}`} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={Users}
                label="Unika besök"
                value={uniqueSessions}
                sub="unika sessioner"
                color="indigo"
              />
              <KpiCard
                icon={Timer}
                label="Snitt-tid"
                value={avgSessionDuration !== null ? formatDuration(avgSessionDuration) : '–'}
                sub="per besök"
                color="violet"
              />
              <KpiCard
                icon={Activity}
                label="Bounce"
                value={bounceRate !== null ? `${bounceRate}%` : '–'}
                sub="lämnade direkt"
                color={bounceRate !== null && bounceRate > 50 ? 'red' : 'emerald'}
              />
              <KpiCard
                icon={XCircle}
                label="Inloggningar"
                value={loginFailed > 0 ? `${loginFailed} fel` : `${loginSuccess} ✓`}
                sub={loginFailed > 0 ? `${loginSuccess} lyckade` : 'inga fel!'}
                color={loginFailed > 5 ? 'red' : loginFailed > 0 ? 'amber' : 'emerald'}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              2. HUR FOLK RÖR SIG – Flik-popularitet
          ══════════════════════════════════════════ */}
          <div className="p-6 bg-white rounded-2xl border shadow-sm">
            <SectionHeader
              emoji="🧭"
              title="Hur folk rör sig"
              subtitle="Vilka flikar besöks mest — och hur länge stannar folk?"
            />
            <div className="space-y-3">
              {tabStats.map(({ tab, views, avgDurationSec }) => (
                <HBar
                  key={tab}
                  label={friendlyTabName(tab)}
                  value={views}
                  max={maxTabViews}
                  sub={avgDurationSec !== null ? formatDuration(avgDurationSec) : undefined}
                  color="#6366f1"
                  dimmed={views === 0}
                />
              ))}
            </div>
            <p className="text-xs text-slate-300 font-bold mt-4">Siffran till höger = visningar · tid = snitt per besök</p>
          </div>

          {/* ══════════════════════════════════════════
              3. DAG FÖR DAG – Sessioner per dag
          ══════════════════════════════════════════ */}
          <div className="p-6 bg-white rounded-2xl border shadow-sm">
            <SectionHeader
              emoji="📅"
              title="Dag för dag"
              subtitle="Antal sessioner per kalenderdag (max 14 dagar). Lila = idag."
            />
            <DayChart sessionsByDay={sessionsByDay} todayStr={todayStr} />
          </div>

          {/* ══════════════════════════════════════════
              4. ENGAGEMANG – Matcher + Chat-tratt
          ══════════════════════════════════════════ */}
          <div>
            <SectionHeader
              emoji="⚽"
              title="Engagemang"
              subtitle="Vilka matcher tittar folk på, och hur långt når de i chatten?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matcher */}
              <div className="p-5 bg-white rounded-2xl border shadow-sm space-y-3">
                <h5 className="font-black text-sm text-slate-700">🔥 Mest visade matcher</h5>
                {topMatches.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Inga matcher spårade ännu — händelserna dyker upp när användare klickar på matchkort.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topMatches.map(({ id, count, label }) => (
                      <HBar
                        key={id}
                        label={label}
                        value={count}
                        max={topMatches[0].count}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Snackis-tratt */}
              <Funnel title="Snackis-tratten" icon={MessageSquare} steps={chatFunnel} />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              5. ENHETER
          ══════════════════════════════════════════ */}
          <div className="p-6 bg-white rounded-2xl border shadow-sm">
            <SectionHeader
              emoji="📱"
              title="Enheter"
              subtitle="Vilken typ av enhet besöker användarna från? (baserat på skärmbredd)"
            />
            <div className="space-y-3">
              {deviceBreakdown.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="shrink-0 font-bold text-slate-700 text-sm" style={{ width: '7rem' }}>
                    {label}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height: 10 }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: label.includes('Mobil')
                          ? '#6366f1'
                          : label.includes('Tablet')
                          ? '#8b5cf6'
                          : '#10b981',
                      }}
                    />
                  </div>
                  <div className="text-xs font-black text-slate-600 tabular-nums" style={{ width: '5rem', textAlign: 'right' }}>
                    {pct}% <span className="font-normal text-slate-400">({count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              6. UX-PROBLEM
          ══════════════════════════════════════════ */}
          <div>
            <SectionHeader
              emoji="🚨"
              title="UX-problem"
              subtitle="Signaler om att något är svårt att använda eller frustrerande."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frustrerade klick */}
              <div className="p-5 bg-white rounded-2xl border shadow-sm space-y-3">
                <div>
                  <h5 className="font-black text-sm text-slate-700 flex items-center gap-2">
                    <MousePointerClick size={14} className="text-red-400" /> 😤 Frustrerade klick
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">3+ klick på samma ställe inom 1 sekund</p>
                </div>
                {rageClicks.length === 0 ? (
                  <p className="text-sm text-slate-400 font-bold">Inga registrerade 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {rageClicks.map(([label, count]) => (
                      <HBar key={label} label={label} value={count} max={rageClicks[0][1]} color="#ef4444" />
                    ))}
                  </div>
                )}
              </div>

              {/* Profilvisningar */}
              <div className="p-5 bg-white rounded-2xl border shadow-sm space-y-3">
                <div>
                  <h5 className="font-black text-sm text-slate-700 flex items-center gap-2">
                    <User size={14} className="text-indigo-400" /> 👀 Profilvisningar
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">Vems tips är mest intressanta?</p>
                </div>
                {profileViews.length === 0 ? (
                  <p className="text-sm text-slate-400 font-bold">Inga registrerade 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {profileViews.map(({ name, count }) => (
                      <HBar key={name} label={name} value={count} max={profileViews[0].count} color="#8b5cf6" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          {lastFetched && (
            <p className="text-[10px] text-slate-300 text-right font-bold">
              Uppdaterades {lastFetched.toLocaleTimeString('sv-SE')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
