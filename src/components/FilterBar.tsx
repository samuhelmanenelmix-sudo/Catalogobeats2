import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Music2, Gauge, X, Sparkles } from 'lucide-react';

interface FilterBarProps {
  selectedBpmRange: string;
  onSelectBpmRange: (range: string) => void;
  selectedKey: string;
  onSelectKey: (key: string) => void;
  availableKeys: string[];
  selectedMood: string;
  onSelectMood: (mood: string) => void;
  availableMoods: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedBpmRange,
  onSelectBpmRange,
  selectedKey,
  onSelectKey,
  availableKeys,
  selectedMood,
  onSelectMood,
  availableMoods,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-[#030A14] border border-[#00F0FF]/30 rounded-2xl p-3.5 mb-6 text-[#E0F2FE] shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Filter Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-sky-300/80 font-mono mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>FILTROS:</span>
          </div>

          {/* BPM Filter */}
          <div className="relative">
            <select
              id="filter-bpm"
              value={selectedBpmRange}
              onChange={(e) => onSelectBpmRange(e.target.value)}
              className="appearance-none bg-[#000000] border border-[#00F0FF]/25 rounded-xl px-3 py-1.5 pr-8 text-xs text-sky-200 hover:border-[#00F0FF]/60 focus:outline-none focus:border-[#00F0FF] transition cursor-pointer"
            >
              <option value="ALL">Tempo (BPM): Todos</option>
              <option value="SLOW">Lento (&lt; 90 BPM)</option>
              <option value="MEDIUM">Medio (90 - 125 BPM)</option>
              <option value="UPTEMPO">Rápido (125 - 145 BPM)</option>
              <option value="FAST">Ultra Rápido (&gt; 145 BPM)</option>
            </select>
            <Gauge className="w-3.5 h-3.5 text-sky-400/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Musical Key Filter */}
          <div className="relative">
            <select
              id="filter-key"
              value={selectedKey}
              onChange={(e) => onSelectKey(e.target.value)}
              className="appearance-none bg-[#000000] border border-[#00F0FF]/25 rounded-xl px-3 py-1.5 pr-8 text-xs text-sky-200 hover:border-[#00F0FF]/60 focus:outline-none focus:border-[#00F0FF] transition cursor-pointer"
            >
              <option value="ALL">Escala Musical: Todas</option>
              {availableKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <Music2 className="w-3.5 h-3.5 text-sky-400/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mood Filter */}
          {availableMoods.length > 0 && (
            <div className="relative">
              <select
                id="filter-mood"
                value={selectedMood}
                onChange={(e) => onSelectMood(e.target.value)}
                className="appearance-none bg-[#000000] border border-[#00F0FF]/25 rounded-xl px-3 py-1.5 pr-8 text-xs text-sky-200 hover:border-[#00F0FF]/60 focus:outline-none focus:border-[#00F0FF] transition cursor-pointer"
              >
                <option value="ALL">Mood / Vibras: Todas</option>
                {availableMoods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <Sparkles className="w-3.5 h-3.5 text-sky-400/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              id="btn-reset-filters"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 text-xs font-medium transition"
            >
              <X className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Right Sort Group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-sky-300/80 font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="hidden sm:inline">ORDENAR:</span>
          </div>

          <select
            id="sort-beats"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-[#000000] border border-[#00F0FF]/25 rounded-xl px-3 py-1.5 text-xs text-sky-200 hover:border-[#00F0FF]/60 focus:outline-none focus:border-[#00F0FF] transition cursor-pointer font-medium"
          >
            <option value="newest">Más recientes</option>
            <option value="popular">Más reproducidos</option>
            <option value="likes">Más valorados (Likes)</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="bpm-asc">BPM: Menor a Mayor</option>
            <option value="bpm-desc">BPM: Mayor a Menor</option>
          </select>
        </div>

      </div>
    </div>
  );
};
