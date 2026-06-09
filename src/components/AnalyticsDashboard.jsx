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
} from 'lucide-react';

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
  };
  return map[tab] || tab;
}

// -------------------------------------------------------------------
// Subkomponent: Statistik-nyckel
// -------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
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
// Subkomponent: Horisontell stapel
// -------------------------------------------------------------------
function Bar({ label, value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-32 shrink-0 text-xs font-bold text-slate-600 truncate" title={label}>
        {label}
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-8 text-right text-xs font-black text-slate-500">{value}</div>
    </div>
  );
}

// -------------------------------------------------------------------
// Huvud-komponent
// -------------------------------------------------------------------
export default function AnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Hämta de 500 senaste händelserna, sorterade nyast först
      const q = query(collection(db, 'app_analytics'), orderBy('timestamp', 'desc'), limit(500));
      const snap = await getDocs(q);
      const allEvents = snap.docs.map((d) => d.data());

      // Filtrera klientsidigt på vald tidsperiod
      const since = new Date();
      since.setDate(since.getDate() - timeRange);
      setEvents(allEvents.filter((e) => new Date(e.timestamp) >= since));
      setLastFetched(new Date());
    } catch (err) {
      setError(err.code === 'permission-denied'
        ? 'PERMISSION_DENIED'
        : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // --- Aggregeringar ---

  const uniqueSessions = useMemo(() => new Set(events.map((e) => e.session_id)).size, [events]);

  const rageClicks = useMemo(() => {
    const counts = {};
    events
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
  }, [events]);

  const hesitations = useMemo(() => {
    const map = {};
    events
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
  }, [events]);

  const tipSubmitted = useMemo(() => events.filter((e) => e.event_name === 'tip_submitted').length, [events]);
  const formAbandoned = useMemo(() => events.filter((e) => e.event_name === 'form_abandoned').length, [events]);
  const funnelTotal = tipSubmitted + formAbandoned;
  const conversionRate = funnelTotal > 0 ? Math.round((tipSubmitted / funnelTotal) * 100) : null;

  const tabViews = useMemo(() => {
    const counts = {};
    events.filter((e) => e.event_name === 'tab_view').forEach((e) => {
      const tab = e.url_path || 'okänd';
      counts[tab] = (counts[tab] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);
  const maxTabViews = tabViews[0]?.[1] || 1;

  const loginFailed = useMemo(() => events.filter((e) => e.event_name === 'login_failed').length, [events]);
  const loginSuccess = useMemo(() => events.filter((e) => e.event_name === 'login_success').length, [events]);

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
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} /> UX Analytics
        </h3>
        <div className="flex items-center gap-2">
          {/* Tidsfilter */}
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
                timeRange === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {d}d
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
      ) : events.length === 0 ? (
        <div className="p-8 bg-slate-50 border border-dashed rounded-3xl text-center text-slate-400 text-sm font-bold">
          Ingen data insamlad ännu för de senaste {timeRange} dagarna.
        </div>
      ) : (
        <>
          {/* Nyckeltal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Unika sessioner"
              value={uniqueSessions}
              sub={`senaste ${timeRange} dagarna`}
              color="indigo"
            />
            <StatCard
              icon={TrendingUp}
              label="Konverteringsgrad"
              value={conversionRate !== null ? `${conversionRate}%` : '–'}
              sub={`${tipSubmitted} inskickade / ${formAbandoned} avbrutna`}
              color={conversionRate !== null && conversionRate < 60 ? 'red' : 'emerald'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Lyckade inloggningar"
              value={loginSuccess}
              color="emerald"
            />
            <StatCard
              icon={XCircle}
              label="Misslyckade inloggningar"
              value={loginFailed}
              color={loginFailed > 5 ? 'red' : 'amber'}
            />
          </div>

          {/* Rad 2: Rage Clicks + Hesitation */}
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

          {/* Tab-popularitet */}
          <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
            <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={14} className="text-indigo-400" /> Flik-popularitet
            </h4>
            {tabViews.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">Inga flikvyer registrerade ännu.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tabViews.map(([tab, count]) => (
                  <Bar key={tab} label={friendlyTabName(tab)} value={count} max={maxTabViews} color="#6366f1" />
                ))}
              </div>
            )}
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
