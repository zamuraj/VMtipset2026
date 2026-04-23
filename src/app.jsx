import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Trophy, BarChart3, Settings, CalendarDays, Check, 
  AlertCircle, Clock, Grid3X3, User, X, Lock, 
  Swords, Bell, PlayCircle, Banknote, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin, ListOrdered, Trash2
} from 'lucide-react';

// --- LAGDATA & SCHEMAN (Samma som tidigare) ---
const TEAMS = { 'Mexiko': { flag: '🇲🇽', primary: '#006847', tier: 2 }, 'Ecuador': { flag: '🇪🇨', primary: '#FFD100', tier: 3 }, 'Kanada': { flag: '🇨🇦', primary: '#FF0000', tier: 2 }, 'Slovakien': { flag: '🇸🇰', primary: '#0B4EA2', tier: 3 }, 'Italien': { flag: '🇮🇹', primary: '#0066B2', tier: 1 }, 'Togo': { flag: '🇹🇬', primary: '#006A4E', tier: 3 }, 'USA': { flag: '🇺🇸', primary: '#B31942', tier: 2 }, 'Marocko': { flag: '🇲🇦', primary: '#C1272D', tier: 2 }, 'Spanien': { flag: '🇪🇸', primary: '#AA151B', tier: 1 }, 'Japan': { flag: '🇯🇵', primary: '#BC002D', tier: 2 }, 'Brasilien': { flag: '🇧🇷', primary: '#FFDF00', tier: 1 }, 'Sydkorea': { flag: '🇰🇷', primary: '#0047A0', tier: 3 }, 'Sverige': { flag: '🇸🇪', primary: '#006AA7', tier: 2 }, 'Jordanien': { flag: '🇯🇴', primary: '#CE1126', tier: 3 }, 'England': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#000040', tier: 1 }, 'Peru': { flag: '🇵🇪', primary: '#D91023', tier: 3 }, 'Tyskland': { flag: '🇩🇪', primary: '#000000', tier: 1 }, 'Norge': { flag: '🇳🇴', primary: '#EF2B2D', tier: 2 }, 'Frankrike': { flag: '🇫🇷', primary: '#002395', tier: 1 }, 'Uzbekistan': { flag: '🇺🇿', primary: '#0099B5', tier: 3 }, 'Uruguay': { flag: '🇺🇾', primary: '#0038A8', tier: 2 }, 'Kamerun': { flag: '🇨🇲', primary: '#007A5E', tier: 3 }, 'Nederländerna': { flag: '🇳🇱', primary: '#F36C21', tier: 1 }, 'Australien': { flag: '🇦🇺', primary: '#00008B', tier: 3 }, 'Argentina': { flag: '🇦🇷', primary: '#75AADB', tier: 1 }, 'Haiti': { flag: '🇭🇹', primary: '#00209F', tier: 3 }, 'Belgien': { flag: '🇧🇪', primary: '#000000', tier: 1 }, 'Panama': { flag: '🇵🇦', primary: '#005293', tier: 3 }, 'Portugal': { flag: '🇵🇹', primary: '#006600', tier: 1 }, 'Senegal': { flag: '🇸🇳', primary: '#00853F', tier: 2 }, 'Danmark': { flag: '🇩🇰', primary: '#C60C30', tier: 2 }, 'Nigeria': { flag: '🇳🇬', primary: '#008751', tier: 3 }, 'Sydafrika': { flag: '🇿🇦', primary: '#007C59', tier: 3 }, 'Tjeckien': { flag: '🇨🇿', primary: '#11457E', tier: 2 }, 'Bosnien': { flag: '🇧🇦', primary: '#002395', tier: 3 }, 'Paraguay': { flag: '🇵🇾', primary: '#D52B1E', tier: 3 }, 'Qatar': { flag: '🇶🇦', primary: '#8D1B3D', tier: 3 }, 'Schweiz': { flag: '🇨🇭', primary: '#D52B1E', tier: 2 }, 'Skottland': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', primary: '#004B84', tier: 3 }, 'Turkiet': { flag: '🇹🇷', primary: '#E30A17', tier: 2 }, 'Curaçao': { flag: '🇨🇼', primary: '#002B7F', tier: 3 }, 'Elfenbenskusten': { flag: '🇨🇮', primary: '#FF8200', tier: 2 }, 'Tunisien': { flag: '🇹🇳', primary: '#E70013', tier: 3 }, 'Kap Verde': { flag: '🇨🇻', primary: '#003893', tier: 3 }, 'Egypten': { flag: '🇪🇬', primary: '#C09307', tier: 2 }, 'Saudiarabien': { flag: '🇸🇦', primary: '#006C35', tier: 3 }, 'Iran': { flag: '🇮🇷', primary: '#239f40', tier: 3 }, 'Nya Zeeland': { flag: '🇳🇿', primary: '#000000', tier: 3 }, 'Irak': { flag: '🇮🇶', primary: '#007A33', tier: 3 }, 'Algeriet': { flag: '🇩🇿', primary: '#006233', tier: 3 }, 'Österrike': { flag: '🇦🇹', primary: '#EF3340', tier: 2 }, 'DR Kongo': { flag: '🇨🇩', primary: '#007FFF', tier: 3 }, 'Colombia': { flag: '🇨🇴', primary: '#FCD116', tier: 2 }, 'Kroatien': { flag: '🇭🇷', primary: '#FF0000', tier: 1 }, 'Ghana': { flag: '🇬🇭', primary: '#FCD116', tier: 3 } };
const VM_SCHEDULE = [ "1|11 jun 21:00|A|Mexiko|Sydafrika|Mexico City", "2|12 jun 00:00|B|Kanada|Slovakien|Toronto", "3|12 jun 15:00|A|Sydkorea|Tjeckien|Guadalajara", "4|13 jun 00:00|D|USA|Paraguay|Los Angeles", "5|13 jun 21:00|B|Qatar|Schweiz|San Francisco", "6|14 jun 00:00|C|Brasilien|Marocko|New Jersey", "7|14 jun 03:00|C|Haiti|Skottland|Boston", "8|14 jun 06:00|D|Australien|Turkiet|Vancouver", "9|14 jun 19:00|E|Tyskland|Curaçao|Houston", "10|14 jun 22:00|F|Nederländerna|Japan|Dallas", "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Philadelphia", "12|15 jun 04:00|F|Sverige|Tunisien|Monterrey", "13|15 jun 18:00|H|Spanien|Kap Verde|Atlanta", "14|15 jun 21:00|G|Belgien|Egypten|Seattle", "15|16 jun 00:00|H|Saudiarabien|Uruguay|Miami", "16|16 jun 03:00|G|Iran|Nya Zeeland|SoFi Stadium", "17|16 jun 21:00|I|Frankrike|Senegal|MetLife Stadium", "18|17 jun 00:00|I|Irak|Norge|Gillette Stadium", "19|17 jun 03:00|J|Argentina|Algeriet|Arrowhead Stadium", "20|17 jun 06:00|J|Österrike|Jordanien|Levi's Stadium", "21|17 jun 19:00|K|Portugal|DR Kongo|NRG Stadium", "22|17 jun 22:00|L|England|Kroatien|AT&T Stadium", "23|18 jun 01:00|L|Ghana|Panama|BMO Field", "24|18 jun 04:00|K|Uzbekistan|Colombia|Mexico City", "25|18 jun 18:00|A|Tjeckien|Sydafrika|Atlanta", "26|18 jun 21:00|B|Schweiz|Bosnien|SoFi Stadium", "27|19 jun 00:00|B|Kanada|Qatar|BC Place", "28|19 jun 03:00|A|Mexiko|Sydkorea|Akron Stadium", "29|19 jun 21:00|D|USA|Australien|Lumen Field", "30|20 jun 00:00|C|Skottland|Marocko|Gillette Stadium", "31|20 jun 03:00|C|Sverige|Sydkorea|Lincoln Financial", "32|20 jun 06:00|D|Turkiet|Paraguay|Levi's Stadium", "33|20 jun 19:00|F|Nederländerna|Sverige|NRG Stadium", "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|BMO Field", "35|21 jun 02:00|E|Ecuador|Curaçao|Arrowhead Stadium", "36|21 jun 06:00|F|Tunisien|Japan|BBVA Bancomer", "37|21 jun 18:00|H|Spanien|Saudiarabien|Atlanta", "38|21 jun 21:00|G|Belgien|Iran|SoFi Stadium", "39|22 jun 00:00|H|Uruguay|Kap Verde|Hard Rock Stadium", "40|22 jun 03:00|G|Nya Zeeland|Egypten|BC Place", "41|22 jun 19:00|J|Argentina|Österrike|Arrowhead Stadium", "42|22 jun 23:00|I|Frankrike|Irak|Lincoln Financial", "43|23 jun 02:00|I|Norge|Senegal|MetLife Stadium", "44|23 jun 05:00|J|Jordanien|Algeriet|Levi's Stadium", "45|23 jun 19:00|K|Portugal|Uzbekistan|NRG Stadium", "46|23 jun 22:00|L|England|Ghana|Gillette Stadium", "47|24 jun 01:00|L|Panama|Kroatien|Gillette Stadium", "48|24 jun 04:00|K|Colombia|DR Kongo|Akron Stadium" ];

// --- UTILS ---
const Logo = () => (
  <div className="flex items-center justify-center gap-3">
    <div className="relative"><Trophy className="w-10 h-10 text-vmgold relative z-10" /><div className="absolute inset-0 bg-vmgold blur-lg opacity-60" /></div>
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

  // --- FIREBASE DATA STATES ---
  const [tips, setTips] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // --- REGISTRATION DRAFT ---
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGoals, setRegGoals] = useState('');
  const [regPicks, setRegPicks] = useState({});

  // --- Ladda data från Firebase ---
  useEffect(() => {
    // 1. Lyssna på Tips (Live)
    const unsubTips = onSnapshot(collection(db, "tips"), (snap) => {
      setTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // 2. Lyssna på Matcher (Live)
    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const dbMatches = snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
      const baseMatches = VM_SCHEDULE.map(m => {
        const [id, date, grp, t1, t2, ven] = m.split('|');
        const dbM = dbMatches.find(x => x.id === parseInt(id));
        return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, venue: ven, goals1: dbM?.goals1 ?? null, goals2: dbM?.goals2 ?? null, status: dbM?.status ?? 'upcoming', minute: dbM?.minute ?? null };
      });
      setMatches(baseMatches);
    });
    // 3. Lyssna på Chat (Live)
    const qChat = query(collection(db, "chat"), orderBy("createdAt", "asc"));
    const unsubChat = onSnapshot(qChat, (snap) => {
      setChatMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubTips(); unsubMatches(); unsubChat(); };
  }, []);

  // Autospar för registreringsutkast (Local)
  useEffect(() => {
    const draft = JSON.parse(localStorage.getItem('vmt_draft'));
    if(draft) { setRegName(draft.name); setRegEmail(draft.email); setRegGoals(draft.goals); setRegPicks(draft.picks); setRegStep(draft.step); }
  }, []);

  useEffect(() => {
    localStorage.setItem('vmt_draft', JSON.stringify({ name: regName, email: regEmail, goals: regGoals, picks: regPicks, step: regStep }));
  }, [regName, regEmail, regGoals, regPicks, regStep]);

  // --- LOGIK & BERÄKNINGAR ---
  const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
  const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);
  const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };

  const leaderboard = useMemo(() => {
    return activePlayers.map(u => {
      let pts = 0;
      matches.forEach(m => {
        const res = get1X2(m.goals1, m.goals2);
        if (res && u.predictions?.[m.id] === res) pts++;
      });
      return { ...u, pts, diff: Math.abs(u.goals - goalsSoFar) };
    }).sort((a, b) => b.pts - a.pts || a.diff - b.diff).map((u, i) => ({ ...u, rank: i + 1 }));
  }, [activePlayers, matches, goalsSoFar]);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!user) return setAuthError("E-post ej hittad.");
    if (user.isAdmin && loginPassword !== user.password) return setAuthError("Fel lösenord.");
    if (!user.isApproved && !user.isAdmin) return setAuthError("Väntar på godkänd betalning.");
    setCurrentUser(user); if(user.isAdmin) setActiveTab('admin');
  };

  const submitTips = async () => {
    await setDoc(doc(db, "tips", regEmail.toLowerCase()), {
      name: regName, email: regEmail.toLowerCase(), goals: parseInt(regGoals), predictions: regPicks, isApproved: false, isAdmin: false, groups: ["Alla"]
    });
    alert("Tips mottaget! Sidan uppdateras när Emil godkänt betalningen.");
    localStorage.removeItem('vmt_draft');
    setShowRegister(false);
  };

  const sendChat = async (e) => {
    e.preventDefault(); if(!newChatMsg.trim()) return;
    await addDoc(collection(db, "chat"), { user: currentUser.name, text: newChatMsg, createdAt: serverTimestamp(), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    setNewChatMsg('');
  };

  const updateMatch = async (id, data) => {
    await setDoc(doc(db, "matches", id.toString()), data, { merge: true });
  };

  if (!currentUser) return (
    <div className="min-h-screen bg-vmdark text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/20 shadow-2xl z-10">
        <Logo />
        {!showRegister ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="E-post" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />
            {loginEmail.toLowerCase() === 'zettergren.emil@gmail.com' && <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Lösenord" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />}
            {authError && <p className="text-red-400 text-xs font-bold text-center">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-black">ÖPPNA TIPSET</button>
            <button type="button" onClick={() => setShowRegister(true)} className="w-full text-emerald-400 font-bold text-sm">LÄMNA NYTT TIPS</button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
             {regStep === 1 ? (
               <>
                <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Namn" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" />
                <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="E-post" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" />
                <input type="number" value={regGoals} onChange={e=>setRegGoals(e.target.value)} placeholder="Mål totalt i VM?" className="w-full p-4 rounded-xl bg-black/40 border border-white/10" />
                <button onClick={() => setRegStep(2)} className="w-full py-4 bg-emerald-600 rounded-xl font-bold">NÄSTA: FYLL I RADEN</button>
               </>
             ) : (
               <div className="max-h-[50vh] overflow-y-auto space-y-3">
                  {matches.map(m => (
                    <div key={m.id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] mb-2">{m.team1} - {m.team2}</p>
                      <div className="flex gap-2">
                        {['1','X','2'].map(s => (
                          <button key={s} onClick={() => setRegPicks({...regPicks, [m.id]:s})} className={`flex-1 py-2 rounded-lg font-bold ${regPicks[m.id]===s ? 'bg-vmgold text-black' : 'bg-white/5'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={submitTips} className="w-full py-4 bg-indigo-600 rounded-xl font-bold sticky bottom-0">SKICKA IN TIPS</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-vmdark text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="scale-75 origin-left"><Logo /></div>
        <button onClick={() => setCurrentUser(null)} className="p-2 bg-white/10 rounded-full"><X/></button>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex justify-around p-1 sm:sticky sm:top-[72px] sm:max-w-5xl sm:mx-auto sm:my-4 sm:rounded-3xl sm:border">
        <button onClick={() => setActiveTab('leaderboard')} className={`p-4 ${activeTab==='leaderboard'?'text-indigo-600':'text-slate-300'}`}><Trophy/></button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 ${activeTab==='chat'?'text-indigo-600':'text-slate-300'}`}><MessageSquare/></button>
        <button onClick={() => setActiveTab('matches')} className={`p-4 ${activeTab==='matches'?'text-indigo-600':'text-slate-300'}`}><CalendarDays/></button>
        {currentUser.isAdmin && <button onClick={() => setActiveTab('admin')} className={`p-4 ${activeTab==='admin'?'text-indigo-600':'text-slate-300'}`}><Settings/></button>}
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="p-4">Rank</th><th className="p-4">Namn</th><th className="p-4 text-center">P</th></tr></thead>
              <tbody className="divide-y">
                {leaderboard.map(u => (
                  <tr key={u.id} className="hover:bg-indigo-50/50">
                    <td className="p-4 font-black">#{u.rank}</td>
                    <td className="p-4 font-bold">{u.name}</td>
                    <td className="p-4 text-center font-black bg-indigo-50/20 text-indigo-700">{u.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border h-[60vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-black text-slate-400">{m.user}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${m.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-4 border-t flex gap-2"><input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Skriv nåt..." className="flex-1 bg-slate-100 p-3 rounded-xl outline-none" /><button className="bg-indigo-600 text-white p-3 rounded-xl"><Send/></button></form>
          </div>
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border p-6"><h2 className="text-xl font-black mb-4">Godkänn Betalningar</h2>
              {tips.filter(t => !t.isAdmin).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 border-b">
                  <div className="text-sm font-bold">{t.name}</div>
                  <button onClick={() => updateDoc(doc(db, "tips", t.id), { isApproved: !t.isApproved })} className={`px-4 py-1 rounded-lg text-xs font-bold ${t.isApproved?'bg-emerald-100 text-emerald-700':'bg-slate-100'}`}>{t.isApproved?'KLAR':'GODKÄNN'}</button>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-3xl border p-6"><h2 className="text-xl font-black mb-4">Rapportera Mål</h2>
              {matches.slice(0,10).map(m => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b">
                   <div className="text-xs font-bold">{m.team1} - {m.team2}</div>
                   <div className="flex gap-2">
                      <input type="number" value={m.goals1 ?? ''} onChange={e => updateMatch(m.id, { goals1: parseInt(e.target.value), status: 'finished' })} className="w-10 text-center border rounded"/>
                      <input type="number" value={m.goals2 ?? ''} onChange={e => updateMatch(m.id, { goals2: parseInt(e.target.value), status: 'finished' })} className="w-10 text-center border rounded"/>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
