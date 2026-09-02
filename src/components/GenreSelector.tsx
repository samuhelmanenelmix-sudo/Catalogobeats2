import React from 'react';
import { Genre } from '../types';
import { GENRES_LIST } from '../data/defaultBeats';
import { Disc, Flame, Radio, Zap, Sparkles, Layers } from 'lucide-react';

interface GenreSelectorProps {
  selectedGenre: Genre | 'ALL';
  onSelectGenre: (genre: Genre | 'ALL') => void;
  genreCounts: Record<string, number>;
  totalBeatsCount: number;
}

const GENRE_ICONS: Record<string, string> = {
  'Trap': '🔥',
  'Hip Hop': '🎤',
  'Drill': '⚡',
  'Reggaeton': '🌴',
  'R&B / Soul': '✨',
  'Afrobeat': '🥁',
  'Pop': '🌟',
  'Boom Bap': '📻',
  'Synthwave': '🌆',
  'Dancehall': '🔊',
  'Lo-Fi': '☕',
  'Rock / Indie': '🎸'
};

export const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenre,
  onSelectGenre,
  genreCounts,
  totalBeatsCount,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00F0FF] drop-shadow-[0_0_8px_#00F0FF]" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-sky-300/80">
            Explorar por Géneros
          </h2>
        </div>
        <span className="text-xs text-[#FF5500] font-mono font-bold drop-shadow-[0_0_6px_rgba(255,85,0,0.4)]">
          {selectedGenre === 'ALL' ? `${totalBeatsCount} pistas disponibles` : `${genreCounts[selectedGenre] || 0} pistas`}
        </span>
      </div>

      {/* Horizontal scrolling genre carousel / chip grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar py-1">
        {/* 'Todos' pill */}
        <button
          id="genre-tab-all"
          onClick={() => onSelectGenre('ALL')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
            selectedGenre === 'ALL'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] border border-[#00F0FF]'
              : 'bg-[#030A14] text-sky-300/70 hover:text-white hover:bg-[#051525] border border-[#00F0FF]/25 hover:border-[#FF5500]/60 hover:shadow-[0_0_12px_rgba(255,85,0,0.15)]'
          }`}
        >
          <span>🌐</span>
          <span>Todos los Géneros</span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
            selectedGenre === 'ALL' ? 'bg-black/25 text-black' : 'bg-[#021c0e] text-[#00E676] border border-[#00C853]/40'
          }`}>
            {totalBeatsCount}
          </span>
        </button>

        {/* Individual Genre Pills */}
        {GENRES_LIST.map((genre) => {
          const count = genreCounts[genre] || 0;
          const isSelected = selectedGenre === genre;
          const icon = GENRE_ICONS[genre] || '🎵';

          return (
            <button
              key={genre}
              id={`genre-tab-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectGenre(genre)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                isSelected
                  ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] border border-[#00F0FF] font-bold'
                  : 'bg-[#030A14] text-sky-300/70 hover:text-white hover:bg-[#051525] border border-[#00F0FF]/25 hover:border-[#FF5500]/60 hover:shadow-[0_0_12px_rgba(255,85,0,0.15)]'
              }`}
            >
              <span>{icon}</span>
              <span>{genre}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                  isSelected ? 'bg-black/25 text-black' : 'bg-[#021c0e] text-[#00E676] border border-[#00C853]/40'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
