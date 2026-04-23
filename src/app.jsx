import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Trophy, BarChart3, Settings, CalendarDays, Check,
    TrendingUp, TrendingDown, AlertCircle, Clock,
    Grid3X3, User, X, Lock, Unlock, Zap, Swords, Bell,
    PlayCircle, Banknote, Users, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';

// --- OFFICIELT SPELSCHEMA VM 2026 (De första 48 gruppmatcherna) ---
// Format: "ID|Datum Tid (SVE)|Grupp|Lag 1|Lag 2|Stad (Arena)"
const officialSchedule = [
    "1|11 jun 21:00|A|Mexiko|Sydafrika|Mexico City (Azteca)",
    "2|12 jun 00:00|B|Kanada|Bosnien|Toronto (BMO Field)",
    "3|12 jun 15:00|A|Sydkorea|Tjeckien|Guadalajara (Akron)",
    "4|13 jun 00:00|D|USA|Paraguay|Los Angeles (SoFi)",
    "5|13 jun 21:00|B|Qatar|Schweiz|San Francisco (Levi's)",
    "6|14 jun 00:00|C|Brasilien|Marocko|New Jersey (MetLife)",
    "7|14 jun 03:00|C|Haiti|Skottland|Boston (Gillette)",
    "8|14 jun 06:00|D|Australien|Turkiet|Vancouver (BC Place)",
    "9|14 jun 19:00|E|Tyskland|Curaçao|Houston (NRG)",
    "10|14 jun 22:00|F|Nederländerna|Japan|Dallas (AT&T)",
    "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Philadelphia (Linc)",
    "12|15 jun 04:00|F|Sverige|Tunisien|Monterrey (BBVA)",
    "13|15 jun 18:00|H|Spanien|Kap Verde|Atlanta (Mercedes-Benz)",
    "14|15 jun 21:00|G|Belgien|Egypten|Seattle (Lumen Field)",
    "15|16 jun 00:00|H|Saudiarabien|Uruguay|Miami (Hard Rock)",
    "16|16 jun 03:00|G|Iran|Nya Zeeland|Los Angeles (SoFi)",
    "17|16 jun 21:00|I|Frankrike|Senegal|New Jersey (MetLife)",
    "18|17 jun 00:00|I|Irak|Norge|Boston (Gillette)",
    "19|17 jun 03:00|J|Argentina|Algeriet|Kansas City (Arrowhead)",
    "20|17 jun 06:00|J|Österrike|Jordanien|San Francisco (Levi's)",
    "21|17 jun 19:00|K|Portugal|DR Kongo|Houston (NRG)",
    "22|17 jun 22:00|L|England|Kroatien|Dallas (AT&T)",
    "23|18 jun 01:00|L|Ghana|Panama|Toronto (BMO Field)",
    "24|18 jun 04:00|K|Uzbekistan|Colombia|Mexico City (Azteca)",
    "25|18 jun 18:00|A|Tjeckien|Sydafrika|Atlanta (Mercedes-Benz)",
    "26|18 jun 21:00|B|Schweiz|Bosnien|Los Angeles (SoFi)",
    "27|19 jun 00:00|B|Kanada|Qatar|Vancouver (BC Place)",
    "28|19 jun 03:00|A|Mexiko|Sydkorea|Guadalajara (Akron)",
    "29|19 jun 21:00|D|USA|Australien|Seattle (Lumen Field)",
    "30|20 jun 00:00|C|Skottland|Marocko|Boston (Gillette)",
    "31|20 jun 03:00|C|Brasilien|Haiti|Philadelphia (Linc)",
    "32|20 jun 06:00|D|Turkiet|Paraguay|San Francisco (Levi's)",
    "33|20 jun 19:00|F|Nederländerna|Sverige|Houston (NRG)",
    "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|Toronto (BMO Field)",
    "35|21 jun 02:00|E|Ecuador|Curaçao|Kansas City (Arrowhead)",
    "36|21 jun 06:00|F|Tunisien|Japan|Monterrey (BBVA)",
    "37|21 jun 18:00|H|Spanien|Saudiarabien|Atlanta (Mercedes-Benz)",
    "38|21 jun 21:00|G|Belgien|Iran|Los Angeles (SoFi)",
    "39|22 jun 00:00|H|Uruguay|Kap Verde|Miami (Hard Rock)",
    "40|22 jun 03:00|G|Nya Zeeland|Egypten|Vancouver (BC Place)",
    "41|22 jun 19:00|J|Argentina|Österrike|Kansas City (Arrowhead)",
    "42|22 jun 23:00|I|Frankrike|Irak|Philadelphia (Linc)",
    "43|23 jun 02:00|I|Norge|Senegal|New Jersey (MetLife)",
    "44|23 jun 05:00|J|Jordanien|Algeriet|San Francisco (Levi's)",
    "45|23 jun 19:00|K|Portugal|Uzbekistan|Houston (NRG)",
    "46|23 jun 22:00|L|England|Ghana|Boston (Gillette)",
    "47|24 jun 01:00|L|Panama|Kroatien|Toronto (BMO Field)",
    "48|24 jun 04:00|K|Colombia|DR Kongo|Guadalajara (Akron)"
];

// --- LAGDATA & FÄRGER ---
const TEAMS = {
    'Mexiko': { flag: '🇲🇽', primary: '#006847', tier: 2 }, 'Sydafrika': { flag: '🇿🇦', primary: '#007C59', tier: 3 },
    'Sydkorea': { flag: '🇰🇷', primary: '#CD2E3A', tier: 2 }, 'Tjeckien': { flag: '🇨🇿', primary: '#11457E', tier: 2 },
    'Kanada': { flag: '🇨🇦', primary: '#FF0000', tier: 2 }, 'Bosnien': { flag: '🇧🇦', primary: '#002395', tier: 3 },
    'USA': { flag: '🇺🇸', primary: '#B31942', tier: 2 }, 'Paraguay': { flag: '🇵🇾', primary: '#D52B1E', tier: 3 },
    'Qatar': { flag: '🇶🇦', primary: '#8D1B3D', tier: 3 }, 'Schweiz': { flag: '🇨🇭', primary: '#D52B1E', tier: 2 },
    'Brasilien': { flag: '🇧🇷', primary: '#FFDF00', tier: 1 }, 'Marocko': { flag: '🇲🇦', primary: '#C1272D', tier: 2 },
    'Haiti': { flag: '🇭🇹', primary: '#00209F', tier: 3 }, 'Skottland': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', primary: '#004B84', tier: 3 },
    'Australien': { flag: '🇦🇺', primary: '#00008B', tier: 3 }, 'Turkiet': { flag: '🇹🇷', primary: '#E30A17', tier: 2 },
    'Tyskland': { flag: '🇩🇪', primary: '#000000', tier: 1 }, 'Curaçao': { flag: '🇨🇼', primary: '#002B7F', tier: 3 },
    'Nederländerna': { flag: '🇳🇱', primary: '#F36C21', tier: 1 }, 'Japan': { flag: '🇯🇵', primary: '#BC002D', tier: 2 },
    'Elfenbenskusten': { flag: '🇨🇮', primary: '#FF8200', tier: 2 }, 'Ecuador': { flag: '🇪🇨', primary: '#FFD100', tier: 3 },
    'Sverige': { flag: '🇸🇪', primary: '#006AA7', tier: 2 }, 'Tunisien': { flag: '🇹🇳', primary: '#E70013', tier: 3 },
    'Spanien': { flag: '🇪🇸', primary: '#AA151B', tier: 1 }, 'Kap Verde': { flag: '🇨🇻', primary: '#003893', tier: 3 },
    'Belgien': { flag: '🇧🇪', primary: '#000000', tier: 1 }, 'Egypten': { flag: '🇪🇬', primary: '#C09307', tier: 2 },
    'Saudiarabien': { flag: '🇸🇦', primary: '#006C35', tier: 3 }, 'Uruguay': { flag: '🇺🇾', primary: '#0038A8', tier: 1 },
    'Iran': { flag: '🇮🇷', primary: '#239f40', tier: 3 }, 'Nya Zeeland': { flag: '🇳🇿', primary: '#000000', tier: 3 },
    'Frankrike': { flag: '🇫🇷', primary: '#002395', tier: 1 }, 'Senegal': { flag: '🇸🇳', primary: '#00853F', tier: 2 },
    'Irak': { flag: '🇮🇶', primary: '#007A33', tier: 3 }, 'Norge': { flag: '🇳🇴', primary: '#EF2B2D', tier: 2 },
    'Argentina': { flag: '🇦🇷', primary: '#75AADB', tier: 1 }, 'Algeriet': { flag: '🇩🇿', primary: '#006233', tier: 3 },
    'Österrike': { flag: '🇦🇹', primary: '#EF3340', tier: 2 }, 'Jordanien': { flag: '🇯🇴', primary: '#CE1126', tier: 3 },
    'Portugal': { flag: '🇵🇹', primary: '#006600', tier: 1 }, 'DR Kongo': { flag: '🇨🇩', primary: '#007FFF', tier: 3 },
    'Uzbekistan': { flag: '🇺🇿', primary: '#0099B5', tier: 3 }, 'Colombia': { flag: '🇨🇴', primary: '#FCD116', tier: 2 },
    'England': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#000040', tier: 1 }, 'Kroatien': { flag: '🇭🇷', primary: '#FF0000', tier: 1 },
    'Ghana': { flag: '🇬🇭', primary: '#FCD116', tier: 3 }, 'Panama': { flag: '🇵🇦', primary: '#005293', tier: 3 }
};

const initialMatchesList = officialSchedule.map(m => {
    const [id, date, group, team1, team2, venue] = m.split('|');
    return { id: parseInt(id), date, group, team1, team2, venue, goals1: null, goals2: null, status: 'upcoming', minute: null };
});

const GROUPS = ['Alla', 'Säljarna', 'Projektledare', 'Ledningen', 'Dalabyggsam', 'Gubbarna'];

// --- DATA: DELTAGARE & ADMIN (Initialt) ---
const initialTips = [
    { id: 'admin', name: 'Arrangör Amon', email: 'admin@vmtipset.se', groups: ['Ledningen'], goals: 132, predictions: {}, isApproved: true, isAdmin: true },
    { id: 1, name: 'Adam Johansson', email: 'adam@test.se', groups: ['Säljarna', 'Dalabyggsam'], goals: 110, isApproved: true, isAdmin: false, predictions: { 1: '1', 2: '2' } },
    { id: 2, name: 'Anders Björk', email: 'anders@test.se', groups: ['Projektledare', 'Gubbarna'], goals: 125, isApproved: true, isAdmin: false, predictions: { 1: 'X', 2: '1' } },
];

const INSATS = 100;

export default function App() {
    // Autentisering
    const [currentUser, setCurrentUser] = useState(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [authError, setAuthError] = useState('');
    const [showRegister, setShowRegister] = useState(false);

    // App State
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [matches, setMatches] = useState(initialMatchesList);
    const [tips, setTips] = useState(initialTips);
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState('');

    // UI State
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState('Alla');
    const [isPrizePoolExpanded, setIsPrizePoolExpanded] = useState(false);
    const [notifications, setNotifications] = useState([{ id: 0, text: 'Välkommen till VM-tipset 2026!', time: 'System', unread: true, action: null }]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Admin inställningar
    const [deadline, setDeadline] = useState('2026-06-11T20:00');
    const [h2hUser1, setH2hUser1] = useState(1);
    const [h2hUser2, setH2hUser2] = useState(2);

    const previousLeaderRef = useRef(null);

    // --- HJÄLPMETODER ---
    const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };
    const getResultColor = (m, res) => { if (res === '1') return TEAMS[m.team1]?.primary || '#333'; if (res === '2') return TEAMS[m.team2]?.primary || '#333'; return '#64748b'; };
    const addNotification = (text, actionTab = null) => setNotifications(prev => [{ id: Date.now(), text, time: 'Nu', unread: true, action: actionTab }, ...prev]);

    // --- BERÄKNINGAR ---
    const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
    const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);

    const prizePool = useMemo(() => {
        const totalPot = activePlayers.length * INSATS;
        let first = 0, second = 0, third = 0;
        let baseSecond = totalPot * 0.22;
        if (baseSecond >= 200) {
            third = 100;
            first = Math.round((totalPot - third) * (0.68 / 0.90));
            second = (totalPot - third) - first;
        } else {
            first = Math.round(totalPot * 0.68);
            second = totalPot - first;
        }
        return { total: totalPot, first, second, third };
    }, [activePlayers]);

    const matchStats = useMemo(() => {
        return matches.map(m => {
            const picks = { '1': 0, 'X': 0, '2': 0 };
            activePlayers.forEach(u => { if (u.predictions[m.id]) picks[u.predictions[m.id]]++; });
            const total = activePlayers.length || 1;
            const pct = { '1': Math.round((picks['1'] / total) * 100), 'X': Math.round((picks['X'] / total) * 100), '2': Math.round((picks['2'] / total) * 100) };
            const fav = Object.keys(pct).reduce((a, b) => pct[a] > pct[b] ? a : b);
            const res = get1X2(m.goals1, m.goals2);

            const t1Tier = TEAMS[m.team1]?.tier || 2;
            const t2Tier = TEAMS[m.team2]?.tier || 2;

            let comm = "";
            if (res) {
                const okPct = pct[res];
                if (okPct < 25) comm = `🔥 JÄTTESKRÄLL! Endast ${okPct}% av gruppen prickade in detta.`;
                else if (okPct > 65) comm = `✅ Väntat resultat. Hela ${okPct}% inkasserar poäng.`;
                else comm = `${okPct}% av oss hade rätt tecken här.`;
            } else {
                if (pct[fav] > 70) comm = `📈 Gruppfavorit: ${TEAMS[m[fav === '1' ? 'team1' : 'team2']]?.flag} ${fav} (${pct[fav]}%).`;
                else comm = `🎲 Svårtippat! Inget tecken har över 50% av rösterna.`;
            }
            return { ...m, pct, fav, comm };
        });
    }, [activePlayers, matches]);

    const leaderboard = useMemo(() => {
        return activePlayers.map(u => {
            let pts = 0, virtualPts = 0;
            matchStats.forEach(m => {
                const res = get1X2(m.goals1, m.goals2);
                if (res && u.predictions[m.id] === res) {
                    if (m.status === 'finished') pts++; else if (m.status === 'live') virtualPts++;
                }
            });
            return { ...u, pts, virtualPts, diff: Math.abs(u.goals - goalsSoFar) };
        }).sort((a, b) => (b.pts + b.virtualPts) - (a.pts + a.virtualPts) || a.diff - b.diff)
            .map((u, i) => ({ ...u, rank: i + 1 }));
    }, [activePlayers, matchStats, goalsSoFar]);

    const h2hMatches = matchStats.map(m => {
        const u1Pick = activePlayers.find(u => u.id === h2hUser1)?.predictions[m.id];
        const u2Pick = activePlayers.find(u => u.id === h2hUser2)?.predictions[m.id];
        const res = get1X2(m.goals1, m.goals2);
        let state = 'neutral';
        if (m.status !== 'upcoming' && res) {
            if (u1Pick === res && u2Pick !== res) state = 'u1_win';
            else if (u2Pick === res && u1Pick !== res) state = 'u2_win';
            else if (u1Pick === res && u2Pick === res) state = 'both_win';
            else state = 'both_lose';
        } else {
            state = (u1Pick === u2Pick) ? 'agreed' : 'disagreed';
        }
        return { ...m, u1Pick, u2Pick, res, state };
    });

    // --- ACTIONS ---
    const handleLogin = (e) => {
        e.preventDefault();
        const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());
        if (user && user.isApproved) { setCurrentUser(user); if (user.isAdmin) setActiveTab('admin'); }
        else setAuthError(user ? "Din betalning är inte godkänd än." : "E-postadressen hittades inte.");
    };

    const sendChat = (e) => {
        e.preventDefault();
        if (!newChatMsg.trim()) return;
        activePlayers.forEach(p => {
            if (newChatMsg.includes(`@${p.name.split(' ')[0]}`)) addNotification(`💬 ${currentUser.name} taggade dig i chatten!`, 'chat');
        });
        setChatMessages(prev => [...prev, { id: Date.now(), user: currentUser.name, text: newChatMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setNewChatMsg('');
    };

    if (!currentUser) return (
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-center italic mb-2 tracking-tighter">VM-TIPSET 2026</h1>
                <p className="text-center text-slate-400 text-sm mb-8">Logga in för att följa tabellen live</p>

                <div className="flex bg-black/40 rounded-xl p-1 mb-8">
                    <button onClick={() => setShowRegister(false)} className={`flex-1 py-3 text-sm font-bold rounded-lg ${!showRegister ? 'bg-indigo-600' : 'text-slate-500'}`}>Logga in</button>
                    <button onClick={() => setShowRegister(true)} className={`flex-1 py-3 text-sm font-bold rounded-lg ${showRegister ? 'bg-indigo-600' : 'text-slate-500'}`}>Nytt Tips</button>
                </div>

                {!showRegister ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Din godkända e-post" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" required />
                        {authError && <p className="text-red-400 text-xs font-bold">{authError}</p>}
                        <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-black shadow-lg">ÖPPNA TIPSET</button>
                        <p className="text-[10px] text-center text-slate-500 mt-4">Demo Admin: admin@vmtipset.se</p>
                    </form>
                ) : (
                    <form onSubmit={e => { e.preventDefault(); alert("Inskickat! Betala 100kr till Amon för att bli godkänd."); setShowRegister(false); }} className="space-y-4">
                        <input type="text" placeholder="Namn" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" required />
                        <input type="email" placeholder="E-post" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" required />
                        <input type="number" placeholder="Skiljefråga: Totalt antal mål?" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" required />
                        <button type="submit" className="w-full py-4 bg-emerald-600 rounded-xl font-black">SKICKA ANMÄLAN</button>
                    </form>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-8">
            {/* Header */}
            <header className="bg-[#0f172a] text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-amber-400" />
                    <h1 className="font-black italic tracking-tighter">VM-TIPSET 2026</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => { setNotifications(prev => prev.map(n => ({ ...n, unread: false }))); setShowNotifications(!showNotifications); }} className="relative p-2 bg-white/10 rounded-full">
                        <Bell size={20} />
                        {notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]" />}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-4 top-16 w-72 bg-white rounded-2xl shadow-2xl text-slate-800 border z-50 overflow-hidden">
                            {notifications.map(n => (
                                <div key={n.id} onClick={() => { if (n.action) setActiveTab(n.action); setShowNotifications(false); }} className="p-4 border-b hover:bg-slate-50 cursor-pointer text-sm">
                                    <p className="font-medium">{n.text}</p><span className="text-[10px] text-slate-400 mt-1 block font-bold uppercase">{n.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                </div>
            </header>

            {/* Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex justify-around p-1 sm:static sm:max-w-5xl sm:mx-auto sm:my-6 sm:rounded-2xl sm:border sm:shadow-lg">
                {[
                    { id: 'leaderboard', icon: Trophy, label: 'Ställning' },
                    { id: 'h2h', icon: Swords, label: 'H2H' },
                    { id: 'chat', icon: MessageSquare, label: 'Snackis' },
                    { id: 'matches', icon: CalendarDays, label: 'Matcher' },
                    { id: 'stats', icon: BarChart3, label: 'Stats' },
                    ...(currentUser.isAdmin ? [{ id: 'admin', icon: Settings, label: 'Admin' }] : [])
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-3 flex flex-col items-center gap-1 flex-1 transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <tab.icon size={22} /><span className="text-[9px] font-bold uppercase">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="max-w-5xl mx-auto p-4">
                {/* Prispott */}
                <div className="bg-slate-900 rounded-3xl p-5 text-white mb-6 border border-slate-800">
                    <button onClick={() => setIsPrizePoolExpanded(!isPrizePoolExpanded)} className="w-full flex justify-between items-center outline-none">
                        <div className="flex items-center gap-3">
                            <Banknote className="text-emerald-400" size={24} />
                            <span className="font-black text-lg">Prispott: {prizePool.total} kr</span>
                            <div className="bg-blue-900/50 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 flex items-center gap-2 ml-2"><Goal size={14} className="text-blue-400" /> {goalsSoFar} mål</div>
                        </div>
                        {isPrizePoolExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {isPrizePoolExpanded && (
                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-center gap-12 animate-in slide-in-from-top-2">
                            <div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">1:a Pris</span><span className="text-2xl font-black text-amber-400">{prizePool.first} kr</span></div>
                            <div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">2:a Pris</span><span className="text-2xl font-black text-slate-300">{prizePool.second} kr</span></div>
                            {prizePool.third > 0 && <div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">3:e Pris</span><span className="text-2xl font-black text-orange-400">{prizePool.third} kr</span></div>}
                        </div>
                    )}
                </div>

                {/* Innehåll */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {GROUPS.map(g => (
                                <button key={g} onClick={() => setSelectedGroup(g)} className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all whitespace-nowrap ${selectedGroup === g ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500'}`}>{g}</button>
                            ))}
                        </div>
                        <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="p-4 text-center">Rank</th><th className="p-4">Deltagare</th><th className="p-4 text-center">Poäng</th></tr></thead>
                                <tbody className="divide-y">
                                    {leaderboard.filter(u => selectedGroup === 'Alla' || u.groups.includes(selectedGroup)).map(u => (
                                        <tr key={u.id} className="hover:bg-indigo-50/50 cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                                            <td className="p-4 text-center font-black">#{u.rank}</td>
                                            <td className="p-4"><div className="font-bold">{u.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{u.groups.join(', ')} | Mål: {u.goals}</div></td>
                                            <td className="p-4 text-center bg-indigo-50/30">
                                                <span className="text-2xl font-black text-indigo-700">{u.pts}</span>
                                                {u.virtualPts > 0 && <span className="text-xs font-black text-emerald-500 animate-pulse ml-1">+{u.virtualPts}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Matris alltid synlig under listan */}
                        <div className="pt-8">
                            <h3 className="font-black text-lg mb-4 px-2 flex items-center gap-2"><Grid3X3 size={22} className="text-indigo-600" /> Alla Tips (Matris)</h3>
                            <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[10px] border-collapse whitespace-nowrap">
                                        <thead><tr className="bg-slate-50 border-b font-black uppercase text-slate-400"><th className="p-3 sticky left-0 bg-slate-50 z-10 border-r">Match</th>{activePlayers.map(u => <th key={u.id} className="p-3 text-center">{u.name.split(' ')[0]}</th>)}</tr></thead>
                                        <tbody className="divide-y">{matches.slice(0, 15).map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50">
                                                <td className="p-3 sticky left-0 bg-white z-10 font-bold border-r">{TEAMS[m.team1]?.flag} {TEAMS[m.team2]?.flag} {m.team1.slice(0, 3)}-{m.team2.slice(0, 3)}</td>
                                                {activePlayers.map(u => <td key={u.id} className="p-3 text-center border-r font-bold">{u.predictions[m.id] || '-'}</td>)}
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="bg-white rounded-3xl border h-[70vh] flex flex-col overflow-hidden shadow-xl">
                        <div className="bg-indigo-600 p-5 text-white flex items-center gap-3"><MessageSquare size={24} /><h2 className="text-xl font-black uppercase tracking-tighter">Snackis</h2></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {chatMessages.map(m => (
                                <div key={m.id} className={`flex flex-col ${m.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] font-black text-slate-400 mb-1">{m.user} • {m.time}</span>
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm ${m.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>
                                        {m.text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="font-black text-amber-300 bg-black/10 px-1 rounded">{part}</span> : part)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendChat} className="p-4 bg-white border-t flex gap-2"><input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Skriv @Namn för att tagga..." className="flex-1 bg-slate-100 p-4 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" /><button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg"><Send /></button></form>
                    </div>
                )}

                {activeTab === 'h2h' && (
                    <div className="space-y-6">
                        <div className="bg-[#0f172a] p-8 rounded-3xl text-white flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                            <div className="flex-1 w-full text-center"><select className="bg-slate-800 w-full p-4 rounded-2xl border border-slate-700 outline-none font-black text-xl text-indigo-400" value={h2hUser1} onChange={e => setH2hUser1(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="text-4xl font-black mt-4">{leaderboard.find(u => u.id === h2hUser1)?.pts} pts</div></div>
                            <div className="bg-amber-400 text-amber-950 font-black px-6 py-3 rounded-2xl transform -skew-x-12 text-2xl shadow-lg">VS</div>
                            <div className="flex-1 w-full text-center"><select className="bg-slate-800 w-full p-4 rounded-2xl border border-slate-700 outline-none font-black text-xl text-rose-400" value={h2hUser2} onChange={e => setH2hUser2(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="text-4xl font-black mt-4">{leaderboard.find(u => u.id === h2hUser2)?.pts} pts</div></div>
                        </div>
                        <div className="space-y-3">
                            {h2hMatches.slice(0, 20).map(m => (
                                <div key={m.id} className={`bg-white rounded-3xl p-5 flex items-center justify-between border-2 transition-all ${m.state === 'disagreed' ? 'border-amber-400 shadow-amber-500/10' : 'border-white shadow-sm'}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${m.state === 'u1_win' || m.state === 'both_win' ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-300'}`}>{m.u1Pick || '-'}</div>
                                    <div className="text-center flex-1 px-4"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.date}</div><div className="font-black text-sm flex items-center justify-center gap-2">{TEAMS[m.team1]?.flag} {m.team1.slice(0, 12)} - {m.team2.slice(0, 12)} {TEAMS[m.team2]?.flag}</div>{m.res && <div className="text-[11px] font-black text-indigo-600 mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-full uppercase">Slut: {m.res} ({m.goals1}-{m.goals2})</div>}</div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${m.state === 'u2_win' || m.state === 'both_win' ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-300'}`}>{m.u2Pick || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {matches.map(m => (
                            <div key={m.id} className="bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 flex"><div className="flex-1" style={{ backgroundColor: TEAMS[m.team1]?.primary }} /><div className="flex-1" style={{ backgroundColor: TEAMS[m.team2]?.primary }} /></div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.date} | Grp {m.group}</span>
                                    {m.status === 'live' ? <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1"><PlayCircle size={12} /> LIVE {m.minute}</span> : m.status === 'finished' ? <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Slutresultat</span> : <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase">Kommande</span>}
                                </div>
                                <div className="flex justify-between items-center text-center">
                                    <div className="flex-1"><span className="text-5xl block mb-2">{TEAMS[m.team1]?.flag}</span><span className="font-black text-sm">{m.team1}</span></div>
                                    <div className="px-6">{m.status !== 'upcoming' ? <div className="text-3xl font-black bg-slate-100 px-5 py-2 rounded-2xl border-2">{m.goals1}-{m.goals2}</div> : <div className="text-xl font-black text-slate-200 italic">VS</div>}</div>
                                    <div className="flex-1"><span className="text-5xl block mb-2">{TEAMS[m.team2]?.flag}</span><span className="font-black text-sm">{m.team2}</span></div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-300 text-center uppercase tracking-widest flex items-center justify-center gap-1"><MapPin size={12} /> {m.venue}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-black px-2 flex items-center gap-3"><BarChart3 size={32} className="text-indigo-600" /> Matchanalys</h2>
                        <div className="grid gap-6">
                            {matchStats.slice(0, 15).map(m => (
                                <div key={m.id} className="bg-white p-8 rounded-[40px] border shadow-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundImage: `linear-gradient(to bottom, ${TEAMS[m.team1]?.primary}, ${TEAMS[m.team2]?.primary})` }} />
                                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pl-2 font-black text-lg gap-4">
                                        <div className="flex items-center gap-3"><span className="text-3xl">{TEAMS[m.team1]?.flag}</span>{m.team1}<span className="text-slate-300">-</span>{m.team2}<span className="text-3xl">{TEAMS[m.team2]?.flag}</span></div>
                                        {m.goals1 !== null && <div className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Check size={14} /> Rätt tecken: {get1X2(m.goals1, m.goals2)}</div>}
                                    </div>
                                    <div className="flex h-12 rounded-2xl overflow-hidden bg-slate-100 ml-2 mb-6 shadow-inner">
                                        <div style={{ width: `${m.pct['1']}%`, backgroundColor: TEAMS[m.team1]?.primary }} className="flex items-center justify-center text-white text-xs font-black shadow-lg">1 ({m.pct['1']}%)</div>
                                        <div style={{ width: `${m.pct['X']}%`, backgroundColor: '#cbd5e1' }} className="flex items-center justify-center text-slate-700 text-xs font-black border-x-2 border-white/30">X ({m.pct['X']}%)</div>
                                        <div style={{ width: `${m.pct['2']}%`, backgroundColor: TEAMS[m.team2]?.primary }} className="flex items-center justify-center text-white text-xs font-black shadow-lg">2 ({m.pct['2']}%)</div>
                                    </div>
                                    <div className="ml-2 bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 flex gap-4 items-start"><AlertCircle size={20} className="text-indigo-600 shrink-0 mt-1" /><p className="text-sm text-slate-700 font-bold leading-relaxed">{m.comm}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && currentUser.isAdmin && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-emerald-600"><ShieldCheck size={28} /> Godkänn Betalningar</h2>
                            <div className="space-y-3">
                                {tips.filter(t => !t.isAdmin).map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-2 transition-all">
                                        <div><div className="font-black text-slate-800">{t.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.email}</div><div className="text-[9px] font-black text-indigo-500 mt-1 uppercase">Ligor: {t.groups.join(', ')}</div></div>
                                        <button onClick={() => { const n = [...tips]; n.find(x => x.id === t.id).isApproved = !t.isApproved; setTips(n); }} className={`px-6 py-2 rounded-xl text-[10px] font-black border-2 shadow-sm ${t.isApproved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>{t.isApproved ? '✅ GODKÄND' : 'GODKÄNN'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-2xl font-black mb-8">Matchrapportering (Live)</h2>
                            <div className="space-y-4">
                                {matches.slice(0, 10).map(m => (
                                    <div key={m.id} className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-center gap-4 ${m.status === 'live' ? 'bg-red-50 border-red-200 shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="font-black text-slate-800">{m.team1} - {m.team2}</div>
                                        <div className="flex gap-2 items-center">
                                            <button onClick={() => { const n = [...matches]; const match = n.find(x => x.id === m.id); match.status = 'live'; match.goals1 = match.goals1 || 0; match.goals2 = match.goals2 || 0; match.minute = "1'"; setMatches(n); }} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black shadow-md">LIVE</button>
                                            <input type="number" value={m.goals1 ?? ''} onChange={e => { const n = [...matches]; n.find(x => x.id === m.id).goals1 = parseInt(e.target.value); setMatches(n); }} className="w-12 h-12 text-center border-2 rounded-xl font-black text-lg outline-none focus:border-indigo-500" placeholder="0" />
                                            <span className="font-black text-slate-300">-</span>
                                            <input type="number" value={m.goals2 ?? ''} onChange={e => { const n = [...matches]; n.find(x => x.id === m.id).goals2 = parseInt(e.target.value); setMatches(n); }} className="w-12 h-12 text-center border-2 rounded-xl font-black text-lg outline-none focus:border-indigo-500" placeholder="0" />
                                            <button onClick={() => { const n = [...matches]; n.find(x => x.id === m.id).status = 'finished'; n.find(x => x.id === m.id).minute = 'FT'; setMatches(n); }} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-md">SLUT</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}