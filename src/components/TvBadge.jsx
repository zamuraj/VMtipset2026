import React from 'react';
import { Tv } from 'lucide-react';

const TvBadge = ({ tv }) => {
  if (tv === 'SVT') return <span className="bg-[#000030] text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">SVT</span>;
  if (tv === 'TV4') return <span className="bg-[#E50000] text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">TV4</span>;
  return <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[9px]"><Tv size={10}/> {tv}</span>;
};

export default TvBadge;
