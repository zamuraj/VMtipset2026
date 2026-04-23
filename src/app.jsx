import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, BarChart3, Settings, CalendarDays, Check, 
  AlertCircle, Clock, Grid3X3, User, X, Lock, 
  Swords, Bell, PlayCircle, Banknote, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin, ListOrdered, Trash2
} from 'lucide-react';

// --- OFFICIELT SPELSCHEMA VM 2026 ---
const VM_SCHEDULE = [
  "1|11 jun 21:00|A|Mexiko|Sydafrika|Mexico City", "2|12 jun 00:00|B|Kanada|Slovakien|Toronto",
  "3|12 jun 15:00|A|Sydkorea|Tjeckien|Guadalajara", "4|13 jun 00:00|D|USA|Paraguay|Los Angeles",
  "5|13 jun 21:00|B|Qatar|Schweiz|San Francisco", "6|14 jun 00:00|C|Brasilien|Marocko|New Jersey",
  "7|14 jun 03:00|C|Haiti|Skottland|Boston", "8|14 jun 06:00|D|Australien|Turkiet|Vancouver",
  "9|14 jun 19:00|E|Tyskland|Curaçao|Houston", "10|14 jun 22:00|F|Nederländerna|Japan|Dallas",
  "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Philadelphia", "12|15 jun 04:00|F|Sverige|Tunisien|Monterrey",
  "13|15 jun 18:00|H|Spanien|Kap Verde|Atlanta", "14|15 jun 21:00|G|Belgien|Egypten|Seattle",
  "15|16 jun 00:00|H|Saudiarabien|Uruguay|Miami", "16|16 jun 03:00|G|Iran|Nya Zeeland|Los Angeles",
  "17|16 jun 21:00|I|Frankrike|Senegal|New Jersey", "18|17 jun 00:00|I|Irak|Norge|Boston",
  "19|17 jun 03:00|J|Argentina|Algeriet|Kansas City", "20|17 jun 06:00|J|Österrike|Jordanien|San Francisco",
  "21|17 jun 19:00|K|Portugal|DR Kongo|Houston", "22|17 jun 22:00|L|England|Kroatien|Dallas",
  "23|18 jun 01:00|L|Ghana|Panama|Toronto", "24|18 jun 04:00|K|Uzbekistan|Colombia|Mexico City",
  "25|18 jun 18:00|A|Tjeckien|Sydafrika|Atlanta", "26|18 jun 21:00|B|Schweiz|Bosnien|Los Angeles",
  "27|19 jun 00:00|B|Kanada|Qatar|Vancouver", "28|19 jun 03:00|A|Mexiko|Sydkorea|Guadalajara",
  "29|19 jun 21:00|D|USA|England|Seattle", "30|20 jun 00:00|C|Skottland|Marocko|Boston",
  "31|20 jun 03:00|C|Sverige|Sydkorea|Philadelphia", "32|20 jun 06:00|D|Marocko|Peru|San Francisco",
  "33|20 jun 19:00|F|Nederländerna|Sverige|Houston", "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|Toronto",
  "35|21 jun 02:00|E|Kamerun|Norge|Kansas City", "36|21 jun 06:00|F|Australien|Uzbekistan|Monterrey",
  "37|21 jun 18:00|H|Argentina|Portugal|Atlanta", "38|21 jun 21:00|G|Belgien|Danmark|Los Angeles",
  "39|22 jun 00:00|H|Haiti|Senegal|Miami", "40|22 jun 03:00|G|Panama|Nigeria|Vancouver",
  "41|22 jun 19:00|J|Sydkorea|Sverige|Kansas City", "42|22 jun 23:00|I|Italien|Norge|Philadelphia",
  "43|23 jun 02:00|I|Ecuador|Tyskland|New York", "44|23 jun 05:00|J|Marocko|Brasilien|San Francisco",
  "45|23 jun 19:00|K|Slovakien|England|Houston", "46|23 jun 22:00|L|Japan|Frankrike|Boston",
  "47|24 jun 01:00|L|Nederländerna|Uzbekistan|Boston", "48|24 jun 04:00|K|Spanien|Peru|Guadalajara"
];

// --- LAGDATA & FÄRGER ---
const TEAMS = {
  'Mexiko': { flag: '🇲🇽', primary: '#006847', tier: 2 }, 'Ecuador': { flag: '🇪🇨', primary: '#FFD100', tier: 3 },
  'Kanada': { flag: '🇨🇦', primary: '#FF0000', tier: 2 }, 'Slovakien': { flag: '🇸🇰', primary: '#0B4EA2', tier: 3 },
  'Italien': { flag: '🇮🇹', primary: '#0066B2', tier: 1 }, 'Togo': { flag: '🇹🇬', primary: '#006A4E', tier: 3 },
  'USA': { flag: '🇺🇸', primary: '#B31942', tier: 2 }, 'Marocko': { flag: '🇲🇦', primary: '#C1272D', tier: 2 },
  'Spanien': { flag: '🇪🇸', primary: '#AA151B', tier: 1 }, 'Japan': { flag: '🇯🇵', primary: '#BC002D', tier: 2 },
  'Brasilien': { flag: '🇧🇷', primary: '#FFDF00', tier: 1 }, 'Sydkorea': { flag: '🇰🇷', primary: '#0047A0', tier: 3 },
  'Sverige': { flag: '🇸🇪', primary: '#006AA7', tier: 2 }, 'Jordanien': { flag: '🇯🇴', primary: '#CE1126', tier: 3 },
  'England': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#000040', tier: 1 }, 'Peru': { flag: '🇵🇪', primary: '#D91023', tier: 3 },
  'Tyskland': { flag: '🇩🇪', primary: '#000000', tier: 1 }, 'Norge': { flag: '🇳🇴', primary: '#EF2B2D', tier: 2 },
  'Frankrike': { flag: '🇫🇷', primary: '#002395', tier: 1 }, 'Uzbekistan': { flag: '🇺🇿', primary: '#0099B5', tier: 3 },
  'Uruguay': { flag: '🇺🇾', primary: '#0038A8', tier: 2 }, 'Kamerun': { flag: '🇨🇲', primary: '#007A5E', tier: 3 },
  'Nederländerna': { flag: '🇳🇱', primary: '#F36C21', tier: 1 }, 'Australien': { flag: '🇦🇺', primary: '#00008B', tier: 3 },
  'Argentina': { flag: '🇦🇷', primary: '#75AADB', tier: 1 }, 'Haiti': { flag: '🇭🇹', primary: '#00209F', tier: 3 },
  'Belgien': { flag: '🇧🇪', primary: '#000000', tier: 1 }, 'Panama': { flag: '🇵🇦', primary: '#005293', tier: 3 },
  'Portugal': { flag: '🇵🇹', primary: '#006600', tier: 1 }, 'Senegal': { flag: '🇸🇳', primary: '#00853F', tier: 2 },
  'Danmark': { flag: '🇩🇰', primary: '#C60C30', tier: 2 }, 'Nigeria': { flag: '🇳🇬', primary: '#008751', tier: 3 },
  'Sydafrika': { flag: '🇿🇦', primary: '#007C59', tier: 3 }, 'Tjeckien': { flag: '🇨🇿', primary: '#11457E', tier: 2 },
  'Bosnien': { flag: '🇧🇦', primary: '#002395', tier: 3 }, 'Paraguay': { flag: '🇵🇾', primary: '#D52B1E', tier: 3 },
  'Qatar': { flag: '🇶🇦', primary: '#8D1B3D', tier: 3 }, 'Schweiz': { flag: '🇨🇭', primary: '#D52B1E', tier: 2 },
  'Skottland': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', primary: '#004B84', tier: 3 }, 'Turkiet': { flag: '🇹🇷', primary: '#E30A17', tier: 2 },
  'Curaçao': { flag: '🇨🇼', primary: '#002B7F', tier: 3 }, 'Elfenbenskusten': { flag: '🇨🇮', primary: '#FF8200', tier: 2 },
  'Tunisien': { flag: '🇹🇳', primary: '#E70013', tier: 3 }, 'Kap Verde': { flag: '🇨🇻', primary: '#003893', tier: 3 },
  'Egypten': { flag: '🇪🇬', primary: '#C09307', tier: 2 }, 'Saudiarabien': { flag: '🇸🇦', primary: '#006C35', tier: 3 },
  'Iran': { flag: '🇮🇷', primary: '#239f40', tier: 3 }, 'Nya Zeeland': { flag: '🇳🇿', primary: '#000000', tier: 3 },
  'Irak': { flag: '🇮🇶', primary: '#007A33', tier: 3 }, 'Algeriet': { flag: '🇩🇿', primary: '#006233', tier: 3 },
  'Österrike': { flag: '🇦🇹', primary: '#EF3340', tier: 2 }, 'DR Kongo': { flag: '🇨🇩', primary: '#007FFF', tier: 3 },
  'Colombia': { flag: '🇨🇴', primary: '#FCD116', tier: 2 }, 'Kroatien': { flag: '🇭🇷', primary: '#FF0000', tier: 1 },
  'Ghana': { flag: '🇬🇭', primary: '#FCD116', tier: 3 }
};

const initialMatchesList = VM_SCHEDULE.map(m => {
  const [id, date, group, team1, team2, venue] = m.split('|');
  let status = 'upcoming', goals1 = null, goals2 = null, minute = null;
  if (id === '1') { status = 'finished'; goals1 = 2; goals2 = 0; minute = 'FT'; }
  if (id === '2') { status = 'finished'; goals1 = 1; goals2 = 1; minute = 'FT'; }
  if (id === '3') { status = 'live'; goals1 = 1; goals2 = 0; minute = '67\''; }
  return { id: parseInt(id), date, group, team1, team2, venue, goals1, goals2, status, minute };
});

const ALL_GROUPS_LIST = ['Alla', 'Säljarna', 'Projektledare', 'Ledningen', 'Dalabyggsam', 'Gubbarna'];
const TOURNAMENT_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const mockPreds = (bias) => {
  const p = {};
  for(let i=1; i<=48; i++) {
    const r = Math.random();
    if(bias === '1') p[i] = r > 0.2 ? '1' : r > 0.1 ? 'X' : '2';
    else if(bias === 'X') p[i] = r > 0.4 ? 'X' : r > 0.2 ? '1' : '2';
    else p[i] = r > 0.3 ? '2' : r > 0.15 ? '1' : 'X';
  }
  return p;
};

// --- LOGO KOMPONENT ---
const Logo = () => (
  <div className="flex items-center justify-center gap-3">
    <div className="relative">
      <Trophy className="w-10 h-10 text-vmgold relative z-10" />
      <div className="absolute inset-0 bg-vmgold blur-lg opacity-60"></div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-3xl italic leading-none tracking-tighter text-white">VM-TIPSET</span>
      <span className="font-bold text-[10px] tracking-[0.3em] text-indigo-400 leading-none mt-1 uppercase">2026 Kompisligan</span>
    </div>
  </div>
);

// --- AUTOSAVE HELPER ---
const loadDraft = () => {
  try { return JSON.parse(localStorage.getItem('vmtipset_draft')) || {}; } 
  catch { return {}; }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // --- REGISTRATION STATE (Med Autospar) ---
  const draft = loadDraft();
  const [regStep, setRegStep] = useState(draft.regStep || 1);
  const [regName, setRegName] = useState(draft.regName || '');
  const [regEmail, setRegEmail] = useState(draft.regEmail || '');
  const [regGoals, setRegGoals] = useState(draft.regGoals || '');
  const [regPicks, setRegPicks] = useState(draft.regPicks || {});

  useEffect(() => {
    if (regName || regEmail || Object.keys(regPicks).length > 0) {
      localStorage.setItem('vmtipset_draft', JSON.stringify({ regStep, regName, regEmail, regGoals, regPicks }));
    }
  }, [regStep, regName, regEmail, regGoals, regPicks]);

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [matches, setMatches] = useState(initialMatchesList);
  const [tips, setTips] = useState([
    { id: 'admin', name: 'Emil Zettergren', email: 'zettergren.emil@gmail.com', password: 'TELE1fon', groups: ['Ledningen'], goals: 132, predictions: {}, isApproved: true, isAdmin: true },
    { id: 1, name: 'Adam Johansson', email: 'adam@test.se', groups: ['Säljarna', 'Dalabyggsam'], goals: 110, isApproved: true, isAdmin: false, predictions: mockPreds('1') },
    { id: 2, name: 'Anders Björk', email: 'anders@test.se', groups: ['Projektledare', 'Gubbarna'], goals: 125, isApproved: true, isAdmin: false, predictions: mockPreds('X') },
  ]);

  const [chatMessages, setChatMessages] = useState([{ id: 1, user: 'Emil Zettergren', text: 'Välkomna till VM 2026! Tagga polare med @Namn', time: '12:00' }]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const [notifications, setNotifications] = useState([{ id: 0, text: 'VM 2026 rullar! Lycka till.', time: 'Nu', unread: true, action: null }]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('Alla');
  const [isPrizeExpanded, setIsPrizeExpanded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [h2hUser1, setH2hUser1] = useState(1);
  const [h2hUser2, setH2hUser2] = useState(2);

  const previousLeaderRef = useRef(null);

  // --- DERIVED LOGIC ---
  const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };
  const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
  const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);

  const groupStandings = useMemo(() => {
    const stats = {};
    Object.keys(TEAMS).forEach(name => { stats[name] = { name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0, group: "" }; });
    matches.forEach(m => {
      if (stats[m.team1]) stats[m.team1].group = m.group;
      if (stats[m.team2]) stats[m.team2].group = m.group;
      if (m.status === 'finished' || m.status === 'live') {
        const g1 = m.goals1 || 0; const g2 = m.goals2 || 0;
        stats[m.team1].played++; stats[m.team2].played++;
        stats[m.team1].gf += g1; stats[m.team1].ga += g2;
        stats[m.team2].gf += g2; stats[m.team2].ga += g1;
        if (g1 > g2) { stats[m.team1].win++; stats[m.team1].pts += 3; stats[m.team2].loss++; }
        else if (g1 < g2) { stats[m.team2].win++; stats[m.team2].pts += 3; stats[m.team1].loss++; }
        else { stats[m.team1].draw++; stats[m.team2].draw++; stats[m.team1].pts += 1; stats[m.team2].pts += 1; }
        stats[m.team1].gd = stats[m.team1].gf - stats[m.team1].ga;
        stats[m.team2].gd = stats[m.team2].gf - stats[m.team2].ga;
      }
    });
    return stats;
  }, [matches]);

  const matchStats = useMemo(() => {
    return matches.map(m => {
      const picks = { '1': 0, 'X': 0, '2': 0 };
      activePlayers.forEach(u => { if (u.predictions[m.id]) picks[u.predictions[m.id]]++; });
      const total = activePlayers.length || 1;
      const pct = { '1': Math.round((picks['1'] / total) * 100), 'X': Math.round((picks['X'] / total) * 100), '2': Math.round((picks['2'] / total) * 100) };
      const fav = Object.keys(pct).reduce((a, b) => pct[a] > pct[b] ? a : b);
      const res = get1X2(m.goals1, m.goals2);
      
      let comm = "";
      if (res) {
        const okPct = pct[res];
        if (okPct < 25) comm = `🔥 SKRÄLL! Endast ${okPct}% fick in poängen.`;
        else if (okPct > 65) comm = `✅ Väntat utfall. Hela ${okPct}% inkasserar poäng.`;
        else comm = `${okPct}% av oss hade rätt tecken.`;
      } else {
        comm = pct[fav] > 60 ? `📈 Favorit: ${fav} (${pct[fav]}%)` : "🎲 Ovisst läge i tipset.";
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

  const addNotification = (text, actionTab = null) => setNotifications(prev => [{ id: Date.now(), text, time: 'Nu', unread: true, action: actionTab }, ...prev]);

  // --- ACTIONS ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!user) return setAuthError("E-postadressen hittades inte i systemet.");
    if (user.isAdmin) {
      if (loginPassword !== user.password) return setAuthError("Fel lösenord.");
    } else if (!user.isApproved) {
      return setAuthError("Din anmälan väntar på godkännande (Betalning saknas).");
    }
    setAuthError(''); setCurrentUser(user); if(user.isAdmin) setActiveTab('admin');
  };

  const submitRegistration = () => {
    alert(`Tack ${regName}! Din rad är mottagen. Swisha 100kr till Emil för att bli godkänd.`);
    localStorage.removeItem('vmtipset_draft');
    setShowRegister(false); setRegStep(1); setRegName(''); setRegEmail(''); setRegGoals(''); setRegPicks({});
  };

  const clearDraft = () => {
    if(window.confirm('Är du säker på att du vill rensa utkastet?')) {
      localStorage.removeItem('vmtipset_draft');
      setRegStep(1); setRegName(''); setRegEmail(''); setRegGoals(''); setRegPicks({});
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!newChatMsg.trim()) return;
    activePlayers.forEach(p => {
       const name = p.name.split(' ')[0];
       if (newChatMsg.includes(`@${name}`)) addNotification(`💬 ${currentUser.name} nämnde dig i Snackis!`, 'chat');
    });
    setChatMessages(prev => [...prev, { id: Date.now(), user: currentUser.name, text: newChatMsg, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }]);
    setNewChatMsg('');
  };

  // --- UI: INNAN INLOGGNING (Med Autospar & Färgad Sedel) ---
  if (!currentUser) return (
    <div className="min-h-screen bg-vmdark text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
        
        <div className="mb-10"><Logo /></div>

        {!showRegister ? (
          <>
            <div className="flex bg-black/40 rounded-xl p-1.5 mb-8 border border-white/10 shadow-inner">
              <button className="flex-1 py-3 text-sm font-bold rounded-lg bg-indigo-600 text-white shadow-md">Logga in</button>
              <button onClick={() => setShowRegister(true)} className="flex-1 py-3 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition-all relative">
                Lämna Tips
                {Object.keys(regPicks).length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Din godkända e-post" className="w-full py-4 pl-14 pr-4 rounded-2xl bg-black/50 border border-white/10 outline-none focus:border-vmgold focus:bg-black/70 transition-all font-bold placeholder:text-slate-500" required />
              </div>
              
              {loginEmail.toLowerCase().trim() === 'zettergren.emil@gmail.com' && (
                <div className="relative animate-in fade-in slide-in-from-top-2">
                   <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full py-4 pl-14 pr-4 rounded-2xl bg-black/50 border border-vmgold/50 outline-none focus:border-vmgold focus:bg-black/70 transition-all font-bold placeholder:text-slate-500" placeholder="Admin Lösenord" required />
                </div>
              )}

              {authError && <div className="text-red-400 text-sm font-bold flex items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20"><AlertCircle size={16} className="mr-2 shrink-0"/>{authError}</div>}
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg transition-all">ÖPPNA TIPSET</button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {regStep === 1 ? (
              <form onSubmit={e => { e.preventDefault(); setRegStep(2); }} className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black">1. Dina Uppgifter</h2>
                   <button type="button" onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-white"><X/></button>
                </div>
                {Object.keys(regPicks).length > 0 && (
                   <div className="bg-blue-500/20 text-blue-200 p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 border border-blue-500/30">
                     <Clock size={16}/> Sparat utkast hittades ({Object.keys(regPicks).length}/48).
                   </div>
                )}
                <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} placeholder="För- och Efternamn" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-emerald-500 font-bold" required />
                <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="E-post (blir din inloggning)" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-emerald-500 font-bold" required />
                <input type="number" value={regGoals} onChange={e=>setRegGoals(e.target.value)} placeholder="Skiljefråga: Totalt antal mål i VM?" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-emerald-500 font-bold" required />
                
                <div className="pt-4 flex gap-3">
                  {Object.keys(regPicks).length > 0 && <button type="button" onClick={clearDraft} className="px-4 bg-red-500/20 text-red-400 font-bold rounded-2xl hover:bg-red-500/30"><Trash2 size={20}/></button>}
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all">NÄSTA: TIPPA MATCHER</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setRegStep(1)} className="text-slate-400 hover:text-white text-sm font-bold">← Tillbaka</button>
                  <span className="text-vmgold font-black text-sm">{Object.keys(regPicks).length} / 48 tippade</span>
                </div>
                <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-2 no-scrollbar">
                  {matches.map(m => (
                    <div key={m.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="text-xs text-white font-black flex items-center justify-between">
                         <span className="truncate">{TEAMS[m.team1]?.flag} {m.team1}</span>
                         <span className="text-slate-500 text-[10px]">VS</span>
                         <span className="truncate text-right">{m.team2} {TEAMS[m.team2]?.flag}</span>
                      </div>
                      <div className="flex gap-2">
                        {['1', 'X', '2'].map(sign => {
                          let activeClass = 'bg-white/5 text-white hover:bg-white/10';
                          if (regPicks[m.id] === sign) {
                            if (sign === '1') activeClass = 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105';
                            if (sign === 'X') activeClass = 'bg-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)] scale-105';
                            if (sign === '2') activeClass = 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105';
                          }
                          return (
                            <button key={sign} type="button" onClick={() => setRegPicks(prev => ({...prev, [m.id]: sign}))} className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${activeClass}`}>
                              {sign}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={submitRegistration} disabled={Object.keys(regPicks).length < 48} className="w-full py-4 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg mt-2 transition-all">
                  SKICKA IN ANMÄLAN
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // --- INLOGGAD VY ---
  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors relative min-w-[65px] ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`}>
      <Icon size={22} />
      <span className="text-[9px] font-bold uppercase">{label}</span>
      {activeTab === id && <div className="absolute top-0 sm:bottom-0 sm:top-auto w-1/2 h-1 bg-indigo-600 rounded-b-full" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Profil Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-[60] bg-vmdark/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUserId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-vmdark p-6 text-white flex justify-between items-start">
              <div><h3 className="text-2xl font-black">{activePlayers.find(u => u.id === selectedUserId)?.name}</h3></div>
              <button onClick={() => setSelectedUserId(null)} className="p-2 bg-white/10 rounded-full"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {matches.map(m => {
                const pick = activePlayers.find(u => u.id === selectedUserId)?.predictions[m.id];
                const res = get1X2(m.goals1, m.goals2);
                return (
                  <div key={m.id} className="p-3 bg-white rounded-xl border flex justify-between items-center text-sm font-bold">
                    <span>{TEAMS[m.team1]?.flag} {m.team1} - {m.team2} {TEAMS[m.team2]?.flag}</span>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg ${res ? (pick === res ? 'bg-green-500 text-white' : 'bg-red-400 text-white') : 'bg-slate-100'}`}>{pick || '-'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <header className="bg-vmdark text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 scale-75 origin-left"><Logo /></div>
        <div className="relative flex items-center gap-3">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-white/10 rounded-full relative"><Bell size={20}/>{notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-vmdark" />}</button>
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl text-slate-800 border z-50 overflow-hidden">
               <div className="bg-slate-100 p-4 font-black flex justify-between">Händelser <button onClick={()=>setShowNotifications(false)}><X size={16}/></button></div>
               {notifications.map(n => <div key={n.id} onClick={() => { if(n.action) setActiveTab(n.action); setShowNotifications(false); }} className="p-4 border-b hover:bg-slate-50 cursor-pointer text-sm font-medium">{n.text}</div>)}
            </div>
          )}
          <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex justify-around p-1 sm:sticky sm:top-[72px] sm:max-w-5xl sm:mx-auto sm:my-4 sm:rounded-3xl sm:border sm:shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <NavItem id="leaderboard" icon={Trophy} label="Ställning" />
        <NavItem id="groups" icon={ListOrdered} label="Grupper" />
        <NavItem id="h2h" icon={Swords} label="H2H" />
        <NavItem id="chat" icon={MessageSquare} label="Snackis" />
        <NavItem id="matches" icon={CalendarDays} label="Matcher" />
        {currentUser.isAdmin && <NavItem id="admin" icon={Settings} label="Admin" />}
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        
        {/* Prispott */}
        <div className="bg-vmdark rounded-3xl p-5 text-white border border-slate-800 shadow-xl">
          <button onClick={() => setIsPrizeExpanded(!isPrizeExpanded)} className="w-full flex justify-between items-center outline-none">
            <div className="flex items-center gap-4"><Banknote className="text-emerald-400" size={28} /><div><span className="text-[10px] font-bold text-slate-400 uppercase block">Total Pott</span><span className="font-black text-xl">{prizePool.total} kr</span></div></div>
            <div className="bg-indigo-900/40 px-3 py-1.5 rounded-2xl flex items-center gap-2"><Goal size={16} className="text-blue-400"/><span className="font-black text-sm">{goalsSoFar} mål</span></div>
            {isPrizeExpanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {ALL_GROUPS_LIST.map(g => (
                <button key={g} onClick={() => setSelectedGroupFilter(g)} className={`px-5 py-2 rounded-full text-xs font-black border transition-all ${selectedGroupFilter === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>{g}</button>
              ))}
            </div>
            
            <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                 <thead><tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b"><th className="p-4 text-center">Pos</th><th className="p-4">Tippare</th><th className="p-4 text-center">Poäng</th></tr></thead>
                 <tbody>
                   {leaderboard.filter(u => selectedGroupFilter === 'Alla' || u.groups.includes(selectedGroupFilter)).map(u => (
                     <tr key={u.id} className="hover:bg-indigo-50/50 transition-all cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                        <td className="p-4 text-center font-black text-slate-400">#{u.rank}</td>
                        <td className="p-4"><div className="font-black text-slate-800">{u.name}</div><div className="text-[10px] font-bold uppercase text-slate-400">{u.groups.join(', ')} | Mål: {u.goals}</div></td>
                        <td className="p-4 text-center bg-indigo-50/30 font-black text-2xl text-indigo-700">{u.pts}{u.virtualPts > 0 && <span className="text-xs text-emerald-500 ml-1">+{u.virtualPts}</span>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            {/* STOR MATRIS */}
            <div className="pt-6">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2 uppercase tracking-tighter text-slate-800"><Grid3X3 className="text-indigo-600"/> Tippningsmatris</h3>
              <div className="bg-white rounded-3xl border overflow-hidden shadow-sm overflow-x-auto">
                 <table className="w-full text-sm border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b font-black text-xs uppercase text-slate-500">
                        <th className="p-4 sticky left-0 bg-slate-50 z-10 border-r w-48">Match</th>
                        <th className="p-4 text-center border-r text-indigo-600 w-16">Res</th>
                        {activePlayers.map(u => <th key={u.id} className="p-4 text-center">{u.name.split(' ')[0]}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matches.slice(0, 20).map(m => {
                        const r = get1X2(m.goals1, m.goals2);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 font-bold">
                            <td className="p-4 sticky left-0 bg-white z-10 border-r flex items-center gap-2">
                              {m.status==='live' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
                              <span>{TEAMS[m.team1]?.flag} {m.team1.slice(0,3).toUpperCase()}</span>
                              <span className="text-slate-300 text-[10px]">VS</span>
                              <span>{TEAMS[m.team2]?.flag} {m.team2.slice(0,3).toUpperCase()}</span>
                            </td>
                            <td className="p-4 text-center border-r font-black text-indigo-700 bg-indigo-50/20">{r || '-'}</td>
                            {activePlayers.map(u => {
                               const p = u.predictions[m.id];
                               const isFinOK = m.status === 'finished' && p === r;
                               const isLiveOK = m.status === 'live' && p === r;
                               const isFinNOK = m.status === 'finished' && p !== r;
                               return (
                                 <td key={u.id} className="p-4 text-center">
                                   <span className={`inline-flex w-8 h-8 items-center justify-center rounded-xl font-black ${isFinOK ? 'bg-green-100 text-green-700' : isLiveOK ? 'bg-emerald-500 text-white animate-pulse' : isFinNOK ? 'bg-red-50 text-red-300' : 'bg-slate-100 text-slate-400'}`}>
                                     {p || '-'}
                                   </span>
                                 </td>
                               );
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}

        {/* --- GRUPPER --- */}
        {activeTab === 'groups' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {TOURNAMENT_GROUPS.map(grp => (
               <div key={grp} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                  <div className="bg-vmdark p-4 text-vmgold font-black text-center tracking-widest">GRUPP {grp}</div>
                  <table className="w-full text-xs text-left">
                     <thead><tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase"><th className="p-3">Lag</th><th className="p-3 text-center">S</th><th className="p-3 text-center">+/-</th><th className="p-3 text-center">P</th></tr></thead>
                     <tbody className="divide-y divide-slate-100">
                        {Object.values(groupStandings).filter(t => t.group === grp)
                          .sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
                          .map((t, idx) => (
                          <tr key={t.name} className={idx < 2 ? "bg-emerald-50/20" : ""}>
                             <td className="p-3 font-bold flex items-center gap-2 text-sm"><span>{TEAMS[t.name]?.flag}</span> <span className="truncate">{t.name}</span></td>
                             <td className="p-3 text-center text-slate-500">{t.played}</td>
                             <td className="p-3 text-center font-bold text-slate-500">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                             <td className="p-3 text-center font-black bg-slate-50/50 text-sm">{t.pts}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-[2rem] border shadow-xl flex flex-col h-[70vh]">
             <div className="bg-indigo-600 p-5 text-white flex items-center gap-3"><MessageSquare size={24}/><h2 className="text-xl font-black uppercase italic">Snackis Live</h2></div>
             <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 flex flex-col">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-black text-slate-400 mb-1 px-2">{m.user}</span>
                    <div className={`px-5 py-3 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm ${m.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>
                      {m.text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="text-vmgold">{part}</span> : part)}
                    </div>
                  </div>
                ))}
             </div>
             <form onSubmit={sendChat} className="p-4 bg-white border-t flex gap-3"><input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Skriv @Namn för att tagga..." className="flex-1 bg-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 font-bold" /><button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-md hover:bg-indigo-700"><Send/></button></form>
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="space-y-6">
            <div className="bg-vmdark p-8 rounded-[2rem] text-white flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="flex-1 w-full text-center"><select className="bg-slate-800 w-full p-4 rounded-2xl border border-slate-700 outline-none font-black text-xl text-indigo-400" value={h2hUser1} onChange={e => setH2hUser1(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="text-4xl font-black mt-4">{leaderboard.find(u => u.id === h2hUser1)?.pts} p</div></div>
              <div className="bg-vmgold text-vmdark font-black px-6 py-3 rounded-2xl transform -skew-x-12 text-2xl">VS</div>
              <div className="flex-1 w-full text-center"><select className="bg-slate-800 w-full p-4 rounded-2xl border border-slate-700 outline-none font-black text-xl text-rose-400" value={h2hUser2} onChange={e => setH2hUser2(parseInt(e.target.value))}>{activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="text-4xl font-black mt-4">{leaderboard.find(u => u.id === h2hUser2)?.pts} p</div></div>
            </div>
            <div className="space-y-3">
              {h2hMatches.slice(0, 20).map(m => (
                <div key={m.id} className={`bg-white rounded-3xl p-4 flex items-center justify-between border-2 relative overflow-hidden ${m.state === 'disagreed' ? 'border-vmgold shadow-md' : 'border-slate-100'}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 opacity-50" style={{backgroundColor: TEAMS[m.team1]?.primary}} />
                  <div className="absolute right-0 top-0 bottom-0 w-2 opacity-50" style={{backgroundColor: TEAMS[m.team2]?.primary}} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${m.state.includes('u1_win') || m.state==='both_win' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{m.u1Pick || '-'}</div>
                  <div className="text-center flex-1 px-4"><div className="font-black text-sm">{m.team1} - {m.team2}</div>{m.res && <span className="block text-[10px] uppercase text-indigo-600 font-black mt-1">Slut: {m.res}</span>}</div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${m.state.includes('u2_win') || m.state==='both_win' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{m.u2Pick || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="grid gap-6 sm:grid-cols-2">
            {matches.map(m => (
              <div key={m.id} className="bg-white rounded-[2rem] border p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 flex"><div className="flex-1" style={{backgroundColor:TEAMS[m.team1]?.primary}}/><div className="flex-1" style={{backgroundColor:TEAMS[m.team2]?.primary}}/></div>
                <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.date} | Grp {m.group}</span>{m.status==='live' ? <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1"><PlayCircle size={14}/> LIVE {m.minute}</span> : m.status==='finished' ? <span className="bg-vmdark text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Slut</span> : <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase">Kommande</span>}</div>
                <div className="flex justify-between items-center text-center"><div className="flex-1"><span className="text-5xl block mb-2">{TEAMS[m.team1]?.flag}</span><span className="font-black text-sm uppercase">{m.team1}</span></div><div className="px-4">{m.status !== 'upcoming' ? <div className="text-3xl font-black bg-slate-100 px-5 py-2 rounded-2xl border-2">{m.goals1}-{m.goals2}</div> : <div className="text-xl font-black text-slate-200 italic uppercase">VS</div>}</div><div className="flex-1"><span className="text-5xl block mb-2">{TEAMS[m.team2]?.flag}</span><span className="font-black text-sm uppercase">{m.team2}</span></div></div>
                <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest flex items-center justify-center gap-1"><MapPin size={12}/> {m.venue}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black px-2 flex items-center gap-2"><BarChart3 className="text-indigo-600"/> Matchanalys</h2>
            <div className="grid gap-6">
              {matchStats.slice(0, 15).map(m => (
                <div key={m.id} className="bg-white p-6 rounded-3xl border relative overflow-hidden shadow-sm">
                  <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundImage: `linear-gradient(to bottom, ${TEAMS[m.team1]?.primary}, ${TEAMS[m.team2]?.primary})` }} />
                  <div className="flex flex-col sm:flex-row justify-between mb-6 pl-2 font-black text-lg gap-4">
                    <div className="flex items-center gap-2"><span>{TEAMS[m.team1]?.flag} {m.team1} - {m.team2} {TEAMS[m.team2]?.flag}</span></div>
                    {m.goals1 !== null && <div className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Check size={14}/> Rätt: {get1X2(m.goals1, m.goals2)}</div>}
                  </div>
                  <div className="flex h-10 rounded-xl overflow-hidden bg-slate-100 ml-2 mb-6 shadow-inner">
                    <div style={{width: `${m.pct['1']}%`, backgroundColor: TEAMS[m.team1]?.primary}} className="flex items-center justify-center text-white text-[10px] font-black shadow-lg">1 ({m.pct['1']}%)</div>
                    <div style={{width: `${m.pct['X']}%`, backgroundColor: '#cbd5e1'}} className="flex items-center justify-center text-slate-700 text-[10px] font-black border-x-2 border-white/20">X ({m.pct['X']}%)</div>
                    <div style={{width: `${m.pct['2']}%`, backgroundColor: TEAMS[m.team2]?.primary}} className="flex items-center justify-center text-white text-[10px] font-black shadow-lg">2 ({m.pct['2']}%)</div>
                  </div>
                  <div className="ml-2 bg-indigo-50/50 p-4 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed flex gap-3"><AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />{m.comm}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-xl font-black mb-8 flex items-center gap-3 text-emerald-600"><ShieldCheck size={28}/> Godkänn Betalningar</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {tips.filter(t => !t.isAdmin).map(t => (
                  <div key={t.id} className={`flex justify-between items-center p-4 rounded-xl border ${t.isApproved ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 opacity-60'}`}>
                    <div><div className="font-black text-sm">{t.name}</div><div className="text-[10px] text-slate-400">{t.email}</div><div className="text-[9px] font-black text-indigo-500 uppercase mt-1">{t.groups.join(', ')}</div></div>
                    <button onClick={() => { const n = [...tips]; n.find(x=>x.id===t.id).isApproved = !t.isApproved; setTips(n); }} className={`px-4 py-2 rounded-xl text-[10px] font-black border ${t.isApproved ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}>{t.isApproved ? 'GODKÄND' : 'GODKÄNN'}</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border p-6 shadow-lg"><h2 className="text-xl font-black mb-6 uppercase tracking-tighter italic">Matchrapportering (Live)</h2>
              <div className="space-y-4">
                {matches.slice(0, 15).map(m => (
                  <div key={m.id} className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-center gap-4 ${m.status==='live' ? 'bg-red-50 border-red-200 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="font-black text-sm flex items-center gap-2">{TEAMS[m.team1]?.flag} {m.team1} - {m.team2} {TEAMS[m.team2]?.flag}</div>
                    <div className="flex gap-2">
                       <button onClick={() => { const n = [...matches]; const match = n.find(x=>x.id===m.id); match.status = 'live'; match.goals1=match.goals1||0; match.goals2=match.goals2||0; match.minute="1'"; setMatches(n); }} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black">STARTA LIVE</button>
                       <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-inner"><input type="number" value={m.goals1 ?? ''} onChange={e => { const n = [...matches]; n.find(x=>x.id===m.id).goals1 = parseInt(e.target.value); setMatches(n); }} className="w-10 text-center font-black outline-none text-lg"/><span className="text-slate-300">-</span><input type="number" value={m.goals2 ?? ''} onChange={e => { const n = [...matches]; n.find(x=>x.id===m.id).goals2 = parseInt(e.target.value); setMatches(n); }} className="w-10 text-center font-black outline-none text-lg"/></div>
                       <button onClick={() => { const n = [...matches]; n.find(x=>x.id===m.id).status = 'finished'; n.find(x=>x.id===m.id).minute = 'FT'; setMatches(n); }} className="px-3 py-1 bg-vmdark text-white rounded-lg text-[10px] font-black">AVSLUTA</button>
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
