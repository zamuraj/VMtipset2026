import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { 
  Trophy, BarChart3, Settings, CalendarDays, Check, 
  AlertCircle, Clock, Grid3X3, User, X, Lock, 
  Swords, Bell, PlayCircle, Banknote, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin, ListOrdered, Trash2
} from 'lucide-react';

// --- DATA: LAG & SCHEMA ---
const TEAMS = { 
  'Mexiko': { flag: 'mx', primary: '#006847' }, 
  'Ecuador': { flag: 'ec', primary: '#FFD100' }, 
  'Kanada': { flag: 'ca', primary: '#FF0000' }, 
  'Slovakien': { flag: 'sk', primary: '#0B4EA2' }, 
  'Italien': { flag: 'it', primary: '#0093D0' }, 
  'Togo': { flag: 'tg', primary: '#006A4E' }, 
  'USA': { flag: 'us', primary: '#FFFFFF' }, 
  'Marocko': { flag: 'ma', primary: '#C1272D' }, 
  'Spanien': { flag: 'es', primary: '#E30A17' }, 
  'Japan': { flag: 'jp', primary: '#BC002D' }, 
  'Brasilien': { flag: 'br', primary: '#FFCD00' }, 
  'Sydkorea': { flag: 'kr', primary: '#0047A0' }, 
  'Sverige': { flag: 'se', primary: '#FFCD00' }, 
  'Jordanien': { flag: 'jo', primary: '#CE1126' }, 
  'England': { flag: 'gb-eng', primary: '#FFFFFF' }, 
  'Peru': { flag: 'pe', primary: '#D91023' }, 
  'Tyskland': { flag: 'de', primary: '#FFFFFF' }, 
  'Norge': { flag: 'no', primary: '#EF2B2D' }, 
  'Frankrike': { flag: 'fr', primary: '#002395' }, 
  'Uzbekistan': { flag: 'uz', primary: '#0099B5' }, 
  'Uruguay': { flag: 'uy', primary: '#0038A8' }, 
  'Kamerun': { flag: 'cm', primary: '#007A5E' }, 
  'Nederländerna': { flag: 'nl', primary: '#F36C21' }, 
  'Australien': { flag: 'au', primary: '#00008B' }, 
  'Argentina': { flag: 'ar', primary: '#75AADB' }, 
  'Haiti': { flag: 'ht', primary: '#00209F' }, 
  'Belgien': { flag: 'be', primary: '#E30A17' }, 
  'Panama': { flag: 'pa', primary: '#005293' }, 
  'Portugal': { flag: 'pt', primary: '#006600' }, 
  'Senegal': { flag: 'sn', primary: '#00853F' }, 
  'Danmark': { flag: 'dk', primary: '#C60C30' }, 
  'Nigeria': { flag: 'ng', primary: '#008751' }, 
  'Sydafrika': { flag: 'za', primary: '#007C59' }, 
  'Tjeckien': { flag: 'cz', primary: '#11457E' }, 
  'Bosnien': { flag: 'ba', primary: '#002395' }, 
  'Paraguay': { flag: 'py', primary: '#D52B1E' }, 
  'Qatar': { flag: 'qa', primary: '#8D1B3D' }, 
  'Schweiz': { flag: 'ch', primary: '#D52B1E' }, 
  'Skottland': { flag: 'gb-sct', primary: '#004B84' }, 
  'Turkiet': { flag: 'tr', primary: '#E30A17' }, 
  'Curaçao': { flag: 'cw', primary: '#002B7F' }, 
  'Elfenbenskusten': { flag: 'ci', primary: '#FF8200' }, 
  'Tunisien': { flag: 'tn', primary: '#E70013' }, 
  'Kap Verde': { flag: 'cv', primary: '#003893' }, 
  'Egypten': { flag: 'eg', primary: '#C09307' }, 
  'Saudiarabien': { flag: 'sa', primary: '#006C35' }, 
  'Iran': { flag: 'ir', primary: '#239f40' }, 
  'Nya Zeeland': { flag: 'nz', primary: '#000000' }, 
  'Irak': { flag: 'iq', primary: '#007A33' }, 
  'Algeriet': { flag: 'dz', primary: '#006233' }, 
  'Österrike': { flag: 'at', primary: '#EF3340' }, 
  'DR Kongo': { flag: 'cd', primary: '#007FFF' }, 
  'Colombia': { flag: 'co', primary: '#FCD116' }, 
  'Kroatien': { flag: 'hr', primary: '#FF0000' }, 
  'Ghana': { flag: 'gh', primary: '#FCD116' } 
};

const VM_SCHEDULE = [ "1|11 jun 21:00|A|Mexiko|Sydafrika|Mexico City", "2|12 jun 00:00|B|Kanada|Slovakien|Toronto", "3|12 jun 15:00|A|Sydkorea|Tjeckien|Guadalajara", "4|13 jun 00:00|D|USA|Paraguay|Los Angeles", "5|13 jun 21:00|B|Qatar|Schweiz|San Francisco", "6|14 jun 00:00|C|Brasilien|Marocko|New Jersey", "7|14 jun 03:00|C|Haiti|Skottland|Boston", "8|14 jun 06:00|D|Australien|Turkiet|Vancouver", "9|14 jun 19:00|E|Tyskland|Curaçao|Houston", "10|14 jun 22:00|F|Nederländerna|Japan|Dallas", "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Philadelphia", "12|15 jun 04:00|F|Sverige|Tunisien|Monterrey", "13|15 jun 18:00|H|Spanien|Kap Verde|Atlanta", "14|15 jun 21:00|G|Belgien|Egypten|Seattle", "15|16 jun 00:00|H|Saudiarabien|Uruguay|Miami", "16|16 jun 03:00|G|Iran|Nya Zeeland|SoFi Stadium", "17|16 jun 21:00|I|Frankrike|Senegal|MetLife Stadium", "18|17 jun 00:00|I|Irak|Norge|Gillette Stadium", "19|17 jun 03:00|J|Argentina|Algeriet|Kansas City", "20|17 jun 06:00|J|Österrike|Jordanien|Levi's Stadium", "21|17 jun 19:00|K|Portugal|DR Kongo|NRG Stadium", "22|17 jun 22:00|L|England|Kroatien|AT&T Stadium", "23|18 jun 01:00|L|Ghana|Panama|BMO Field", "24|18 jun 04:00|K|Uzbekistan|Colombia|Mexico City", "25|18 jun 18:00|A|Tjeckien|Sydafrika|Atlanta", "26|18 jun 21:00|B|Schweiz|Bosnien|San Francisco", "27|19 jun 00:00|B|Kanada|Qatar|BC Place", "28|19 jun 03:00|A|Mexiko|Sydkorea|Akron Stadium", "29|19 jun 21:00|D|USA|Australien|Lumen Field", "30|20 jun 00:00|C|Skottland|Marocko|Gillette Stadium", "31|20 jun 03:00|C|Brasilien|Haiti|Lincoln Financial", "32|20 jun 06:00|D|Turkiet|Paraguay|Levi's Stadium", "33|20 jun 19:00|F|Nederländerna|Sverige|NRG Stadium", "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|BMO Field", "35|21 jun 02:00|E|Ecuador|Curaçao|Arrowhead Stadium", "36|21 jun 06:00|F|Tunisien|Japan|BBVA Bancomer", "37|21 jun 18:00|H|Spanien|Saudiarabien|Atlanta", "38|21 jun 21:00|G|Belgien|Iran|SoFi Stadium", "39|22 jun 00:00|H|Uruguay|Kap Verde|Hard Rock Stadium", "40|22 jun 03:00|G|Nya Zeeland|Egypten|BC Place", "41|22 jun 19:00|J|Argentina|Österrike|Arrowhead Stadium", "42|22 jun 23:00|I|Frankrike|Irak|Lincoln Financial", "43|23 jun 02:00|I|Norge|Senegal|MetLife Stadium", "44|23 jun 05:00|J|Jordanien|Algeriet|Levi's Stadium", "45|23 jun 19:00|K|Portugal|Uzbekistan|NRG Stadium", "46|23 jun 22:00|L|England|Ghana|Gillette Stadium", "47|24 jun 01:00|L|Panama|Kroatien|Gillette Stadium", "48|24 jun 04:00|K|Colombia|DR Kongo|Akron Stadium" ];

const initialMatchesList = VM_SCHEDULE.map(m => {
  const [id, date, grp, t1, t2, ven] = m.split('|');
  return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, venue: ven };
});

const TOURNAMENT_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// --- UI UTILS ---
const Flag = ({ code, className = "w-5 h-4 rounded-sm object-cover shadow-sm" }) => (
  <img 
    src={`https://flagcdn.com/w40/${code?.toLowerCase()}.png`} 
    alt={code}
    className={className}
    onError={(e) => { e.target.src = 'https://flagcdn.com/w40/un.png'; }}
  />
);

const Logo = () => (
  <div className="flex items-center justify-center gap-3">
    <div className="relative"><Trophy className="w-10 h-10 text-vmgold relative z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" /><div className="absolute inset-0 bg-vmgold blur-xl opacity-40" /></div>
    <div className="flex flex-col"><span className="font-black text-3xl italic leading-none tracking-tighter text-white">VM-TIPSET</span><span className="font-bold text-[10px] tracking-[0.3em] text-indigo-400 leading-none mt-1 uppercase">2026 Kompisligan</span></div>
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');

  // --- FIREBASE DATA ---
  const [tips, setTips] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMsg, setNewChatMsg] = useState('');

  // --- REGISTRATION DRAFT ---
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGoals, setRegGoals] = useState('');
  const [regPicks, setRegPicks] = useState({});

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsubTips = onSnapshot(collection(db, "tips"), (snap) => setTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const dbMatches = snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
      setMatches(VM_SCHEDULE.map(m => {
        const [id, date, grp, t1, t2, ven] = m.split('|');
        const dbM = dbMatches.find(x => x.id === parseInt(id));
        return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, venue: ven, goals1: dbM?.goals1 ?? null, goals2: dbM?.goals2 ?? null, status: dbM?.status ?? 'upcoming' };
      }));
    });
    const unsubChat = onSnapshot(query(collection(db, "chat"), orderBy("createdAt", "asc")), (snap) => setChatMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => { unsubTips(); unsubMatches(); unsubChat(); };
  }, []);

  // --- AUTOSAVE LOGIC ---
  useEffect(() => {
    const draft = JSON.parse(localStorage.getItem('vmt_draft_v3'));
    if(draft) { setRegName(draft.name || ''); setRegEmail(draft.email || ''); setRegGoals(draft.goals || ''); setRegPicks(draft.picks || {}); setRegStep(draft.step || 1); }
  }, []);
  useEffect(() => {
    localStorage.setItem('vmt_draft_v3', JSON.stringify({ name: regName, email: regEmail, goals: regGoals, picks: regPicks, step: regStep }));
  }, [regName, regEmail, regGoals, regPicks, regStep]);

  const clearDraft = () => { if(window.confirm('Rensa allt och börja om?')) { localStorage.removeItem('vmt_draft_v3'); window.location.reload(); } };

  // --- CALCULATIONS ---
  const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
  const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);
  const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };

  const groupStandings = useMemo(() => {
    const stats = {};
    Object.keys(TEAMS).forEach(name => { stats[name] = { name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0, group: "" }; });
    matches.forEach(m => {
      if (stats[m.team1]) stats[m.team1].group = m.group; if (stats[m.team2]) stats[m.team2].group = m.group;
      if (m.status === 'finished') {
        const g1 = m.goals1 || 0; const g2 = m.goals2 || 0;
        stats[m.team1].played++; stats[m.team2].played++;
        if (g1 > g2) { stats[m.team1].pts += 3; } else if (g1 < g2) { stats[m.team2].pts += 3; } else { stats[m.team1].pts += 1; stats[m.team2].pts += 1; }
        stats[m.team1].gd += (g1 - g2); stats[m.team2].gd += (g2 - g1);
      }
    });
    return stats;
  }, [matches]);

  const leaderboard = useMemo(() => {
    return activePlayers.map(u => {
      let pts = 0;
      matches.forEach(m => { if (get1X2(m.goals1, m.goals2) === u.predictions?.[m.id]) pts++; });
      return { ...u, pts, diff: Math.abs(u.goals - goalsSoFar) };
    }).sort((a, b) => b.pts - a.pts || a.diff - b.diff).map((u, i) => ({ ...u, rank: i + 1 }));
  }, [activePlayers, matches, goalsSoFar]);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!user) return setAuthError("E-post ej hittad.");
    if (user.isAdmin && loginPassword !== user.password) return setAuthError("Fel lösenord.");
    if (!user.isApproved && !user.isAdmin) return setAuthError("Väntar på godkännande.");
    setCurrentUser(user); if(user.isAdmin) setActiveTab('admin');
  };

  const submitTips = async () => {
    await setDoc(doc(db, "tips", regEmail.toLowerCase()), { name: regName, email: regEmail.toLowerCase(), goals: parseInt(regGoals), predictions: regPicks, isApproved: false, isAdmin: false, groups: ["Alla"] });
    alert("Tips skickat! Emil godkänner när betalning syns.");
    localStorage.removeItem('vmt_draft_v3'); setShowRegister(false);
  };

  const sendChat = async (e) => {
    e.preventDefault(); if(!newChatMsg.trim()) return;
    await addDoc(collection(db, "chat"), { user: currentUser.name, text: newChatMsg, createdAt: serverTimestamp() });
    setNewChatMsg('');
  };

  const updateMatch = async (id, data) => {
    await setDoc(doc(db, "matches", id.toString()), data, { merge: true });
  };

  // --- UI RENDERING ---
  if (!currentUser) return (
    <div className="min-h-screen bg-vmdark text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl z-10">
        <Logo />
        {!showRegister ? (
          <form onSubmit={handleLogin} className="mt-10 space-y-4">
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Din e-post" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />
            {loginEmail.toLowerCase() === 'zettergren.emil@gmail.com' && <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Lösenord" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />}
            {authError && <p className="text-red-400 text-xs font-bold text-center">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-black shadow-lg">LOGGA IN</button>
            <button type="button" onClick={() => setShowRegister(true)} className="w-full text-emerald-400 font-bold text-sm">LÄMNA NYTT TIPS {Object.keys(regPicks).length > 0 && " (Utkast finns)"}</button>
          </form>
        ) : (
          <div className="mt-8 space-y-4 animate-in slide-in-from-right-4 duration-300">
             {regStep === 1 ? (
               <>
                <div className="flex justify-between items-center mb-2"><h2 className="font-bold">1. Dina Uppgifter</h2><button onClick={() => setShowRegister(false)}><X/></button></div>
                <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Namn" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="E-post" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <input type="number" value={regGoals} onChange={e=>setRegGoals(e.target.value)} placeholder="Mål totalt i hela VM?" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <div className="flex gap-2">
                   {Object.keys(regPicks).length > 0 && <button onClick={clearDraft} className="p-4 bg-red-500/20 text-red-400 rounded-2xl"><Trash2/></button>}
                   <button onClick={() => setRegStep(2)} className="flex-1 py-4 bg-emerald-600 rounded-xl font-bold">NÄSTA: FYLL I TIPS</button>
                </div>
               </>
             ) : (
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><button onClick={() => setRegStep(1)} className="text-xs text-slate-400">← Bakåt</button><span className="text-vmgold text-xs font-black">{Object.keys(regPicks).length}/48 tippade</span></div>
                  <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 no-scrollbar">
                    {initialMatchesList.map(m => (
                      <div key={m.id} className="bg-black/30 p-5 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center justify-center gap-4 text-sm font-black text-white italic">
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span>{m.team1}</span>
                            <Flag code={TEAMS[m.team1]?.flag} />
                          </div>
                          <span className="text-vmgold opacity-50 px-2">VS</span>
                          <div className="flex items-center gap-2 flex-1 justify-start">
                            <Flag code={TEAMS[m.team2]?.flag} />
                            <span>{m.team2}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {['1','X','2'].map(s => {
                            const primaryColor = s === '1' ? TEAMS[m.team1]?.primary : s === '2' ? TEAMS[m.team2]?.primary : '#64748b';
                            const isWhite = primaryColor?.toUpperCase() === '#FFFFFF';
                            
                            let style = { backgroundColor: 'rgba(255,255,255,0.05)' };
                            let cl = "text-white scale-100 opacity-60";
                            
                            if(regPicks[m.id] === s) {
                              cl = "scale-105 shadow-xl opacity-100 ring-2 ring-white/20";
                              style.backgroundColor = primaryColor;
                              if(isWhite) cl += " text-slate-900 border border-slate-200";
                            }

                            return (
                              <button 
                                key={s} 
                                onClick={() => setRegPicks({...regPicks, [m.id]:s})} 
                                style={style}
                                className={`flex-1 py-4 rounded-2xl font-black transition-all duration-300 ${cl}`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitTips} disabled={Object.keys(regPicks).length < 48} className="w-full py-5 bg-indigo-600 disabled:opacity-30 rounded-2xl font-black shadow-[0_10px_20px_rgba(79,70,229,0.3)] mt-2">SKICKA IN ANMÄLAN</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-vmdark text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-xl">
        <div className="scale-75 origin-left"><Logo /></div>
        <button onClick={() => setCurrentUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X/></button>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex justify-around p-1 sm:sticky sm:top-[72px] sm:max-w-5xl sm:mx-auto sm:my-4 sm:rounded-3xl sm:border shadow-xl">
        <button onClick={() => setActiveTab('leaderboard')} className={`p-4 transition-colors ${activeTab==='leaderboard'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><Trophy/></button>
        <button onClick={() => setActiveTab('groups')} className={`p-4 transition-colors ${activeTab==='groups'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><ListOrdered/></button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 transition-colors ${activeTab==='chat'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><MessageSquare/></button>
        <button onClick={() => setActiveTab('matches')} className={`p-4 transition-colors ${activeTab==='matches'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><CalendarDays/></button>
        {currentUser.isAdmin && <button onClick={() => setActiveTab('admin')} className={`p-4 transition-colors ${activeTab==='admin'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><Settings/></button>}
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
             <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="p-5">Rank</th><th className="p-5">Namn</th><th className="p-5 text-center">P</th></tr></thead>
                  <tbody className="divide-y">{leaderboard.map(u => (
                    <tr key={u.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="p-5 font-black">#{u.rank}</td><td className="p-5 font-bold">{u.name}</td><td className="p-5 text-center font-black bg-indigo-50/20 text-indigo-700">{u.pts}</td>
                    </tr>
                  ))}</tbody>
                </table>
             </div>
             {/* Matris med flaggor */}
             <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm overflow-x-auto p-6">
                <h3 className="font-black text-xs uppercase mb-6 text-slate-400 flex items-center gap-2"><Grid3X3 size={16}/> Tippningsmatris</h3>
                <table className="w-full text-sm border-collapse whitespace-nowrap">
                   <thead><tr className="bg-slate-50 border-b font-black text-xs uppercase text-slate-500"><th className="p-4 sticky left-0 bg-slate-50 border-r w-56 text-left">Match</th>{activePlayers.map(u => <th key={u.id} className="p-4 text-center border-r min-w-[80px]">{u.name.split(' ')[0]}</th>)}</tr></thead>
                   <tbody>{matches.slice(0, 48).map(m => (
                     <tr key={m.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-4 sticky left-0 bg-white border-r font-black flex items-center gap-3">
                          <div className="flex items-center gap-1.5 w-16 justify-end">
                            <span className="text-[10px]">{m.team1.slice(0,3)}</span>
                            <Flag code={TEAMS[m.team1]?.flag} className="w-4 h-3 rounded-px" />
                          </div>
                          <span className="text-slate-300 text-[10px]">vs</span>
                          <div className="flex items-center gap-1.5 w-16 justify-start">
                            <Flag code={TEAMS[m.team2]?.flag} className="w-4 h-3 rounded-px" />
                            <span className="text-[10px]">{m.team2.slice(0,3)}</span>
                          </div>
                        </td>
                        {activePlayers.map(u => {
                          const pick = u.predictions?.[m.id];
                          const pickColor = pick === '1' ? TEAMS[m.team1]?.primary : pick === '2' ? TEAMS[m.team2]?.primary : '#94a3b8';
                          const isWhite = pickColor?.toUpperCase() === '#FFFFFF';

                          return (
                            <td key={u.id} className="p-4 text-center border-r font-black">
                              <span 
                                style={{ color: pickColor }}
                                className={`px-2 py-1 rounded ${isWhite ? 'bg-slate-800 border border-slate-700' : ''}`}
                              >
                                {pick || '-'}
                              </span>
                            </td>
                          );
                        })}
                     </tr>
                   ))}</tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {TOURNAMENT_GROUPS.map(grp => (
               <div key={grp} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                  <div className="bg-vmdark p-4 text-vmgold font-black text-center text-sm tracking-widest uppercase">GRUPP {grp}</div>
                  <table className="w-full text-left text-xs">
                     <thead><tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase"><th className="p-3">Lag</th><th className="p-3 text-center">+/-</th><th className="p-3 text-center">P</th></tr></thead>
                     <tbody>{Object.values(groupStandings).filter(t => t.group === grp).sort((a,b) => b.pts - a.pts || b.gd - a.gd).map(t => (
                       <tr key={t.name} className="border-b hover:bg-slate-50 transition-colors">
                         <td className="p-3 font-bold flex items-center gap-2">
                           <Flag code={TEAMS[t.name]?.flag} />
                           {t.name}
                         </td>
                         <td className="p-3 text-center font-medium">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                         <td className="p-3 text-center font-black text-indigo-600 bg-indigo-50/30">{t.pts}</td>
                       </tr>
                     ))}</tbody>
                  </table>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-[2rem] border h-[65vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex flex-col no-scrollbar">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black text-slate-400 mb-1 px-1">{m.user}</span>
                  <div className={`px-5 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-4 border-t bg-white flex gap-3">
              <input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Skriv nåt till gruppen..." className="flex-1 bg-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" />
              <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"><Send size={20}/></button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2.5rem] border p-8 shadow-xl"><h2 className="text-2xl font-black mb-6 flex items-center gap-3"><ShieldCheck className="text-emerald-500" size={28}/> Hantera Betalningar</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {tips.filter(t => !t.isAdmin).sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-4 rounded-2xl border bg-slate-50/50 hover:bg-white transition-colors">
                    <div><div className="text-sm font-black">{t.name}</div><div className="text-[11px] text-slate-400 font-medium">{t.email}</div></div>
                    <button onClick={() => updateDoc(doc(db, "tips", t.id), { isApproved: !t.isApproved })} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${t.isApproved?'bg-emerald-100 text-emerald-700 shadow-inner':'bg-white border-2 text-slate-400'}`}>{t.isApproved?'BETALD':'MARKERA'}</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border p-8 shadow-xl"><h2 className="text-2xl font-black mb-6 flex items-center gap-3"><PlayCircle className="text-indigo-600" size={28}/> Rapportera Matchresultat</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matches.map(m => (
                  <div key={m.id} className="p-5 rounded-[2rem] border flex flex-col gap-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{m.date} | {m.group}</span>
                      {m.status === 'finished' && <Check className="text-emerald-500" size={14} />}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Flag code={TEAMS[m.team1]?.flag} />
                        <span className="text-xs font-black">{m.team1.slice(0,10)}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <input type="number" value={m.goals1 ?? ''} onChange={e => updateMatch(m.id, { goals1: parseInt(e.target.value) || 0, status: 'finished' })} className="w-10 h-10 text-center border-2 rounded-xl font-black bg-white focus:border-indigo-500 outline-none transition-all"/>
                        <input type="number" value={m.goals2 ?? ''} onChange={e => updateMatch(m.id, { goals2: parseInt(e.target.value) || 0, status: 'finished' })} className="w-10 h-10 text-center border-2 rounded-xl font-black bg-white focus:border-indigo-500 outline-none transition-all"/>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-black text-right">{m.team2.slice(0,10)}</span>
                        <Flag code={TEAMS[m.team2]?.flag} />
                      </div>
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
