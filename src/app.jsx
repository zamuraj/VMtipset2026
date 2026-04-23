import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Trophy, BarChart3, Settings, CalendarDays, Check,
    TrendingUp, AlertCircle, Clock,
    Grid3X3, User, X, Lock, Unlock, Zap, Swords, Bell,
    PlayCircle, Banknote, Users, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';

// --- OFFICIELT SPELSCHEMA VM 2026 (48 GRUPPMATCHER) ---
const VM_SCHEDULE = [
    "1|11 jun 21:00|A|Mexiko|Sydafrika|Mexico City (Azteca)", "2|12 jun 00:00|B|Kanada|Slovakien|Toronto (BMO Field)",
    "3|12 jun 15:00|A|Sydkorea|Tjeckien|Guadalajara (Akron)", "4|13 jun 00:00|D|USA|Paraguay|Los Angeles (SoFi)",
    "5|13 jun 21:00|B|Qatar|Schweiz|San Francisco (Levi's)", "6|14 jun 00:00|C|Brasilien|Marocko|New Jersey (MetLife)",
    "7|14 jun 03:00|C|Haiti|Skottland|Boston (Gillette)", "8|14 jun 06:00|D|Australien|Turkiet|Vancouver (BC Place)",
    "9|14 jun 19:00|E|Tyskland|Curaçao|Houston (NRG)", "10|14 jun 22:00|F|Nederländerna|Japan|Dallas (AT&T)",
    "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Philadelphia (Linc)", "12|15 jun 04:00|F|Sverige|Tunisien|Monterrey (BBVA)",
    "13|15 jun 18:00|H|Spanien|Kap Verde|Atlanta (Mercedes-Benz)", "14|15 jun 21:00|G|Belgien|Egypten|Seattle (Lumen)",
    "15|16 jun 00:00|H|Saudiarabien|Uruguay|Miami (Hard Rock)", "16|16 jun 03:00|G|Iran|Nya Zeeland|SoFi Stadium",
    "17|16 jun 21:00|I|Frankrike|Senegal|MetLife Stadium", "18|17 jun 00:00|I|Irak|Norge|Gillette Stadium",
    "19|17 jun 03:00|J|Argentina|Algeriet|Arrowhead Stadium", "20|17 jun 06:00|J|Österrike|Jordanien|Levi's Stadium",
    "21|17 jun 19:00|K|Portugal|DR Kongo|NRG Stadium", "22|17 jun 22:00|L|England|Kroatien|AT&T Stadium",
    "23|18 jun 01:00|L|Ghana|Panama|BMO Field", "24|18 jun 04:00|K|Uzbekistan|Colombia|Mexico City",
    "25|18 jun 18:00|A|Tjeckien|Sydafrika|Mercedes-Benz St.", "26|18 jun 21:00|B|Schweiz|Bosnien|SoFi Stadium",
    "27|19 jun 00:00|B|Kanada|Qatar|BC Place", "28|19 jun 03:00|A|Mexiko|Sydkorea|Akron Stadium",
    "29|19 jun 21:00|D|USA|Australien|Lumen Field", "30|20 jun 00:00|C|Skottland|Marocko|Gillette Stadium",
    "31|20 jun 03:00|C|Brasilien|Haiti|Lincoln Financial", "32|20 jun 06:00|D|Turkiet|Paraguay|Levi's Stadium",
    "33|20 jun 19:00|F|Nederländerna|Sverige|NRG Stadium", "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|BMO Field",
    "35|21 jun 02:00|E|Ecuador|Curaçao|Arrowhead Stadium", "36|21 jun 06:00|F|Tunisien|Japan|BBVA Bancomer",
    "37|21 jun 18:00|H|Spanien|Saudiarabien|Atlanta", "38|21 jun 21:00|G|Belgien|Iran|SoFi Stadium",
    "39|22 jun 00:00|H|Uruguay|Kap Verde|Miami", "40|22 jun 03:00|G|Nya Zeeland|Egypten|Vancouver",
    "41|22 jun 19:00|J|Argentina|Österrike|Arrowhead Stadium", "42|22 jun 23:00|I|Frankrike|Irak|Philadelphia",
    "43|23 jun 02:00|I|Norge|Senegal|MetLife Stadium", "44|23 jun 05:00|J|Jordanien|Algeriet|Levi's Stadium",
    "45|23 jun 19:00|K|Portugal|Uzbekistan|Houston", "46|23 jun 22:00|L|England|Ghana|Gillette Stadium",
    "47|24 jun 01:00|L|Panama|Kroatien|Gillette Stadium", "48|24 jun 04:00|K|Colombia|DR Kongo|Akron Stadium"
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
    'Belgien': { flag: '🇧🇪', primary: '#E30A17', tier: 1 }, 'Egypten': { flag: '🇪🇬', primary: '#C09307', tier: 2 },
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

const initialMatches = VM_SCHEDULE.map(m => {
    const [id, date, grp, t1, t2, ven] = m.split('|');
    return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, venue: ven, goals1: null, goals2: null, status: 'upcoming', minute: null };
});

const ALL_GROUPS = ['Alla', 'Säljarna', 'Projektledare', 'Ledningen', 'Dalabyggsam', 'Gubbarna'];

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [matches, setMatches] = useState(initialMatches);
    const [tips, setTips] = useState([
        { id: 'admin', name: 'Arrangör Admin', email: 'zettergren.emil@gmail.com', password: 'mitthemligalosenord', groups: ['Ledningen'], goals: 132, predictions: {}, isApproved: true, isAdmin: true },
        { id: 1, name: 'Adam Johansson', email: 'adam@test.se', groups: ['Säljarna', 'Dalabyggsam'], goals: 110, isApproved: true, isAdmin: false, predictions: { 1: '1', 2: '1' } },
        { id: 2, name: 'Anders Björk', email: 'anders@test.se', groups: ['Projektledare', 'Gubbarna'], goals: 125, isApproved: true, isAdmin: false, predictions: { 1: 'X', 2: '2' } },
    ]);
    const [chatMessages, setChatMessages] = useState([{ id: 1, user: 'Amon Admin', text: 'Välkomna till VM 2026! Tagga polare med @Namn', time: '12:00' }]);
    const [newChatMsg, setNewChatMsg] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showMatrix, setShowMatrix] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState('Alla');
    const [isPrizePoolExpanded, setIsPrizePoolExpanded] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [deadline, setDeadline] = useState('2026-06-11T20:00');
    const [h2hUser1, setH2hUser1] = useState(1);
    const [h2hUser2, setH2hUser2] = useState(2);

    // --- LOGIK ---
    const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };
    const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
    const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);

    const prizePool = useMemo(() => {
        const totalPot = activePlayers.length * 100;
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
                if (okPct < 25) comm = `🔥 SKRÄLL! Endast ${okPct}% av gänget satte ${TEAMS[res === '1' ? m.team1 : m.team2]?.flag}.`;
                else if (okPct > 65) comm = `✅ Väntat resultat. De flesta inkasserar poäng.`;
                else comm = `${okPct}% av oss hade rätt tecken här.`;
            } else {
                comm = pct[fav] > 60 ? `📈 Gruppfavorit: ${fav} (${pct[fav]}%)` : "🎲 Helt öppet i tipset!";
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
        }).sort((a, b) => (b.pts + b.virtualPts) - (a.pts + a.virtualPts) || a.diff - b.diff).map((u, i) => ({ ...u, rank: i + 1 }));
    }, [activePlayers, matchStats, goalsSoFar]);

    const h2hMatches = matchStats.map(m => {
        const u1Pick = activePlayers.find(u => u.id === h2hUser1)?.predictions[m.id];
        const u2Pick = activePlayers.find(u => u.id === h2hUser2)?.predictions[m.id];
        const res = get1X2(m.goals1, m.goals2);
        let state = (u1Pick === u2Pick) ? 'agreed' : 'disagreed';
        if (res) {
            if (u1Pick === res && u2Pick !== res) state = 'u1_win';
            else if (u2Pick === res && u1Pick !== res) state = 'u2_win';
            else if (u1Pick === res && u2Pick === res) state = 'both_win';
        }
        return { ...m, u1Pick, u2Pick, res, state };
    });

    const handleLogin = (e) => {
        e.preventDefault();
        const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());

        if (!user) return setAuthError("E-postadressen hittades inte i systemet.");

        if (user.isAdmin) {
            if (loginPassword !== user.password) {
                return setAuthError("Fel lösenord för admin.");
            }
        } else if (!user.isApproved) {
            return setAuthError("Din anmälan väntar på godkännande (Betalning saknas).");
        }

        setAuthError('');
        setCurrentUser(user);
        if (user.isAdmin) setActiveTab('admin');
    };

    const sendChat = (e) => {
        e.preventDefault();
        if (!newChatMsg.trim()) return;
        activePlayers.forEach(p => {
            if (newChatMsg.includes(`@${p.name.split(' ')[0]}`)) setNotifications(prev => [{ id: Date.now(), text: `💬 ${currentUser.name} taggade dig i chatten!`, time: 'Nu', unread: true, action: 'chat' }, ...prev]);
        });
        setChatMessages(prev => [...prev, { id: Date.now(), user: currentUser.name, text: newChatMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setNewChatMsg('');
    };

    if (!currentUser) return (
        <div className="min-h-screen bg-vmdark text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
                <Trophy className="w-16 h-16 text-vmgold mx-auto mb-6" />
                <h1 className="text-4xl font-black text-center italic mb-8 tracking-tighter">VM-TIPSET 2026</h1>

                {!showRegister ? (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-blue-500/10 p-3 rounded-lg text-xs text-blue-200 border border-blue-500/20">Logga in med <strong>zettergren.emil@gmail.com</strong> (Admin) eller <strong>adam@test.se</strong> (Spelare).</div>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder-slate-500" placeholder="din.epost@exempel.se" required />
                        </div>

                        {/* Lösenordsfält som bara visas för Admin */}
                        {loginEmail.toLowerCase().trim() === 'zettergren.emil@gmail.com' && (
                            <div className="relative animate-in fade-in slide-in-from-top-2">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input type="password" value={loginPassword} onChange={(e) => setAuthError('') || setLoginPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder-slate-500" placeholder="Lösenord" required />
                            </div>
                        )}

                        {authError && <div className="text-red-400 text-sm font-bold flex items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20"><AlertCircle size={16} className="mr-2 shrink-0" />{authError}</div>}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]">ÖPPNA TIPSET</button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-emerald-200 text-sm font-medium">Anmäl dig genom att skicka ett mail till admin eller via Swish-instruktionerna.</div>
                        <button onClick={() => setShowRegister(false)} className="text-indigo-400 font-bold text-sm">Tillbaka till inloggning</button>
                    </div>
                )}

                <div className="mt-10 pt-6 border-t border-white/10 text-center opacity-60">
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2">Saknar du konto?</p>
                    <button className="text-emerald-400 font-black text-sm" onClick={() => setShowRegister(true)}>LÄMNA TIPS / REGISTRERA</button>
                </div>
            </div>
        </div>
    );

    const NavItem = ({ id, icon: Icon, label }) => (
        <button onClick={() => setActiveTab(id)} className={`flex-1 py-4 px-1 flex flex-col items-center justify-center gap-1 transition-colors relative min-w-[65px] ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Icon size={22} /><span className="text-[9px] font-bold uppercase">{label}</span>
            {activeTab === id && <div className="absolute top-0 sm:bottom-0 sm:top-auto w-1/2 h-1 bg-indigo-600 rounded-b-full" />}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            <header className="bg-vmdark text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-2"><Trophy size={20} className="text-vmgold" /><h1 className="font-black italic">VM-TIPSET 2026</h1></div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-white/5 rounded-full"><Bell size={20} />{notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-vmdark" />}</button>
                    {showNotifications && (
                        <div className="absolute right-4 top-16 w-72 bg-white rounded-2xl shadow-2xl text-slate-800 border z-50 overflow-hidden">
                            {notifications.map(n => (<div key={n.id} onClick={() => { if (n.action) setActiveTab(n.action); setShowNotifications(false); }} className="p-4 border-b hover:bg-slate-50 cursor-pointer text-sm font-medium">{n.text}</div>))}
                            {notifications.length === 0 && <div className="p-4 text-center text-slate-400">Inga notiser.</div>}
                        </div>
                    )}
                    <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
                </div>
            </header>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex justify-around p-1 sm:sticky sm:top-[72px] sm:max-w-5xl sm:mx-auto sm:my-4 sm:rounded-2xl sm:border sm:shadow-lg">
                <NavItem id="leaderboard" icon={Trophy} label="Ställning" />
                <NavItem id="h2h" icon={Swords} label="H2H" />
                <NavItem id="chat" icon={MessageSquare} label="Snackis" />
                <NavItem id="matches" icon={CalendarDays} label="Matcher" />
                <NavItem id="stats" icon={BarChart3} label="Stats" />
                {currentUser.isAdmin && <NavItem id="admin" icon={Settings} label="Admin" />}
            </nav>

            <main className="max-w-5xl mx-auto p-4 space-y-6">
                <div className="bg-vmdark rounded-2xl p-4 text-white border border-slate-800">
                    <button onClick={() => setIsPrizePoolExpanded(!isPrizePoolExpanded)} className="w-full flex justify-between items-center outline-none">
                        <div className="flex items-center gap-4"><Banknote className="text-emerald-400" /><div><span className="text-[10px] font-bold text-slate-500 uppercase block">Prispott</span><span className="font-black">{prizePool.total} kr</span></div></div>
                        <div className="bg-blue-900/40 px-3 py-1 rounded-2xl flex items-center gap-2"><Goal size={16} className="text-blue-400" /><span className="font-black text-sm">{goalsSoFar} mål</span></div>
                        {isPrizePoolExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {isPrizePoolExpanded && <div className="mt-4 pt-4 border-t border-white/5 flex justify-center gap-8"><div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">1:a Pris</span><span className="text-xl font-black text-vmgold">{prizePool.first} kr</span></div><div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">2:a Pris</span><span className="text-xl font-black text-slate-200">{prizePool.second} kr</span></div><div className="text-center"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">3:e Pris</span><span className="text-xl font-black text-orange-400">{prizePool.third} kr</span></div></div>}
                </div>

                {activeTab === 'leaderboard' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{ALL_GROUPS.map(g => (<button key={g} onClick={() => setSelectedGroup(g)} className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all whitespace-nowrap ${selectedGroup === g ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}>{g}</button>))}</div>
                        <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="p-4 text-center">Rank</th><th className="p-4">Deltagare</th><th className="p-4 text-center">Poäng</th></tr></thead>
                                <tbody className="divide-y">{leaderboard.filter(u => selectedGroup === 'Alla' || u.groups.includes(selectedGroup)).map(u => (
                                    <tr key={u.id} className="hover:bg-indigo-50/50 cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                                        <td className="p-4 text-center font-black text-slate-400">#{u.rank}</td>
                                        <td className="p-4"><div className="font-bold">{u.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{u.groups.join(', ')} | Mål: {u.goals}</div></td>
                                        <td className="p-4 text-center bg-indigo-50/20"><span className="text-2xl font-black text-indigo-700">{u.pts}</span>{u.virtualPts > 0 && <span className="text-[10px] font-black text-emerald-500 ml-1 animate-pulse">+{u.virtualPts} live</span>}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <div className="bg-white rounded-3xl border overflow-hidden shadow-sm overflow-x-auto p-4">
                            <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-slate-400 px-2">Tippningsmatris</h3>
                            <table className="w-full text-[10px] border-collapse whitespace-nowrap">
                                <thead><tr className="bg-slate-50 border-b"><th className="p-2 sticky left-0 bg-slate-50">Match</th>{activePlayers.map(u => <th key={u.id} className="p-2 text-center">{u.name.split(' ')[0]}</th>)}</tr></thead>
                                <tbody>{matches.slice(0, 15).map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50"><td className="p-2 sticky left-0 bg-white border-r font-bold">{TEAMS[m.team1]?.flag} {TEAMS[m.team2]?.flag} {m.team1.slice(0, 3)}-{m.team2.slice(0, 3)}</td>{activePlayers.map(u => <td key={u.id} className="p-2 text-center border-r">{u.predictions[m.id] || '-'}</td>)}</tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="bg-white rounded-3xl border h-[65vh] flex flex-col overflow-hidden shadow-xl">
                        <div className="bg-indigo-600 p-4 text-white flex items-center gap-3"><MessageSquare /><h2 className="font-black uppercase">Snackis</h2></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {chatMessages.map(m => (
                                <div key={m.id} className={`flex flex-col ${m.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] font-black text-slate-400 mb-1 px-1">{m.user} • {m.time}</span>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm ${m.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>
                                        {m.text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="font-black text-vmgold">{part}</span> : part)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendChat} className="p-4 bg-white border-t flex gap-2"><input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Hetsa polarna @Namn..." className="flex-1 bg-slate-100 p-3 rounded-xl outline-none focus:bg-white transition-all" /><button className="bg-indigo-600 text-white p-3 rounded-xl"><Send /></button></form>
                    </div>
                )}

                {activeTab === 'h2h' && (
                    <div className="space-y-6">
                        <div className="bg-vmdark p-6 rounded-3xl text-white flex items-center gap-4">
                            <select className="bg-slate-800 p-3 rounded-xl flex-1 outline-none font-bold" value={h2hUser1} onChange={e => setH2hUser1(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                            <div className="bg-vmgold text-vmdark font-black px-4 py-2 rounded-xl transform -skew-x-12">VS</div>
                            <select className="bg-slate-800 p-3 rounded-xl flex-1 outline-none font-bold" value={h2hUser2} onChange={e => setH2hUser2(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                        </div>
                        <div className="space-y-2">
                            {h2hMatches.slice(0, 15).map(m => (
                                <div key={m.id} className={`bg-white rounded-2xl p-4 flex items-center justify-between border relative overflow-hidden ${m.state === 'disagreed' ? 'border-amber-400' : 'border-slate-100'}`}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50" style={{ backgroundColor: TEAMS[m.team1]?.primary }} />
                                    <div className="absolute right-0 top-0 bottom-0 w-1 opacity-50" style={{ backgroundColor: TEAMS[m.team2]?.primary }} />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${m.state.includes('u1_win') || m.state === 'both_win' ? 'bg-green-500 text-white' : 'bg-slate-100'}`}>{m.u1Pick || '-'}</div>
                                    <div className="text-center flex-1 px-4 text-sm font-bold">{m.team1} - {m.team2} {m.res && <span className="block text-[9px] uppercase text-indigo-600 font-black">Slut: {m.res}</span>}</div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${m.state.includes('u2_win') || m.state === 'both_win' ? 'bg-green-500 text-white' : 'bg-slate-100'}`}>{m.u2Pick || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {matches.map(m => (
                            <div key={m.id} className="bg-white rounded-2xl border p-6 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 flex"><div className="flex-1" style={{ backgroundColor: TEAMS[m.team1]?.primary }} /><div className="flex-1" style={{ backgroundColor: TEAMS[m.team2]?.primary }} /></div>
                                <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.date} | Grp {m.group}</span>{m.status === 'live' ? <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1"><PlayCircle size={14} /> LIVE {m.minute}</span> : m.status === 'finished' ? <span className="bg-vmdark text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Slut</span> : <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase">Kommande</span>}</div>
                                <div className="flex justify-between items-center text-center"><div className="flex-1"><span className="text-4xl block mb-1">{TEAMS[m.team1]?.flag}</span><span className="font-black text-xs">{m.team1}</span></div><div className="px-6">{m.status !== 'upcoming' ? <div className="text-3xl font-black bg-slate-100 px-4 py-2 rounded-2xl border-2">{m.goals1}-{m.goals2}</div> : <div className="text-xl font-black text-slate-200 italic uppercase">VS</div>}</div><div className="flex-1"><span className="text-4xl block mb-1">{TEAMS[m.team2]?.flag}</span><span className="font-black text-xs">{m.team2}</span></div></div>
                                <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-300 text-center uppercase tracking-widest flex items-center justify-center gap-1"><MapPin size={10} /> {m.venue}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black px-2 flex items-center gap-2"><BarChart3 className="text-indigo-600" /> Matchanalys</h2>
                        <div className="grid gap-6">
                            {matchStats.slice(0, 15).map(m => (
                                <div key={m.id} className="bg-white p-6 rounded-3xl border relative overflow-hidden shadow-sm">
                                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundImage: `linear-gradient(to bottom, ${TEAMS[m.team1]?.primary}, ${TEAMS[m.team2]?.primary})` }} />
                                    <div className="flex flex-col sm:flex-row justify-between mb-6 pl-2 font-black text-lg gap-4">
                                        <div className="flex items-center gap-2"><span>{TEAMS[m.team1]?.flag} {m.team1} - {m.team2} {TEAMS[m.team2]?.flag}</span></div>
                                        {m.goals1 !== null && <div className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Check size={14} /> Rätt: {get1X2(m.goals1, m.goals2)}</div>}
                                    </div>
                                    <div className="flex h-10 rounded-xl overflow-hidden bg-slate-100 ml-2 mb-6 shadow-inner">
                                        <div style={{ width: `${m.pct['1']}%`, backgroundColor: TEAMS[m.team1]?.primary }} className="flex items-center justify-center text-white text-[10px] font-black shadow-lg">1 ({m.pct['1']}%)</div>
                                        <div style={{ width: `${m.pct['X']}%`, backgroundColor: '#cbd5e1' }} className="flex items-center justify-center text-slate-700 text-[10px] font-black border-x-2 border-white/20">X ({m.pct['X']}%)</div>
                                        <div style={{ width: `${m.pct['2']}%`, backgroundColor: TEAMS[m.team2]?.primary }} className="flex items-center justify-center text-white text-[10px] font-black shadow-lg">2 ({m.pct['2']}%)</div>
                                    </div>
                                    <div className="ml-2 bg-indigo-50/50 p-4 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed flex gap-3"><AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />{m.comm}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && currentUser.isAdmin && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-xl font-black mb-8 flex items-center gap-3 text-emerald-600"><ShieldCheck size={28} /> Betalningskontroll</h2>
                            <div className="space-y-3">
                                {tips.filter(t => !t.isAdmin).map(t => (
                                    <div key={t.id} className={`flex justify-between items-center p-3 rounded-xl border ${t.isApproved ? 'bg-emerald-50' : 'bg-slate-50 opacity-60'}`}>
                                        <div><div className="font-black">{t.name}</div><div className="text-[10px] font-bold text-slate-400">{t.email}</div></div>
                                        <button onClick={() => { const n = [...tips]; n.find(x => x.id === t.id).isApproved = !t.isApproved; setTips(n); }} className={`px-4 py-2 rounded-xl text-xs font-black border ${t.isApproved ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}>{t.isApproved ? 'GODKÄND' : 'GODKÄNN'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-xl font-black mb-6">Matchrapportering (Live)</h2>
                            <div className="space-y-4">
                                {matches.slice(0, 10).map(m => (
                                    <div key={m.id} className={`p-4 rounded-2xl border-2 flex justify-between items-center ${m.status === 'live' ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
                                        <div className="font-black text-xs uppercase">{m.team1} - {m.team2}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { const n = [...matches]; const match = n.find(x => x.id === m.id); match.status = 'live'; match.goals1 = 0; match.goals2 = 0; match.minute = "1'"; setMatches(n); }} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black shadow-md">LIVE</button>
                                            <input type="number" value={m.goals1 ?? ''} onChange={e => { const n = [...matches]; n.find(x => x.id === m.id).goals1 = parseInt(e.target.value); setMatches(n); }} className="w-10 text-center border-2 rounded-lg font-black" />
                                            <input type="number" value={m.goals2 ?? ''} onChange={e => { const n = [...matches]; n.find(x => x.id === m.id).goals2 = parseInt(e.target.value); setMatches(n); }} className="w-10 text-center border-2 rounded-lg font-black" />
                                            <button onClick={() => { const n = [...matches]; n.find(x => x.id === m.id).status = 'finished'; n.find(x => x.id === m.id).minute = 'FT'; setMatches(n); }} className="px-3 py-1 bg-vmdark text-white rounded-lg text-[10px] font-black shadow-md">SLUT</button>
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