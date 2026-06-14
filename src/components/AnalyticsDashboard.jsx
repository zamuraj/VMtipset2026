import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import {
  Activity,
  MousePointerClick,
  Clock,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  FileText,
  Timer,
  Zap,
} from 'lucide-react';

// VM 2026 startdatum
const VM_START = new Date('2026-06-11T00:00:00');

// -------------------------------------------------------------------
// Hjälpfunktioner
// -------------------------------------------------------------------
function friendlyFieldName(id) {
  const map = {
    'reg-name': 'Namn',
    'reg-email': 'E-post',
    'reg-phone': 'Telefon',
    'reg-goals': 'Antal mål (gissning)',
    INPUT: 'Okänt fält',
    TEXTAREA: 'Textfält',
    SELECT: 'Urval',
  };
  return map[id] || id;
}

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
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// -------------------------------------------------------------------
// Subkomponent: KPI-kort
// -------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="p-5 bg-white rounded-3xl border shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 leading-none">{value}</div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: Horisontell stapel med valfri badge
// -------------------------------------------------------------------
function Bar({ label, value, max, sub, color = '#6366f1', badge }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-36 shrink-0 text-xs font-bold text-slate-600 truncate flex items-center gap-1" title={label}>
        {label}
        {badge && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-500 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-16 text-right text-xs font-black text-slate-500">
        {value}
        {sub && <span className="font-normal text-slate-400 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Subkomponent: Konverteringstratt
// -------------------------------------------------------------------
function Funnel({ title, icon: Icon, steps }) {
  const topCount = steps[0]?.count || 1;
  return (
    <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Icon size={14} className="text-indigo-400" /> {title}
      </h4>
      {steps.map((step, i) => {
        const pct = topCount > 0 ? Math.round((step.count / topCount) * 100) : 0;
        const dropoff = i > 0 ? Math.round(((steps[i - 1].count - step.count) / (steps[i - 1].count || 1)) * 100) : null;
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                {step.emoji} {step.label}
              </span>
              <span className="font-black text-slate-500">
                {step.count}
                {dropoff !== null && dropoff > 0 && (
                  <span className="ml-2 text-red-400 font-bold">−{dropoff}%</span>
                )}
              </span>
            </div>
            <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
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
        <p className="text-xs text-slate-400 font-bold">Ingen data ännu.</p>
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

      // Filtrera på tidsperiod
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

  // --- Filtrera bort admin-trafik om valt ---
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
  const loginFailed = useMemo(() => filteredEvents.filter((e) => e.event_name === 'login_failed').length, [filteredEvents]);
  const loginSuccess = useMemo(() => filteredEvents.filter((e) => e.event_name === 'login_success').length, [filteredEvents]);

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

  // --- Field Hesitation ---
  const hesitations = useMemo(() => {
    const map = {};
    filteredEvents
      .filter((e) => e.event_name === 'field_hesitation')
      .forEach((e) => {
        const key = e.metadata?.field_id || 'okänt';
        if (!map[key]) map[key] = { total: 0, count: 0 };
        map[key].total += e.metadata?.duration_ms || 0;
        map[key].count++;
      });
    return Object.entries(map)
      .map(([k, v]) => ({ field: k, avgSec: Math.round(v.total / v.count / 1000), count: v.count }))
      .sort((a, b) => b.avgSec - a.avgSec);
  }, [filteredEvents]);

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

    // Slå ihop alla kända tabs, även de med 0 besök
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

  // --- Kupong-tratt ---
  const kupongFunnel = useMemo(() => {
    const sessionsSawKupong = new Set(
      filteredEvents.filter((e) => e.event_name === 'tab_view' && e.url_path === 'kupong').map((e) => e.session_id)
    ).size;
    const sessionsFocused = new Set(
      filteredEvents.filter((e) => e.event_name === 'kupong_form_focused').map((e) => e.session_id)
    ).size;
    const sessionsSubmitted = new Set(
      filteredEvents.filter((e) => e.event_name === 'tip_submitted').map((e) => e.session_id)
    ).size;
    return [
      { emoji: '👁', label: 'Öppnade Kupong', count: sessionsSawKupong },
      { emoji: '✏️', label: 'Rörde formuläret', count: sessionsFocused },
      { emoji: '✅', label: 'Skickade tips', count: sessionsSubmitted },
    ];
  }, [filteredEvents]);

  const timeLabels = { 1: '24h', 7: '7d', 0: 'Hela VM' };

  // --- Render ---

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
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} /> UX Analytics
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin-filter */}
          <button
            type="button"
            role="switch"
            aria-checked={hideAdmin}
            onClick={() => setHideAdmin((v) => !v)}
            className="flex items-center gap-1.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm"
          >
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${hideAdmin ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${hideAdmin ? 'left-4' : 'left-0.5'}`}
              />
            </div>
            <span className="text-[11px] font-black text-slate-500">Bara spelare</span>
          </button>

          {/* Tidsfilter: VM-anpassade */}
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
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-bold">Hämtar analytics-data...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
          Fel: {error}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-8 bg-slate-50 border border-dashed rounded-3xl text-center text-slate-400 text-sm font-bold">
          Ingen data insamlad ännu för vald period.
        </div>
      ) : (
        <>
          {/* KPI-rad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Unika sessioner"
              value={uniqueSessions}
              sub={`senaste ${timeLabels[timeRange]}`}
              color="indigo"
            />
            <StatCard
              icon={Timer}
              label="Snittid i appen"
              value={avgSessionDuration !== null ? formatDuration(avgSessionDuration) : '–'}
              sub="per session"
              color="violet"
            />
            <StatCard
              icon={TrendingUp}
              label="Bounce Rate"
              value={bounceRate !== null ? `${bounceRate}%` : '–'}
              sub="sessioner utan interaktion"
              color={bounceRate !== null && bounceRate > 50 ? 'red' : 'emerald'}
            />
            <StatCard
              icon={XCircle}
              label="Misslyckade inloggningar"
              value={loginFailed}
              sub={`${loginSuccess} lyckade`}
              color={loginFailed > 5 ? 'red' : 'amber'}
            />
          </div>

          {/* Rad 2: Trattar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Funnel title="Snackis-tratten" icon={MessageSquare} steps={chatFunnel} />
            <Funnel title="Kupong-tratten" icon={FileText} steps={kupongFunnel} />
          </div>

          {/* Rad 3: Flik-popularitet med tid */}
          <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
            <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={14} className="text-indigo-400" /> Flik-popularitet & engagemang
            </h4>
            <div className="space-y-3">
              {tabStats.map(({ tab, views, avgDurationSec }) => (
                <Bar
                  key={tab}
                  label={friendlyTabName(tab)}
                  value={views}
                  max={maxTabViews}
                  sub={avgDurationSec !== null ? formatDuration(avgDurationSec) : undefined}
                  color={views === 0 ? '#e2e8f0' : '#6366f1'}
                  badge={views === 0 ? 'Ej besökt' : undefined}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-300 font-bold">Tid = genomsnittlig tid spenderad per besök</p>
          </div>

          {/* Rad 4: Rage Clicks + Hesitation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rage Clicks */}
            <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MousePointerClick size={14} className="text-red-400" /> Rage Clicks (Top 5)
              </h4>
              {rageClicks.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold">Inga rage clicks registrerade 🎉</p>
              ) : (
                <div className="space-y-3">
                  {rageClicks.map(([label, count]) => (
                    <Bar key={label} label={label} value={count} max={rageClicks[0][1]} color="#ef4444" />
                  ))}
                </div>
              )}
            </div>

            {/* Field Hesitation */}
            <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-amber-400" /> Tvekan i formulär
              </h4>
              {hesitations.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold">Inga tvekanden registrerade 🎉</p>
              ) : (
                <div className="space-y-3">
                  {hesitations.map(({ field, avgSec, count }) => (
                    <div key={field} className="flex items-center gap-3 text-sm">
                      <div className="w-32 shrink-0 text-xs font-bold text-slate-600 truncate">
                        {friendlyFieldName(field)}
                      </div>
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${Math.min(100, (avgSec / 60) * 100)}%` }}
                        />
                      </div>
                      <div className="text-xs font-black text-slate-500 w-14 text-right">
                        ~{avgSec}s ({count}×)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
