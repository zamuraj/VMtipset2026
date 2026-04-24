import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy, serverTimestamp, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  Trophy, BarChart3, Settings, CalendarDays, Check, 
  AlertCircle, Clock, Grid3X3, User, X, Lock, LogOut, Award, History, Star,
  Swords, Bell, PlayCircle, Banknote, MessageSquare, Send, Goal, ShieldCheck, ChevronDown, ChevronUp, MapPin, ListOrdered, Trash2, Tv, Users, Activity, Edit
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

const VM_SCHEDULE = [
  "1|11 jun 21:00|A|Mexiko|Sydafrika|Azteca|Mexico City|Mexiko|SVT",
  "2|12 jun 00:00|B|Kanada|Slovakien|BMO Field|Toronto|Kanada|TV4",
  "3|12 jun 15:00|A|Sydkorea|Tjeckien|Akron|Guadalajara|Mexiko|SVT",
  "4|13 jun 00:00|D|USA|Paraguay|SoFi|Los Angeles|USA|TV4",
  "5|13 jun 21:00|B|Qatar|Schweiz|Levi's|San Francisco|USA|SVT",
  "6|14 jun 00:00|C|Brasilien|Marocko|MetLife|New Jersey|USA|TV4",
  "7|14 jun 03:00|C|Haiti|Skottland|Gillette|Boston|USA|SVT",
  "8|14 jun 06:00|D|Australien|Turkiet|BC Place|Vancouver|Kanada|TV4",
  "9|14 jun 19:00|E|Tyskland|Curaçao|NRG|Houston|USA|SVT",
  "10|14 jun 22:00|F|Nederländerna|Japan|AT&T|Dallas|USA|TV4",
  "11|15 jun 01:00|E|Elfenbenskusten|Ecuador|Lincoln|Philadelphia|USA|SVT",
  "12|15 jun 04:00|F|Sverige|Tunisien|BBVA|Monterrey|Mexiko|TV4",
  "13|15 jun 18:00|H|Spanien|Kap Verde|Mercedes|Atlanta|USA|SVT",
  "14|15 jun 21:00|G|Belgien|Egypten|Lumen|Seattle|USA|TV4",
  "15|16 jun 00:00|H|Saudiarabien|Uruguay|Hard Rock|Miami|USA|SVT",
  "16|16 jun 03:00|G|Iran|Nya Zeeland|SoFi|Los Angeles|USA|TV4",
  "17|16 jun 21:00|I|Frankrike|Senegal|MetLife|New Jersey|USA|SVT",
  "18|17 jun 00:00|I|Irak|Norge|Gillette|Boston|USA|TV4",
  "19|17 jun 03:00|J|Argentina|Algeriet|Arrowhead|Kansas City|USA|SVT",
  "20|17 jun 06:00|J|Österrike|Jordanien|Levi's|San Francisco|USA|TV4",
  "21|17 jun 19:00|K|Portugal|DR Kongo|NRG|Houston|USA|SVT",
  "22|17 jun 22:00|L|England|Kroatien|AT&T|Dallas|USA|TV4",
  "23|18 jun 01:00|L|Ghana|Panama|BMO Field|Toronto|Kanada|SVT",
  "24|18 jun 04:00|K|Uzbekistan|Colombia|Azteca|Mexico City|Mexiko|TV4",
  "25|18 jun 18:00|A|Tjeckien|Sydafrika|Mercedes|Atlanta|USA|SVT",
  "26|18 jun 21:00|B|Schweiz|Bosnien|SoFi|Los Angeles|USA|TV4",
  "27|19 jun 00:00|B|Kanada|Qatar|BC Place|Vancouver|Kanada|SVT",
  "28|19 jun 03:00|A|Mexiko|Sydkorea|Akron|Guadalajara|Mexiko|TV4",
  "29|19 jun 21:00|D|USA|Australien|Lumen|Seattle|USA|SVT",
  "30|20 jun 00:00|C|Skottland|Marocko|Gillette|Boston|USA|TV4",
  "31|20 jun 03:00|C|Brasilien|Haiti|Lincoln|Philadelphia|USA|SVT",
  "32|20 jun 06:00|D|Turkiet|Paraguay|Levi's|San Francisco|USA|TV4",
  "33|20 jun 19:00|F|Nederländerna|Sverige|NRG|Houston|USA|SVT",
  "34|20 jun 22:00|E|Tyskland|Elfenbenskusten|BMO Field|Toronto|Kanada|TV4",
  "35|21 jun 02:00|E|Ecuador|Curaçao|Arrowhead|Kansas City|USA|SVT",
  "36|21 jun 06:00|F|Tunisien|Japan|BBVA|Monterrey|Mexiko|TV4",
  "37|21 jun 18:00|H|Spanien|Saudiarabien|Mercedes|Atlanta|USA|SVT",
  "38|21 jun 21:00|G|Belgien|Iran|SoFi|Los Angeles|USA|TV4",
  "39|22 jun 00:00|H|Uruguay|Kap Verde|Hard Rock|Miami|USA|SVT",
  "40|22 jun 03:00|G|Nya Zeeland|Egypten|BC Place|Vancouver|Kanada|TV4",
  "41|22 jun 19:00|J|Argentina|Österrike|Arrowhead|Kansas City|USA|SVT",
  "42|22 jun 23:00|I|Frankrike|Irak|Lincoln|Philadelphia|USA|TV4",
  "43|23 jun 02:00|I|Norge|Senegal|MetLife|New Jersey|USA|SVT",
  "44|23 jun 05:00|J|Jordanien|Algeriet|Levi's|San Francisco|USA|TV4",
  "45|23 jun 19:00|K|Portugal|Uzbekistan|NRG|Houston|USA|SVT",
  "46|23 jun 22:00|L|England|Ghana|Gillette|Boston|USA|TV4",
  "47|24 jun 01:00|L|Panama|Kroatien|Gillette|Boston|USA|SVT",
  "48|24 jun 04:00|K|Colombia|DR Kongo|Akron|Guadalajara|Mexiko|TV4",
  "49|24 jun 18:00|A|Sydafrika|Sydkorea|Mercedes|Atlanta|USA|SVT",
  "50|24 jun 21:00|A|Tjeckien|Mexiko|Azteca|Mexico City|Mexiko|TV4",
  "51|25 jun 00:00|B|Slovakien|Qatar|BMO Field|Toronto|Kanada|SVT",
  "52|25 jun 03:00|B|Schweiz|Kanada|BC Place|Vancouver|Kanada|TV4",
  "53|25 jun 18:00|C|Marocko|Haiti|Hard Rock|Miami|USA|SVT",
  "54|25 jun 21:00|C|Skottland|Brasilien|MetLife|New Jersey|USA|TV4",
  "55|26 jun 00:00|D|Paraguay|Australien|Lumen|Seattle|USA|SVT",
  "56|26 jun 03:00|D|Turkiet|USA|SoFi|Los Angeles|USA|TV4",
  "57|26 jun 18:00|E|Curaçao|Elfenbenskusten|Mercedes|Atlanta|USA|SVT",
  "58|26 jun 21:00|E|Ecuador|Tyskland|AT&T|Dallas|USA|TV4",
  "59|27 jun 00:00|F|Sverige|Japan|Azteca|Mexico City|Mexiko|SVT",
  "60|27 jun 03:00|F|Tunisien|Nederländerna|Arrowhead|Kansas City|USA|TV4",
  "61|27 jun 18:00|G|Egypten|Iran|Lincoln|Philadelphia|USA|SVT",
  "62|27 jun 21:00|G|Nya Zeeland|Belgien|SoFi|Los Angeles|USA|TV4",
  "63|28 jun 00:00|H|Kap Verde|Saudiarabien|Lumen|Seattle|USA|SVT",
  "64|28 jun 03:00|H|Uruguay|Spanien|Hard Rock|Miami|USA|TV4",
  "65|28 jun 18:00|I|Senegal|Irak|Mercedes|Atlanta|USA|SVT",
  "66|28 jun 21:00|I|Norge|Frankrike|MetLife|New Jersey|USA|TV4",
  "67|29 jun 00:00|J|Algeriet|Österrike|Gillette|Boston|USA|SVT",
  "68|29 jun 03:00|J|Jordanien|Argentina|Arrowhead|Kansas City|USA|TV4",
  "69|29 jun 18:00|K|DR Kongo|Uzbekistan|Azteca|Mexico City|Mexiko|SVT",
  "70|29 jun 21:00|K|Colombia|Portugal|NRG|Houston|USA|TV4",
  "71|30 jun 00:00|L|Kroatien|Ghana|AT&T|Dallas|USA|SVT",
  "72|30 jun 03:00|L|Panama|England|BMO Field|Toronto|Kanada|TV4"
];

const initialMatchesList = VM_SCHEDULE.map(m => {
  const [id, date, grp, t1, t2, arena, city, country, tv] = m.split('|');
  return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, arena, city, country, tv };
});

const MATCH_FACTS = {
  1: "Mexiko och Sydafrika möttes redan i 2010 VM:s öppningsmatch! Tshabalala fick hela Soweto att explodera med sitt mål.",
  2: "Kanada nådde VM-final i ishockey – kan de göra det i fotboll mot Slovakien? Deras Sigma nu är faktiskt fotbollen.",
  3: "Sydkorea är kända för sin taktiska disciplin och publiken som sjunger i kör. Tjeckien har Schick – mannen som sköt från mittcirkeln.",
  4: "USA spelar hemma på SoFi Stadium i LA – samma arena som Superbowl. Paraguay har inte missat ett VM sedan 1950!",
  5: "Qatar är det enda VM-landet som aldrig vunnit en VM-match i fältet. Schweiz förlorar aldrig i gruppspel – aldrig.",
  6: "Brasilien vs Marocko – Seleção möter det lag som chockade hela världen i 2022. Ingen förväntade sig Marocko i semifinal då!",
  7: "Haiti deltar i sitt tredje VM någonsin. Skottland har å sin sida inte vunnit en VM-match sedan 1974. Nostalgifest!",
  8: "Australien och Turkiet – två lag med massiva diasporor i varandras hemländer. Och båda har brutit sig ur gamla mönster!",
  9: "Tyskland mot Curaçao – 80 000 000 vs 160 000 invånare. David och Goliat på fotbollsplanen!",
  10: "Nederländerna vs Japan – Oranjerna skrämmer ingen längre, men Japan chockade Spanien och Tyskland i Qatar 2022.",
  11: "Elfenbenskusten har tre landslagsspelare som heter Zaha – äkta djungelstat! Ecuador spelar alltid med hjärtat.",
  12: "Sverige spelar i Monterrey – exakt där Maradona trillsde bollen runt halva England 1986. Historisk arena!",
  13: "Spanien vs Kap Verde – tiqui-taka mot öarna med 550 000 invånare och ett lag som drömmer om miraklet.",
  14: "Belgien är eviga kandidater som aldrig vinner. Egypten har Salah – men spelar han? Det är hela frågan.",
  15: "Saudiarabien slog Argentina 2022 – kanske tidernas störtsa VM-skräll. Uruguay har 2 VM-guld och ett lejonhjärta.",
  16: "Iran har Azmoun och ett landslag med stark europeisk träning. Nya Zeeland är VM-debytanter och bokstavligen längst bort.",
  17: "Frankrike vs Senegal – ett postkolonialt drama! Mbappe mot Sadio Mane i drömmens match.",
  18: "Irak i VM för första gången sedan 1986! Norge har Haaland – behöver vi säga mer?",
  19: "Argentina vs Algeriet – Messi möter laget som tog sig till semifinal i Afrika-cupen. Storlek möter hunger!",
  20: "Österrike är klassens tyst goda lag som ingen räknar med. Jordanien debuterar i VM – ett historiskt ögonblick!",
  21: "Portugal vs DR Kongo – Ronaldo i skymningszonen möter ett land med 100 miljoner drömmar och otrolig talang.",
  22: "England vs Kroatien – en rematch av 2018 VM-semifinalen! Modric är äldre nu, men fortfarande magisk.",
  23: "Ghana har Ayew-bröderna och en publik som aldrig tystnar. Panama lärde sig av USA-chansen 2018.",
  24: "Uzbekistan i sitt första VM! Colombia har James Rodriguéz – vars mål mot Uruguay 2014 röstades till VM:s bästa.",
  25: "Tjeckien vs Sydafrika – Schick vs Bafana Bafana! Tjeckien älskar att komma igång sent i turneringar.",
  26: "Schweiz vs Bosnien – alpernas disciplin mot Balkans passion. Bosnien har den bästa VM-läktarsången i historien.",
  27: "Kanada vs Qatar – hemlandsmatchen för Kanadas mångkulturella fans möter arrangören som tog VM från Europa.",
  28: "Mexiko vs Sydkorea – El Tri möter det lag som tog sig till final under hemma-VM 2002. Legendarisk rivalitet!",
  29: "USA vs Australien – Sokkers vs Socceroos! Två engelsktankiga nationer som kämpar för att bli tagna på allvar.",
  30: "Skottland vs Marocko – kiltarna möter atlaslejonen! Marocko är Afrikas nya fotbollssupermakt.",
  31: "Brasilien vs Haiti – Seleçãos femte VM-guld möter ett land som trots allt kniper sin plats i historieböckerna.",
  32: "Turkiet vs Paraguay – bägge lagarna kan skapa chockresultat. Turkiet var i semifinal 2002 och glömde det aldrig.",
  33: "Nederländerna vs Sverige – Vikingakrig! Sista gången möttes de i ett VM var 1994 och Brolin sköt mål.",
  34: "Tyskland vs Elfenbenskusten – Die Mannschaft möter laget som har gjort Didier Drogba odödlig i ett helt kontinent.",
  35: "Ecuador vs Curaçao – Andinska höjder möter karibisk sol. Ecuador spelade öppningsmatchen i Qatar 2022!",
  36: "Tunisien vs Japan – Nordafrika möter Asien i en match som handlar om stolthet och representation.",
  37: "Spanien vs Saudiarabien – tiqui-taka möter ökenkrigar. Saudiarabien slog Argentina 2022. Kan de upprepa det?",
  38: "Belgien vs Iran – Romelu Lukakus muskelkraft möter Azmoun på topp. Två lag som alltid overperformar förväntningarna.",
  39: "Uruguay vs Kap Verde – Celeste möter öarnas soldater. Uruguay vann VM 1930 och 1950 och glömmer aldrig det.",
  40: "Nya Zeeland vs Egypten – Salah och All Whites! Nya Zeeland spelar VM för tredje gången totalt.",
  41: "Argentina vs Österrike – Messi möter ett lag som sist möttes av Maradona i VM-finalen 1990!",
  42: "Frankrike vs Irak – Les Bleus möter VM-debytanterna. Frankrike har vunnit VM med spelare från 13 olika länder.",
  43: "Norge vs Senegal – Haaland möter Mane i ett möte av giganter. Norge har inte spelat VM sedan 1998!",
  44: "Jordanien vs Algeriet – ett arabisk derby! Bägge lagen är relativt nya på VM-scenen men fulla av stolthet.",
  45: "Portugal vs Uzbekistan – Ronaldo vs ett lag som inte ens existerade som nation för 35 år sedan.",
  46: "England vs Ghana – Three Lions möter Black Stars. England har en sorg mot Ghana sedan Asamoah Gyan 2010.",
  47: "Panama vs Kroatien – Panamas lille hjälte möter kroaternas mekanik. Kroatien var VM-silvermedaljörer 2018!",
  48: "Colombia vs DR Kongo – Sydamerika möter Centralafrika i ett möte av fotbollskulturer som aldrig möts annars.",
  49: "Sydafrika vs Sydkorea – Africas nation möter Asiens mästare. Bafana Bafana betyder 'The Boys! The Boys!'",
  50: "Tjeckien vs Mexiko – Azteca-arenan och 90 000 galningarna möter tjeckernas råa effektivitet.",
  51: "Slovakien vs Qatar – Hamšík vs Almoez Ali! Qatar-lagets Al Moez Ali poängterade i varje omgång av 2019 Asien-cupen.",
  52: "Schweiz vs Kanada – Alper möter Lönnlövet! Schweiz har aldrig förlorat tre raka VM-matcher i gruppspelet.",
  53: "Marocko vs Haiti – Atlaslejonen möter Karibiens tuffaste utmanare. Marocko är hela Afrikas glädje.",
  54: "Skottland vs Brasilien – Tartan Army möter Seleção. Skottland spelade mot Brasilien i 1974 och fick 0-0!",
  55: "Paraguay vs Australien – La Albirroja möter Socceroos. Paraguay tog sig till kvartsfinal 2010 – ingen hade trott det.",
  56: "Turkiet vs USA – Crescent möter Stars and Stripes. USA har faktiskt slagit Turkiet i alla deras möten!",
  57: "Curaçao vs Elfenbenskusten – Curaçao spelar sitt allra första VM! Hela ön har mindre befolkning än Kungsholmen.",
  58: "Ecuador vs Tyskland – Die Mannschaft möter Triscolors. Ecuador slog Sverige i VM 2006!",
  59: "Sverige vs Japan – Zlatan vs Samurai Blue. 2006 möttes de i VM och Sverige vann – nu är det dags för hämnd?",
  60: "Tunisien vs Nederländerna – Øranjerna möter Nordafrika. Tunisien är det arabiska landets mest regelbundna VM-lag.",
  61: "Egypten vs Iran – Faraoerna möter Persien. Egypten dominerade afrikansk fotboll i åttio år men har bara 3 VM-historier.",
  62: "Nya Zeeland vs Belgien – Röda Djävlarna möter All Whites i en match Belgien borde vinna men aldrig tar lätt.",
  63: "Kap Verde vs Saudiarabien – öarnas underdogs möter arabernas mäktiga investering i fotboll.",
  64: "Uruguay vs Spanien – La Celeste vs La Roja! 1950 vann Uruguay VM-titeln mot Spaniens föregångare i final-liknande match.",
  65: "Senegal vs Irak – Lions of Teranga möter Mesopotamiens lejon! Bägge spelar med imponerande teknisk stil.",
  66: "Norge vs Frankrike – Haaland vs Mbappe! Det här kan bli VM:s roligaste enskilda duell. Vem är bäst?",
  67: "Algeriet vs Österrike – Nordafrika möter Centraleuropa i ett möte som aldrig har hänt i VM-historia tidigare!",
  68: "Jordanien vs Argentina – underdogs möter mästare. Argentina har vunnit sina senaste 38 matcher i rad!",
  69: "DR Kongo vs Uzbekistan – Centralasien möter Centralafrika. Båda lagen representerar historiska civilisationer.",
  70: "Colombia vs Portugal – James vs Ronaldo! Colombias mål mot Uruguay 2014 av James Rodriguéz röstades till VM:s bästa mål.",
  71: "Kroatien vs Ghana – Modric möter Black Stars. Kroatien vann sin hemmagrupp mot Ghana i 2006 VM.",
  72: "Panama vs England – Central Amerika vs Three Lions i Torontos hetta! Panamas VM-debut 2018 slutade 6-1 mot England."
};

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

const TvBadge = ({ tv }) => {
  if (tv === 'SVT') return <span className="bg-[#000030] text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">SVT</span>;
  if (tv === 'TV4') return <span className="bg-[#E50000] text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">TV4</span>;
  return <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[9px]"><Tv size={10}/> {tv}</span>;
};

const Logo = () => (
  <div className="flex items-center justify-center gap-3">
    <div className="relative"><Trophy className="w-10 h-10 text-vmgold relative z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" /><div className="absolute inset-0 bg-vmgold blur-xl opacity-40" /></div>
    <div className="flex flex-col"><span className="font-black text-3xl italic leading-none tracking-tighter text-white uppercase">Soffcoachernas Tipsliga</span><span className="font-bold text-[10px] tracking-[0.3em] text-indigo-400 leading-none mt-1 uppercase">Bara för de invigda</span></div>
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [folketsTipsMode, setFolketsTipsMode] = useState(0); 
  const [h2hUser1, setH2hUser1] = useState('');
  const [h2hUser2, setH2hUser2] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPrizeExpanded, setIsPrizeExpanded] = useState(false);
  const [hofYear, setHofYear] = useState('');
  const [hofName, setHofName] = useState('');
  const [hofType, setHofType] = useState('VM');

  // --- FIREBASE DATA ---
  const [tips, setTips] = useState([]);
  const [matches, setMatches] = useState(initialMatchesList);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [adminFee, setAdminFee] = useState(100);
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // --- REGISTRATION DRAFT ---
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGoals, setRegGoals] = useState('');
  const [regPicks, setRegPicks] = useState({});
  const [timeLeft, setTimeLeft] = useState('');

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!deadline) { setTimeLeft('Deadline ej satt'); return; }
    const interval = setInterval(() => {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft('Deadline passerad');
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${d} dagar, ${h} timmar, ${m} minuter, ${s} sekunder`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsubTips = onSnapshot(collection(db, "tips"), (snap) => setTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (err) => console.error('Firebase Error Tips:', err));
    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const dbMatches = snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
      setMatches(VM_SCHEDULE.map(m => {
        const [id, date, grp, t1, t2, arena, city, country, tv] = m.split('|');
        const dbM = dbMatches.find(x => x.id === parseInt(id));
        return { id: parseInt(id), date, group: grp, team1: t1, team2: t2, arena, city, country, tv, goals1: dbM?.goals1 ?? null, goals2: dbM?.goals2 ?? null, status: dbM?.status ?? 'upcoming', minute: dbM?.minute ?? null };
      }));
    }, (err) => console.error('Firebase Error Matches:', err));
    const unsubChat = onSnapshot(query(collection(db, "chat"), orderBy("createdAt", "asc")), (snap) => setChatMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (err) => console.error('Firebase Error Chat:', err));
    const unsubConfig = onSnapshot(doc(db, "settings", "appConfig"), (snap) => {
      if(snap.exists()) {
        setDeadline(snap.data().deadline?.toDate());
        if (snap.data().adminFee != null) setAdminFee(snap.data().adminFee);
      }
    }, (err) => console.error('Firebase Error Config:', err));
    const unsubHof = onSnapshot(query(collection(db, "hallOfFame"), orderBy("year", "desc")), (snap) => {
      setHallOfFame(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Firebase Error HallOfFame:', err));
    return () => { unsubTips(); unsubMatches(); unsubChat(); unsubConfig(); unsubHof(); };
  }, []);

  // --- SESSION LOGIC ---
  useEffect(() => {
    const sessionData = localStorage.getItem('vmt_login_session');
    if (sessionData) setCurrentUser(JSON.parse(sessionData));
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

  const checkExistingUser = () => {
    const existing = tips.find(t => t.email.toLowerCase() === regEmail.toLowerCase().trim());
    if(existing) {
       setRegName(existing.name);
       setRegGoals(existing.goals);
       setRegPicks(existing.predictions || {});
       alert("Välkommen tillbaka! Ditt tidigare tips har laddats in.");
    }
    setRegStep(2);
  };

  // --- CALCULATIONS ---
  const activeUser = useMemo(() => currentUser ? tips.find(t => t.id === currentUser.id) || currentUser : null, [currentUser, tips]);
  const activePlayers = useMemo(() => tips.filter(t => t.isApproved && !t.isAdmin), [tips]);
  const goalsSoFar = useMemo(() => matches.reduce((sum, m) => sum + (m.goals1 || 0) + (m.goals2 || 0), 0), [matches]);
  const get1X2 = (g1, g2) => { if (g1 === null || g2 === null) return null; return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X'; };
  const isDeadlinePassed = deadline && new Date() > deadline;

  // --- DAILY RANK NOTIFICATION ---
  useEffect(() => {
    if (activeUser && leaderboard && leaderboard.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      if (activeUser.lastLoginDate !== today) {
        const userRank = leaderboard.find(u => u.id === activeUser.id)?.rank;
        if (userRank) {
           const notifs = activeUser.notifications || [];
           notifs.unshift({ id: Date.now().toString(), type: 'rank', text: `Dagens uppdatering: Du ligger just nu på plats #${userRank}`, isRead: false, createdAt: new Date().toISOString() });
           updateDoc(doc(db, "tips", activeUser.id), { notifications: notifs, lastLoginDate: today });
        }
      }
    }
  }, [activeUser?.id, activeUser?.lastLoginDate, tips.length]); 

  const folketsTips = useMemo(() => {
    const predictions = {};
    matches.forEach(m => {
      let counts = { '1': 0, 'X': 0, '2': 0 };
      activePlayers.forEach(p => {
        if (p.predictions?.[m.id]) counts[p.predictions[m.id]]++;
      });
      const max = Math.max(counts['1'], counts['X'], counts['2']);
      if (max > 0) {
        if (counts['1'] === max) predictions[m.id] = '1';
        else if (counts['2'] === max) predictions[m.id] = '2';
        else predictions[m.id] = 'X';
      } else {
        predictions[m.id] = '-';
      }
    });
    return predictions;
  }, [activePlayers, matches]);

  const groupStandings = useMemo(() => {
    const stats = {};
    const forecastTeams = new Set();
    Object.keys(TEAMS).forEach(name => { stats[name] = { name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0, group: "", hasForecast: false }; });
    matches.forEach(m => {
      if (stats[m.team1]) stats[m.team1].group = m.group; if (stats[m.team2]) stats[m.team2].group = m.group;
      let g1, g2, isPlayed = false, isForecast = false;
      if (folketsTipsMode === 1) {
          const p = folketsTips[m.id];
          if (p === '1') { g1 = 1; g2 = 0; isPlayed = true; isForecast = true; }
          else if (p === '2') { g1 = 0; g2 = 1; isPlayed = true; isForecast = true; }
          else if (p === 'X') { g1 = 0; g2 = 0; isPlayed = true; isForecast = true; }
      } else if (folketsTipsMode === 2) {
          if (m.status === 'finished') { g1 = m.goals1 || 0; g2 = m.goals2 || 0; isPlayed = true; }
          else { const p = folketsTips[m.id]; if (p === '1') { g1=1; g2=0; isPlayed=true; isForecast=true; } else if (p === '2') { g1=0; g2=1; isPlayed=true; isForecast=true; } else if (p === 'X') { g1=0; g2=0; isPlayed=true; isForecast=true; } }
      } else if (m.status === 'finished') {
          g1 = m.goals1 || 0; g2 = m.goals2 || 0; isPlayed = true;
      }
      if (isPlayed) {
        if (isForecast) { forecastTeams.add(m.team1); forecastTeams.add(m.team2); }
        if (stats[m.team1]) {
          stats[m.team1].played++;
          stats[m.team1].gf += g1;
          stats[m.team1].ga += g2;
          stats[m.team1].gd = stats[m.team1].gf - stats[m.team1].ga;
          if (g1 > g2) stats[m.team1].pts += 3;
          else if (g1 === g2) stats[m.team1].pts += 1;
        }
        if (stats[m.team2]) {
          stats[m.team2].played++;
          stats[m.team2].gf += g2;
          stats[m.team2].ga += g1;
          stats[m.team2].gd = stats[m.team2].gf - stats[m.team2].ga;
          if (g2 > g1) stats[m.team2].pts += 3;
          else if (g1 === g2) stats[m.team2].pts += 1;
        }
      }
    });
    if (folketsTipsMode === 2) forecastTeams.forEach(name => { if (stats[name]) stats[name].hasForecast = true; });
    return stats;
  }, [matches, folketsTipsMode, folketsTips]);

  const leaderboard = useMemo(() => {
    return activePlayers.map(u => {
      let pts = 0;
      matches.forEach(m => { if (get1X2(m.goals1, m.goals2) === u.predictions?.[m.id]) pts++; });
      return { ...u, pts, diff: Math.abs((parseInt(u.goals) || 0) - goalsSoFar) };
    }).sort((a, b) => b.pts - a.pts || a.diff - b.diff).map((u, i) => ({ ...u, rank: i + 1 }));
  }, [activePlayers, matches, goalsSoFar]);

  const optimist = useMemo(() => {
    if (!activePlayers.length) return null;
    return activePlayers.reduce((max, u) => (!max || (parseInt(u.goals) || 0) > (parseInt(max.goals) || 0)) ? u : max, null);
  }, [activePlayers]);
  const pessimist = useMemo(() => {
    if (!activePlayers.length) return null;
    return activePlayers.reduce((min, u) => (!min || (parseInt(u.goals) || 0) < (parseInt(min.goals) || 0)) ? u : min, null);
  }, [activePlayers]);

  const uniqueTips = useMemo(() => {
    const flags = {};
    matches.forEach(m => {
      const counts = { '1': [], 'X': [], '2': [] };
      activePlayers.forEach(p => {
        const pick = p.predictions?.[m.id];
        if (pick) counts[pick].push(p.name.split(' ')[0]);
      });
      ['1','X','2'].forEach(sign => {
        if (counts[sign].length > 0 && counts[sign].length < 3) {
          if (!flags[m.id]) flags[m.id] = [];
          flags[m.id].push({ sign, names: counts[sign] });
        }
      });
    });
    return flags;
  }, [activePlayers, matches]);

  const folketsLeader = useMemo(() => {
    if (!activePlayers.length) return null;
    const simulated = activePlayers.map(u => {
      let pts = 0;
      matches.forEach(m => {
        const folkSign = folketsTips[m.id];
        if (folkSign && folkSign !== '-' && u.predictions?.[m.id] === folkSign) pts++;
      });
      return { ...u, pts };
    }).sort((a, b) => b.pts - a.pts);
    return simulated[0] || null;
  }, [activePlayers, matches, folketsTips]);

  const prizePool = useMemo(() => {
    const n = activePlayers.length;
    const totalPool = n * 100;
    const netPool = Math.max(0, totalPool - adminFee);
    if (netPool === 0) return { totalPool, netPool, first: 0, second: 0, third: 0 };
    if (n > 20) {
      const third = 100;
      const rem = netPool - third;
      const secondRaw = Math.round((rem * 0.30) / 100) * 100;
      const second = secondRaw;
      const first = netPool - second - third; 
      return { totalPool, netPool, first: Math.max(0, first), second, third };
    } else {
      const secondRaw = Math.round((netPool * 0.30) / 100) * 100;
      const second = secondRaw;
      const first = netPool - second; 
      return { totalPool, netPool, first: Math.max(0, first), second, third: 0 };
    }
  }, [activePlayers.length, adminFee]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail.toLowerCase().trim() === 'zettergren.emil@gmail.com' && loginPassword === 'TELE1fon') {
      const adminUser = tips.find(t => t.email.toLowerCase() === 'zettergren.emil@gmail.com') || { id: 'admin', name: 'Emil Zettergren', email: 'zettergren.emil@gmail.com', isAdmin: true, isApproved: true, predictions: {} };
      const userObj = { ...adminUser, isAdmin: true };
      setCurrentUser(userObj);
      localStorage.setItem('vmt_login_session', JSON.stringify(userObj));
      setActiveTab('admin');
      return;
    }
    const user = tips.find(t => t.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!user) return setAuthError("E-post ej hittad.");
    if (user.isAdmin && loginPassword !== user.password) return setAuthError("Fel lösenord.");
    if (!user.isApproved && !user.isAdmin) return setAuthError("Väntar på godkännande.");
    setCurrentUser(user);
    localStorage.setItem('vmt_login_session', JSON.stringify(user));
    if(user.isAdmin) setActiveTab('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vmt_login_session');
  };

  const submitTips = async () => {
    try {
      if(!editingParticipantId && isDeadlinePassed) return alert("Deadline har passerat!");
      const id = editingParticipantId || (regEmail ? regEmail.toLowerCase().trim() : '');
      if(!id) return alert("Kunde inte hitta ID eller e-post.");

      await setDoc(doc(db, "tips", id), { 
        name: regName || 'Okänd', 
        email: regEmail ? regEmail.toLowerCase().trim() : id, 
        goals: parseInt(regGoals) || 0, 
        predictions: regPicks || {}, 
        isApproved: editingParticipantId ? true : false, 
        isAdmin: false, 
        groups: ["Alla"] 
      }, { merge: true });

      alert(editingParticipantId ? "Deltagare uppdaterad!" : "Tips sparat/uppdaterat! Emil godkänner när betalning syns.");
      localStorage.removeItem('vmt_draft_v3'); 
      setShowRegister(false);
      setEditingParticipantId(null);
    } catch (e) {
      console.error("Fel vid sparning:", e);
      alert("Databasfel kunde inte spara: " + e.message);
    }
  };

  const startEditing = (p) => {
    setEditingUserId(p.id);
    setEditingParticipantId(p.id);
    setRegName(p.name);
    setRegEmail(p.email || p.id);
    setRegGoals(p.goals || '');
    setRegPicks(p.predictions || {});
    setIsEditing(true);
  };

  const deleteParticipant = async (id) => {
    if(window.confirm('Är du säker på att du vill ta bort denna deltagare?')) {
      await deleteDoc(doc(db, "tips", id));
    }
  };

  const sendChat = async (e) => {
    e.preventDefault(); if(!newChatMsg.trim()) return;
    await addDoc(collection(db, "chat"), { user: currentUser.name, text: newChatMsg, createdAt: serverTimestamp() });
    
    activePlayers.forEach(p => {
      const firstName = p.name.split(' ')[0].toLowerCase();
      if (newChatMsg.toLowerCase().includes(`@${firstName}`) || newChatMsg.toLowerCase().includes(`@${p.name.toLowerCase()}`)) {
        if (p.id !== currentUser.id) {
          const notifs = p.notifications || [];
          notifs.unshift({ id: Date.now().toString() + Math.random(), type: 'mention', text: `${currentUser.name} har nämnt dig i Snackis`, isRead: false, createdAt: new Date().toISOString() });
          updateDoc(doc(db, "tips", p.id), { notifications: notifs });
        }
      }
    });
    setNewChatMsg('');
  };

  const updateMatch = async (id, data) => {
    await setDoc(doc(db, "matches", id.toString()), data, { merge: true });
  };

  const navigateTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  if (!currentUser) return (
    <div className="min-h-screen bg-vmdark text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl z-10">
        <Logo />
        {!showRegister && timeLeft && <div className="mt-4 mb-2 p-3 bg-vmdark/50 backdrop-blur-sm border border-vmgold/20 text-vmgold text-xs font-black rounded-2xl uppercase tracking-widest text-center shadow-lg animate-pulse">{timeLeft}</div>}
        {!showRegister ? (
          <form onSubmit={handleLogin} className="mt-10 space-y-4">
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Din e-post" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />
            {loginEmail.toLowerCase() === 'zettergren.emil@gmail.com' && <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Lösenord" className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none" required />}
            {authError && <p className="text-red-400 text-xs font-bold text-center">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-black shadow-lg">LOGGA IN</button>
            {!isDeadlinePassed && <button type="button" onClick={() => setShowRegister(true)} className="w-full text-emerald-400 font-bold text-sm">LÄMNA NYTT TIPS {Object.keys(regPicks).length > 0 && " (Utkast finns)"}</button>}
            {isDeadlinePassed && <p className="text-center text-xs text-slate-500 font-bold italic">Anmälan stängd</p>}
          </form>
        ) : (
          <div className="mt-8 space-y-4 animate-in slide-in-from-right-4 duration-300">
             {regStep === 1 ? (
               <>
                <div className="flex justify-between items-center mb-2"><h2 className="font-bold">{editingParticipantId ? 'Redigera Deltagare' : '1. Dina Uppgifter'}</h2><button onClick={() => { setShowRegister(false); setEditingParticipantId(null); }}><X/></button></div>
                <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Namn" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="E-post" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <input type="number" value={regGoals} onChange={e=>setRegGoals(e.target.value)} placeholder="Mål totalt i hela VM?" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none" />
                <div className="flex gap-2">
                   {Object.keys(regPicks).length > 0 && <button onClick={clearDraft} className="p-4 bg-red-500/20 text-red-400 rounded-2xl"><Trash2/></button>}
                   <button onClick={checkExistingUser} className="flex-1 py-4 bg-emerald-600 rounded-xl font-bold">NÄSTA: FYLL I TIPS</button>
                </div>
               </>
             ) : (
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><button onClick={() => setRegStep(1)} className="text-xs text-slate-400">← Bakåt</button><span className="text-vmgold text-xs font-black">{Object.keys(regPicks).length}/72 tippade</span></div>
                  <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 no-scrollbar relative">
                    {timeLeft && <div className="sticky top-0 z-50 bg-vmdark/95 backdrop-blur-md p-4 mb-4 -mx-2 rounded-b-3xl text-vmgold text-xs font-black text-center shadow-xl border-b border-vmgold/20 animate-pulse">{timeLeft}</div>}
                    {initialMatchesList.map(m => (
                      <div key={m.id} className="bg-black/30 p-5 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex flex-col items-center gap-1">
                           <div className="flex items-center gap-1 text-vmgold font-black text-xs tracking-wider">
                               <Clock size={11}/> {m.date}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                               <MapPin size={10}/> {m.arena}, {m.city} | <TvBadge tv={m.tv} />
                           </div>
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
                              if(isWhite) cl += " text-slate-900 border border-slate-200 shadow-sm";
                            }
                            return (
                              <button key={s} onClick={() => setRegPicks(prev => ({...prev, [m.id]: prev[m.id] === s ? null : s}))} style={style} className={`flex-1 py-4 rounded-2xl font-black transition-all duration-300 ${cl}`}>{s}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitTips} disabled={Object.keys(regPicks).length < 72 || isDeadlinePassed} className="w-full py-5 bg-indigo-600 disabled:opacity-30 rounded-2xl font-black shadow-[0_10px_20px_rgba(79,70,229,0.3)] mt-2">
                    {isDeadlinePassed ? 'DEADLINE PASSERAD' : 'SKICKA IN ANMÄLAN'}
                  </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-vmdark/95 backdrop-blur-md text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-xl">
        <div className="scale-75 origin-left">
          <Logo />
          {timeLeft && <div className="mt-1 px-2 py-0.5 bg-vmgold/10 text-vmgold text-[8px] font-black rounded-full uppercase tracking-widest text-center animate-pulse">{timeLeft}</div>}
        </div>
        <div className="flex items-center gap-4 relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Bell size={20} />
            {activeUser?.notifications?.filter(n => !n.isRead).length > 0 && (
               <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-vmdark"></span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in slide-in-from-top-2">
              <div className="bg-slate-50 p-3 border-b font-black text-xs text-slate-400 uppercase tracking-wider">Notiser</div>
              <div className="max-h-64 overflow-y-auto no-scrollbar">
                {activeUser?.notifications?.length > 0 ? activeUser.notifications.map((n, i) => (
                  <div key={n.id || i} onClick={() => {
                     const newNotifs = [...(activeUser.notifications)];
                     newNotifs[i].isRead = true;
                     updateDoc(doc(db, "tips", activeUser.id), { notifications: newNotifs });
                     setShowNotifications(false);
                     if (n.type === 'rank') navigateTab('leaderboard');
                     if (n.type === 'mention') navigateTab('chat');
                  }} className={`p-4 border-b cursor-pointer transition-colors flex items-start gap-3 ${n.isRead ? 'opacity-60 bg-white hover:bg-slate-50' : 'bg-indigo-50/30 hover:bg-indigo-50/50'}`}>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>}
                    <div className={`text-sm ${n.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>{n.text}</div>
                  </div>
                )) : <div className="p-4 text-center text-sm text-slate-400 font-bold">Inga notiser</div>}
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" title="Logga ut"><LogOut size={20}/></button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t z-40 flex justify-around p-1 sm:sticky sm:top-[72px] sm:max-w-5xl sm:mx-auto sm:my-4 sm:rounded-3xl sm:border shadow-xl">
        <button onClick={() => navigateTab('leaderboard')} className={`p-4 transition-colors ${activeTab==='leaderboard'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><Trophy/></button>
        <button onClick={() => navigateTab('groups')} className={`p-4 transition-colors ${activeTab==='groups'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><ListOrdered/></button>
        <button onClick={() => navigateTab('h2h')} className={`p-4 transition-colors ${activeTab==='h2h'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><Swords/></button>
        <button onClick={() => navigateTab('chat')} className={`p-4 transition-colors ${activeTab==='chat'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><MessageSquare/></button>
        <button onClick={() => navigateTab('matches')} className={`p-4 transition-colors ${activeTab==='matches'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><CalendarDays/></button>
        <button onClick={() => navigateTab('hof')} className={`p-4 transition-colors ${activeTab==='hof'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><History/></button>
        {currentUser.isAdmin && <button onClick={() => navigateTab('admin')} className={`p-4 transition-colors ${activeTab==='admin'?'text-indigo-600':'text-slate-300 hover:text-slate-400'}`}><Settings/></button>}
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* PRISPOTT */}
             <div className="bg-vmdark text-white rounded-[2rem] shadow-xl overflow-hidden">
               <button onClick={() => setIsPrizeExpanded(!isPrizeExpanded)} className="w-full p-6 flex justify-between items-center">
                 <h3 className="font-black text-xs uppercase tracking-widest text-vmgold flex items-center gap-2"><Trophy size={14}/> Prispott &mdash; {prizePool.netPool} kr netto ({prizePool.totalPool} kr - {adminFee} kr)</h3>
                 {isPrizeExpanded ? <ChevronUp size={16} className="text-vmgold"/> : <ChevronDown size={16} className="text-vmgold"/>}
               </button>
               {isPrizeExpanded && (
                 <div className="grid grid-cols-3 gap-3 px-6 pb-6">
                   {[
                     {prize: prizePool.first + ' kr', color: '#fbbf24', label: '1:a'},
                     {prize: prizePool.second + ' kr', color: '#94a3b8', label: '2:a'},
                     {prize: prizePool.third + ' kr', color: '#b45309', label: '3:e'},
                   ].map(({prize, color, label}, i) => {
                     const rankUser = leaderboard[i];
                     return (
                       <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                         <Award size={24} style={{color}} className="mx-auto mb-1"/>
                         <div className="font-black text-sm">{prize}</div>
                         <div className="text-[10px] text-slate-400 font-bold mt-1 truncate">{rankUser?.name?.split(' ')[0] || '?'}</div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>

             {/* STATS WIDGETS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Goal size={24}/></div>
                  <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimist</div><div className="font-black text-sm">{optimist?.name?.split(' ')[0]} ({optimist?.goals} mål)</div></div>
                </div>
                <div className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><ShieldCheck size={24}/></div>
                  <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessimist</div><div className="font-black text-sm">{pessimist?.name?.split(' ')[0]} ({pessimist?.goals} mål)</div></div>
                </div>
                <div className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Users size={24}/></div>
                  <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folkets Ledare</div><div className="font-black text-sm">{folketsLeader?.name?.split(' ')[0]}</div></div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[70vh]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-40 bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400">
                      <tr>
                        <th className="p-5">Rank</th>
                        <th className="p-5">Namn</th>
                        <th className="p-5 text-center">P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leaderboard.map(u => (
                        <tr key={u.id} className="hover:bg-indigo-50/50 transition-colors">
                          <td className="p-5 font-black text-slate-300">#{u.rank}</td>
                          <td className="p-5 font-bold cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedUser(u)}>
                            <span className="flex items-center gap-1.5">{u.name}{hallOfFame.some(h => h.champion.toLowerCase() === u.name.toLowerCase()) && <span title="Tidigare mästare" className="text-vmgold"><Star size={12} fill="#fbbf24"/></span>}</span>
                          </td>
                          <td className="p-5 text-center font-black text-indigo-600 bg-indigo-50/20">{u.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* TIPPNINGSMATRIS */}
             {activePlayers.length > 0 && (() => {
               const sortedPlayers = [...activePlayers].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
               const lastPlayedMatch = matches.filter(m => m.status === 'finished' || m.status === 'live').pop();
               return (
                 <div className="rounded-[2rem] border bg-white shadow-xl overflow-hidden">
                   <div className="p-4 border-b flex items-center justify-between">
                     <h3 className="font-black text-sm flex items-center gap-2"><Grid3X3 size={16} className="text-indigo-600"/> Tippningsmatris</h3>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedPlayers.length} spelare &middot; {matches.length} matcher</span>
                   </div>
                   <div className="overflow-auto max-h-[75vh] no-scrollbar relative">
                     <table className="text-xs text-left" style={{borderCollapse:'separate', borderSpacing:0}}>
                       <thead className="text-[10px] uppercase text-slate-400">
                         <tr>
                           <th className="sticky top-0 left-0 z-50 bg-vmdark text-vmgold p-4 border-r border-b whitespace-nowrap font-black">Match</th>
                           {sortedPlayers.map(p => (
                             <th key={p.id} className="sticky top-0 z-40 bg-vmdark text-white p-3 border-r border-b whitespace-nowrap text-center font-black min-w-[60px]">
                               {p.name.split(' ')[0]}
                             </th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {matches.map(m => {
                           const actual = get1X2(m.goals1, m.goals2);
                           const isFinished = m.status === 'finished' || m.status === 'live';
                           const isLastPlayed = m.id === lastPlayedMatch?.id;
                           const matchCellClass = `sticky left-0 z-30 border-r border-b p-3 whitespace-nowrap shadow-[4px_0_10px_rgba(0,0,0,0.04)] ${isLastPlayed ? 'bg-vmgold/10 border-l-4 border-l-vmgold' : 'bg-white'}`;
                           return (
                             <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className={matchCellClass}>
                                 <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-black text-slate-300 w-5 shrink-0">#{m.id}</span>
                                   <Flag code={TEAMS[m.team1]?.flag}/>
                                   <span className="font-bold" style={{color: TEAMS[m.team1]?.primary === '#FFFFFF' ? '#334155' : TEAMS[m.team1]?.primary}}>{m.team1}</span>
                                   {isFinished && <span className="text-[10px] font-black text-slate-500 mx-1">{m.goals1}-{m.goals2}</span>}
                                   <Flag code={TEAMS[m.team2]?.flag}/>
                                   <span className="font-bold" style={{color: TEAMS[m.team2]?.primary === '#FFFFFF' ? '#334155' : TEAMS[m.team2]?.primary}}>{m.team2}</span>
                                 </div>
                               </td>
                               {sortedPlayers.map(p => {
                                 const pick = p.predictions?.[m.id];
                                 const isCorrect = isFinished && actual && pick === actual;
                                 const isWrong = isFinished && actual && pick && pick !== actual;
                                 let bg = 'transparent';
                                 let textCl = 'text-slate-400';
                                 if (isCorrect) {
                                   bg = pick === '1' ? (TEAMS[m.team1]?.primary || '#4f46e5') : pick === '2' ? (TEAMS[m.team2]?.primary || '#4f46e5') : '#64748b';
                                   if (bg === '#FFFFFF') bg = '#64748b';
                                   textCl = 'text-white';
                                 } else if (isWrong) {
                                   textCl = 'text-red-300';
                                 }
                                 return (
                                   <td key={p.id} className={`border-r border-b p-3 text-center font-black transition-colors ${isWrong ? 'opacity-50' : ''}`} style={{backgroundColor: bg}}>
                                     <span className={textCl}>{pick || <span className="text-slate-200">—</span>}</span>
                                   </td>
                                 );
                               })}
                             </tr>
                           );
                         })}
                       </tbody>
                       <tfoot>
                         <tr>
                           <td className="sticky bottom-0 left-0 z-50 bg-vmdark text-vmgold p-4 border-r border-t border-vmgold/20 font-black uppercase text-[10px] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">TOTALT RÄTT</td>
                           {sortedPlayers.map(p => {
                              const pPts = leaderboard.find(l => l.id === p.id)?.pts || 0;
                              return (
                                <td key={p.id} className="sticky bottom-0 z-40 bg-vmdark text-white p-3 border-r border-t border-white/10 text-center font-black text-sm shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                                  {pPts}
                                </td>
                              );
                           })}
                         </tr>
                       </tfoot>
                     </table>
                   </div>
                 </div>
               );
             })()}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="sticky top-[72px] z-30 bg-slate-50/95 backdrop-blur-sm py-2 px-2 -mx-2 flex flex-col gap-2">
               <div className="flex justify-between items-center">
                 <h2 className="font-black text-xl">Gruppspel</h2>
                 <div className="flex rounded-xl border bg-white overflow-hidden shadow-sm">
                   {[{label:'Verkliga', val:0},{label:'Folkets', val:1},{label:'Kombo', val:2}].map(({label, val}) => (
                     <button key={val} onClick={() => setFolketsTipsMode(val)} className={`px-3 py-2 text-xs font-black transition-all flex items-center gap-1 ${folketsTipsMode === val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                       {val === 1 && <Users size={10}/>} {label}
                     </button>
                   ))}
                 </div>
               </div>
               {folketsTipsMode === 2 && (
                 <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1"><Users size={10}/> Visar verkliga resultat + folkets tips för kommande matcher. <span className="text-indigo-400 font-medium">Indigo-färg = prognos.</span></p>
               )}
             </div>
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {TOURNAMENT_GROUPS.map(grp => (
                 <div key={grp} className="bg-white/90 backdrop-blur-md rounded-[2rem] border shadow-sm overflow-hidden">
                    <div className="bg-vmdark p-4 text-vmgold font-black text-center text-sm tracking-widest uppercase">GRUPP {grp}</div>
                    <table className="w-full text-left text-xs">
                       <thead><tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase"><th className="p-3">Lag</th><th className="p-3 text-center">+/-</th><th className="p-3 text-center">P</th></tr></thead>
                       <tbody>{Object.values(groupStandings).filter(t => t.group === grp).sort((a,b) => b.pts - a.pts || b.gd - a.gd).map(t => {
                         const isForecast = folketsTipsMode === 2 && t.hasForecast;
                         return (
                           <tr key={t.name} className="border-b hover:bg-slate-50 transition-colors">
                             <td className="p-3 font-bold flex items-center gap-2">
                               <Flag code={TEAMS[t.name]?.flag} />
                               {t.name}
                               {isForecast && <Users size={10} className="text-indigo-500 ml-1 opacity-70"/>}
                             </td>
                             <td className={`p-3 text-center font-medium ${isForecast ? 'text-indigo-600' : ''}`}>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                             <td className={`p-3 text-center font-black bg-indigo-50/30 ${isForecast ? 'text-indigo-600' : 'text-slate-700'}`}>{t.pts}</td>
                           </tr>
                         );
                       })}</tbody>
                    </table>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border p-6 shadow-sm min-h-[60vh] animate-in fade-in duration-300">
            <h2 className="font-black text-xl mb-6 flex items-center gap-2"><Swords className="text-indigo-600"/> Head 2 Head</h2>
            <div className="flex gap-4 mb-4">
              <select className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-indigo-400 transition-colors" value={h2hUser1} onChange={e => setH2hUser1(e.target.value)}>
                <option value="">Välj Spelare 1...</option>
                {activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex items-center font-black text-slate-300">VS</div>
              <select className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-indigo-400 transition-colors" value={h2hUser2} onChange={e => setH2hUser2(e.target.value)}>
                <option value="">Välj Spelare 2...</option>
                {activePlayers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {h2hUser1 && h2hUser2 && (() => {
              const u1 = activePlayers.find(u => u.id === h2hUser1);
              const u2 = activePlayers.find(u => u.id === h2hUser2);
              const u1pts = matches.filter(m => get1X2(m.goals1,m.goals2) === u1?.predictions?.[m.id]).length;
              const u2pts = matches.filter(m => get1X2(m.goals1,m.goals2) === u2?.predictions?.[m.id]).length;
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 rounded-2xl p-4 text-center"><div className="font-black text-lg">{u1?.name?.split(' ')[0]}</div><div className="text-indigo-600 font-black text-2xl">{u1pts}</div><div className="text-xs text-slate-400 font-bold">rätta tips</div></div>
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center"><div className="font-black text-lg">{u2?.name?.split(' ')[0]}</div><div className="text-emerald-600 font-black text-2xl">{u2pts}</div><div className="text-xs text-slate-400 font-bold">rätta tips</div></div>
                  </div>
                  <div className="space-y-2">
                    {matches.map(m => {
                      const p1 = u1?.predictions?.[m.id];
                      const p2 = u2?.predictions?.[m.id];
                      const diff = p1 && p2 && p1 !== p2;
                      return (
                        <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${diff ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white'}`}>
                          <div className={`w-8 font-black text-center ${diff ? 'text-amber-600' : 'text-slate-600'}`}>{p1 || '-'}</div>
                          <div className="flex items-center gap-3 flex-1 justify-center opacity-80">
                            <span className="text-xs font-bold text-right w-20">{m.team1}</span>
                            <span className="text-[10px] text-slate-300">vs</span>
                            <span className="text-xs font-bold w-20">{m.team2}</span>
                          </div>
                          <div className={`w-8 font-black text-center ${diff ? 'text-amber-600' : 'text-slate-600'}`}>{p2 || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'matches' && (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
              {matches.map(m => {
                 const fact = MATCH_FACTS[m.id];
                 const totalTips = activePlayers.filter(p => p.predictions?.[m.id]).length;
                 const counts = { '1': 0, 'X': 0, '2': 0 };
                 activePlayers.forEach(p => { if (p.predictions?.[m.id]) counts[p.predictions[m.id]]++; });
                 const maxSign = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '1');
                 const maxPct = totalTips ? Math.round((counts[maxSign] / totalTips) * 100) : 0;
                 const actual = get1X2(m.goals1, m.goals2);
                 const actualPct = (totalTips && actual && counts[actual]) ? Math.round((counts[actual] / totalTips) * 100) : 0;
                 return (
                 <div key={m.id} className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border shadow-sm space-y-3 relative overflow-hidden">
                    {m.status === 'live' && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"/>
                        {m.minute && <span className="text-red-500 font-black text-[10px]">{m.minute}'</span>}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span>{m.date} | Grupp {m.group}</span>
                       <TvBadge tv={m.tv} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-2 flex-1"><Flag code={TEAMS[m.team1]?.flag} /><span className="text-sm font-black">{m.team1}</span></div>
                       <div className="flex flex-col items-center gap-0.5">
                         <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border">
                            <span className="font-black text-lg">{m.goals1 ?? '-'}</span>
                            <span className="text-slate-300">:</span>
                            <span className="font-black text-lg">{m.goals2 ?? '-'}</span>
                         </div>
                         {m.goals1 == null && (folketsTipsMode === 1 || (folketsTipsMode === 2 && m.status !== 'finished')) && (
                           <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase"><Users size={9}/> Folkets</div>
                         )}
                       </div>
                       <div className="flex items-center gap-2 flex-1 justify-end"><span className="text-sm font-black text-right">{m.team2}</span><Flag code={TEAMS[m.team2]?.flag} /></div>
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><MapPin size={10}/> {m.arena}, {m.city}</div>
                    {uniqueTips[m.id] && (
                       <div className="flex flex-wrap gap-1 mt-2">
                         {uniqueTips[m.id].map((f, i) => (
                           <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black rounded-full uppercase border border-indigo-100">{f.names.join(', ')} är ensam om {f.sign}!</span>
                         ))}
                       </div>
                    )}
                    {fact && (
                      <div className="mt-4 bg-slate-50/80 rounded-xl border border-slate-100 overflow-hidden text-center shadow-sm">
                        <div className="p-3 text-[10px] font-medium text-slate-600 border-b border-slate-100 leading-relaxed">
                           💡 <i>{fact}</i>
                        </div>
                        {totalTips > 0 && (
                          <div className="p-2.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            {m.status === 'finished' ? (
                               actualPct < 20 ? <span className="text-red-500">🚨 SKRÄLL! Endast {actualPct}% trodde på detta!</span> :
                               actualPct > 75 ? <span className="text-emerald-600">✅ Favoritseger! Hela {actualPct}% hade rätt.</span> :
                               <span className="text-slate-500">Tippades av {actualPct}% av spelarna.</span>
                            ) : (
                               maxPct > 75 ? <span className="text-indigo-600">🔥 {maxPct}% tror på {maxSign === '1' ? m.team1 : maxSign === '2' ? m.team2 : 'Kryss'}!</span> :
                               maxPct < 45 ? <span className="text-amber-600">⚖️ Rysare! Publiken är helt oense.</span> :
                               <span className="text-slate-500">Mest tippad: {maxSign} ({maxPct}%)</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                 </div>
                 );
              })}
           </div>
        )}

        {activeTab === 'hof' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-vmdark text-white rounded-[2rem] p-8 shadow-xl text-center">
              <Trophy size={48} className="text-vmgold mx-auto mb-4 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"/>
              <h2 className="font-black text-3xl italic tracking-tight">Hall of Fame</h2>
              <p className="text-slate-400 text-sm mt-2 font-bold">Soffcoachernas Tipsliga — Tidigare Mästare</p>
            </div>
            {hallOfFame.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border p-12 text-center text-slate-400 font-bold shadow-sm">
                <History size={40} className="mx-auto mb-4 opacity-30"/>
                <p>Inga mästare registrerade ännu.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hallOfFame.map((entry, idx) => {
                  const isActive = activePlayers.some(p => p.name.toLowerCase() === entry.champion.toLowerCase());
                  const isLatest = idx === 0;
                  return (
                    <div key={entry.id} className={`rounded-[2rem] border p-6 shadow-sm flex flex-col items-center text-center transition-all ${isLatest ? 'bg-vmdark text-white border-vmgold/30 shadow-[0_0_30px_rgba(251,191,36,0.1)]' : 'bg-white/90 backdrop-blur-md'}`}>
                      <div className={`text-5xl font-black italic mb-1 ${isLatest ? 'text-vmgold' : 'text-slate-200'}`}>
                        <span className={entry.type === 'EM' ? 'text-indigo-400' : 'text-vmgold'}>{entry.type || 'VM'}</span> {entry.year}
                      </div>
                      <Trophy size={isLatest ? 32 : 20} className={isLatest ? 'text-vmgold drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] mb-2' : 'text-slate-300 mb-2'}/>
                      <div className={`font-black text-lg ${isLatest ? 'text-white' : 'text-slate-800'}`}>{entry.champion}</div>
                      {isLatest && <span className="mt-2 px-3 py-1 bg-vmgold/20 text-vmgold text-[10px] font-black rounded-full uppercase tracking-widest border border-vmgold/30">Regerande Mästare</span>}
                      {isActive && !isLatest && <span className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100">Aktiv deltagare</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border shadow-xl flex flex-col h-[70vh] animate-in fade-in duration-300 overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <h2 className="font-black text-xl flex items-center gap-2"><MessageSquare className="text-indigo-600"/> Snackis</h2>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{chatMessages.length} Meddelanden</div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
                {chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex flex-col ${msg.user === currentUser.name ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] font-black text-slate-400 mb-1 ml-2 mr-2 uppercase tracking-tighter flex items-center gap-1.5">
                      {msg.user}
                      {msg.user === 'Emil Zettergren' && <span className="bg-vmgold/20 text-vmgold px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest">ADMIN</span>}
                    </div>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${msg.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-800'}`}>
                      {msg.text.split(/(@[a-zA-ZåäöÅÄÖ\w-]+)/g).map((part, i) => {
                         if (part.startsWith('@')) {
                           const name = part.substring(1).toLowerCase();
                           const isReal = activePlayers.some(p => p.name.toLowerCase().startsWith(name));
                           if (isReal) return <span key={i} className="text-blue-400 font-bold underline cursor-pointer">{part}</span>;
                         }
                         return part;
                      })}
                    </div>
                  </div>
                ))}
             </div>
             <form onSubmit={sendChat} className="p-6 bg-white border-t space-y-3">
                <div className="flex items-center gap-1.5 ml-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Tippar som {currentUser.name}</span>
                   {currentUser.name === 'Emil Zettergren' && <span className="bg-vmgold/20 text-vmgold px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest">ADMIN</span>}
                </div>
                <div className="relative w-full">
                  <div aria-hidden="true" className="absolute inset-0 p-4 rounded-2xl text-sm pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-transparent">
                    {newChatMsg.split(/(@[a-zA-ZåäöÅÄÖ\w-]+(?:\s[a-zA-ZåäöÅÄÖ\w-]+)?)/g).map((part, i) => {
                      const isTag = part.startsWith('@') && activePlayers.some(p => part.substring(1).toLowerCase() === p.name.toLowerCase() || part.substring(1).toLowerCase() === p.name.split(' ')[0].toLowerCase());
                      return <span key={i} style={isTag ? {color:'#3b82f6', fontWeight:700, textShadow:'0 0 0 #3b82f6'} : {color:'transparent'}}>{part}</span>;
                    })}
                  </div>
                  <input id="chat-input" value={newChatMsg} onChange={e => {
                    const val = e.target.value;
                    setNewChatMsg(val);
                    const lastAt = val.lastIndexOf('@');
                    if (lastAt !== -1 && !val.substring(lastAt).includes(' ')) {
                      setShowMentions(true);
                      setMentionSearch(val.substring(lastAt + 1));
                    } else {
                      setShowMentions(false);
                    }
                  }} placeholder="Skriv nåt till gruppen..." className="relative w-full bg-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" style={{background:'transparent', caretColor:'#0f172a'}} />
                </div>
                {showMentions && (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                     {activePlayers.filter(p => p.name.toLowerCase().includes(mentionSearch.toLowerCase())).map(p => (
                       <button key={p.id} type="button" onClick={() => {
                         const val = newChatMsg.substring(0, newChatMsg.lastIndexOf('@')) + '@' + p.name + ' ';
                         setNewChatMsg(val);
                         setShowMentions(false);
                         document.getElementById('chat-input').focus();
                       }} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100 shrink-0">@{p.name}</button>
                     ))}
                   </div>
                )}
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"><Send size={18}/> SKICKA</button>
             </form>
          </div>
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border p-8 shadow-xl">
               <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-800"><Settings className="text-indigo-600" size={28}/> Admin Dashboard</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
                   <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Systeminställningar</h3>
                   <div className="flex gap-2 items-center">
                     <input type="datetime-local" onChange={e => setDoc(doc(db, "settings", "appConfig"), { deadline: new Date(e.target.value) }, { merge: true })} className="bg-white border p-2 rounded-xl text-xs font-bold outline-none"/>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Gravering (kr)</span>
                       <input type="number" min="0" step="50" defaultValue={adminFee} onBlur={e => { const v = parseInt(e.target.value) || 0; setAdminFee(v); setDoc(doc(db, "settings", "appConfig"), { adminFee: v }, { merge: true }); }} className="w-20 bg-white border p-2 rounded-xl text-xs font-bold outline-none"/>
                     </div>
                   </div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
                   <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Deltagarstatus</h3>
                   <div className="flex items-center gap-4">
                     <div className="text-2xl font-black text-slate-800">{tips.length} <span className="text-xs text-slate-400 uppercase">Anmälda</span></div>
                     <div className="text-2xl font-black text-emerald-600">{activePlayers.length} <span className="text-xs text-slate-400 uppercase tracking-widest">Godkända</span></div>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Ohanterade Anmälningar</h3>
                 {tips.filter(t => !t.isApproved).map(t => (
                   <div key={t.id} className="p-5 bg-white border rounded-[2rem] flex justify-between items-center shadow-sm">
                      <div>
                        <div className="font-black text-lg">{t.name}</div>
                        <div className="text-xs text-slate-400 font-bold">{t.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteDoc(doc(db, "tips", t.id))} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2/></button>
                        <button onClick={() => updateDoc(doc(db, "tips", t.id), { isApproved: true })} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20">GODKÄNN</button>
                      </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-4 pt-8">
                 <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Hantera Deltagare ({activePlayers.length})</h3>
                 <div className="grid gap-3">
                   {activePlayers.map(p => (
                     <div key={p.id} className="p-4 bg-white border rounded-2xl flex justify-between items-center shadow-sm">
                       <div>
                         <div className="font-bold text-slate-800">{p.name}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase">{p.email}</div>
                       </div>
                       <div className="flex gap-1">
                         <button onClick={() => startEditing(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Settings size={18}/></button>
                         <button onClick={() => deleteParticipant(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><History className="text-vmgold" size={28}/> Hantera Hall of Fame</h2>
              <div className="flex gap-3 mb-6">
                <select value={hofType} onChange={e => setHofType(e.target.value)} className="p-3 border rounded-xl font-bold outline-none focus:border-vmgold text-sm bg-white">
                  <option value="VM">VM</option>
                  <option value="EM">EM</option>
                </select>
                <input type="number" placeholder="Årtal (t.ex. 2024)" value={hofYear} onChange={e => setHofYear(e.target.value)} className="flex-1 p-3 border rounded-xl font-bold outline-none focus:border-vmgold text-sm"/>
                <input type="text" placeholder="Mästarens namn" value={hofName} onChange={e => setHofName(e.target.value)} className="flex-1 p-3 border rounded-xl font-bold outline-none focus:border-vmgold text-sm"/>
                <button onClick={async () => { if (!hofYear || !hofName) return; await addDoc(collection(db, 'hallOfFame'), { year: parseInt(hofYear), champion: hofName, type: hofType }); setHofYear(''); setHofName(''); setHofType('VM'); }} className="px-5 py-3 bg-vmgold text-vmdark font-black rounded-xl text-sm shadow-lg hover:brightness-105 transition-all">Spara</button>
              </div>
              <div className="space-y-3">
                {hallOfFame.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <Trophy size={16} className="text-vmgold"/>
                      <span className="font-black"><span className={entry.type === 'EM' ? 'text-indigo-500' : 'text-vmgold'}>{entry.type || 'VM'}</span> {entry.year}</span>
                      <span className="text-slate-600 font-bold">{entry.champion}</span>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'hallOfFame', entry.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border p-8 shadow-xl">
               <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><PlayCircle className="text-indigo-600" size={28}/> Rapportera Resultat</h2>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map(m => (
                    <div key={m.id} className="p-6 bg-slate-50 rounded-[2rem] border space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black text-slate-400"><span>Match {m.id}</span><span>{m.date}</span></div>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2 flex-1"><Flag code={TEAMS[m.team1]?.flag}/><span className="text-xs font-black truncate">{m.team1}</span></div>
                             <input type="number" defaultValue={m.goals1} onBlur={e => updateMatch(m.id, { goals1: parseInt(e.target.value) || 0, status: 'finished' })} className="w-12 p-2 border rounded-xl text-center font-black outline-none bg-white"/>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2 flex-1"><Flag code={TEAMS[m.team2]?.flag}/><span className="text-xs font-black truncate">{m.team2}</span></div>
                             <input type="number" defaultValue={m.goals2} onBlur={e => updateMatch(m.id, { goals2: parseInt(e.target.value) || 0, status: 'finished' })} className="w-12 p-2 border rounded-xl text-center font-black outline-none bg-white"/>
                          </div>
                          <div className="flex gap-2">
                            <input type="text" placeholder="Minut (ex 65)" defaultValue={m.minute} onBlur={e => updateMatch(m.id, { minute: e.target.value, status: e.target.value ? 'live' : 'finished' })} className="flex-1 p-2 border rounded-xl text-[10px] font-black outline-none bg-white"/>
                       <button onClick={() => updateMatch(m.id, { status: 'upcoming', goals1: null, goals2: null, minute: null })} className="p-2 text-slate-300 hover:text-red-400 transition-colors"><X size={16}/></button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>
      <footer className="mt-8 mb-12 flex flex-col items-center justify-center gap-1 opacity-60">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Appen är skapad och ägs av Emil Zettergren | 070-618 37 54 | zettergren.emil@gmail.com</p>
      </footer>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-vmdark/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedUser(null)}>
           <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="bg-vmdark p-8 text-white relative">
                 <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X/></button>
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-vmgold rounded-[2rem] flex items-center justify-center text-vmdark shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                       <User size={40} />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black italic tracking-tighter">{selectedUser.name}</h2>
                       <div className="flex items-center gap-4 mt-2">
                          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-vmgold border border-vmgold/30">PLACERING #{selectedUser.rank}</div>
                          <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedUser.pts} Poäng | {selectedUser.goals} Mål</div>
                       </div>
                    </div>
                    {currentUser.isAdmin && (
                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => { setSelectedUser(null); startEditing(selectedUser); }} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 text-white transition-colors" title="Redigera"><Settings size={20}/></button>
                        <button onClick={() => { setSelectedUser(null); deleteParticipant(selectedUser.id); }} className="p-3 bg-red-500/20 rounded-2xl hover:bg-red-500/30 text-red-400 transition-colors" title="Ta bort"><Trash2 size={20}/></button>
                      </div>
                    )}
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                 <div className="space-y-4">
                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] mb-6">Spelarens Rader</h3>
                    <div className="grid gap-3">
                       {matches.map(m => {
                          const pick = selectedUser.predictions?.[m.id];
                          const actual = get1X2(m.goals1, m.goals2);
                          const isCorrect = actual && pick === actual;
                          const isWrong = actual && pick !== actual;
                          return (
                            <div key={m.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-100' : isWrong ? 'bg-red-50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                               <div className="flex items-center gap-3 flex-1">
                                  <div className="flex flex-col items-center gap-1 w-6">
                                     <Flag code={TEAMS[m.team1]?.flag} />
                                     <span className="text-[8px] font-bold text-slate-300">VS</span>
                                     <Flag code={TEAMS[m.team2]?.flag} />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black">{m.team1} - {m.team2}</span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">{m.date}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-[10px] font-black text-slate-400 uppercase">Res: <span className="text-slate-900">{m.goals1 ?? '-'}-{m.goals2 ?? '-'}</span></div>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : isWrong ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border text-slate-400'}`}>
                                     {pick || '-'}
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      {isEditing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-vmdark/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-vmdark p-6 text-white flex justify-between items-center">
              <h2 className="font-black text-xl flex items-center gap-2"><Settings size={20} className="text-vmgold"/> Redigera Deltagare</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X/></button>
            </div>
            <div className="p-6 space-y-3 border-b">
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Namn" className="w-full p-3 rounded-xl bg-slate-50 border outline-none focus:border-indigo-400 font-bold text-sm"/>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="E-post" className="w-full p-3 rounded-xl bg-slate-50 border outline-none focus:border-indigo-400 font-bold text-sm"/>
              <input type="number" value={regGoals} onChange={e => setRegGoals(e.target.value)} placeholder="Mål totalt i hela VM?" className="w-full p-3 rounded-xl bg-slate-50 border outline-none focus:border-indigo-400 font-bold text-sm"/>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-slate-50/50" style={{maxHeight:'40vh'}}>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                <span>Match-tips</span>
                <span className="text-indigo-500">{Object.keys(regPicks).length}/72 tippade</span>
              </div>
              {initialMatchesList.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border p-3 space-y-2">
                  <div className="flex items-center justify-center gap-3 text-xs font-black">
                    <div className="flex items-center gap-1.5 flex-1 justify-end"><span>{m.team1}</span><Flag code={TEAMS[m.team1]?.flag}/></div>
                    <span className="text-slate-300 text-[10px]">vs</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-start"><Flag code={TEAMS[m.team2]?.flag}/><span>{m.team2}</span></div>
                  </div>
                  <div className="flex gap-2">
                    {['1','X','2'].map(s => {
                      const primaryColor = s === '1' ? TEAMS[m.team1]?.primary : s === '2' ? TEAMS[m.team2]?.primary : '#64748b';
                      const isWhite = primaryColor?.toUpperCase() === '#FFFFFF';
                      const selected = regPicks[m.id] === s;
                      let style = { backgroundColor: selected ? primaryColor : 'rgba(0,0,0,0.04)' };
                      let cl = selected
                        ? `scale-105 shadow-md opacity-100 ring-2 ring-white/20 font-black${isWhite ? ' text-slate-900 border border-slate-300' : ' text-white'}`
                        : 'text-slate-500 font-bold opacity-70';
                      return (
                        <button key={s} onClick={() => setRegPicks(prev => ({...prev, [m.id]: prev[m.id] === s ? null : s}))} style={style} className={`flex-1 py-2.5 rounded-xl text-sm transition-all duration-200 ${cl}`}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 flex gap-3 border-t bg-white">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-2xl border font-bold text-slate-500 hover:bg-slate-50 transition-colors">Avbryt</button>
              <button onClick={async () => { await submitTips(); setIsEditing(false); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Spara ändringar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
