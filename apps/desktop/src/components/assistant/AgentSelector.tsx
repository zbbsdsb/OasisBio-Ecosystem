'use client';

import React, { memo } from 'react';
import { Zap, Palette } from 'lucide-react';
import type { AgentType } from '../../types/assistant';

interface AgentSelectorProps {
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
}

export const AgentSelector = memo(function AgentSelector({
  selectedAgent,
  onAgentChange
}: AgentSelectorProps) {
  const isDeo = selectedAgent === 'deo';

  return (
    <div className="flex items-center p-1 bg-slate-100 rounded-2xl shadow-inner">
      <button
        type="button"
        onClick={() => onAgentChange('deo')}
        className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 group ${
          isDeo
            ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-100'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
        }`}
        aria-label="Switch to Deo"
      >
        {isDeo && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl" />
        )}
        <div className="relative z-10 flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isDeo ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-200 group-hover:bg-emerald-100'
          }`}>
            {isDeo ? (
              <Zap className="w-4 h-4 text-white" />
            ) : (
              <img src="/assets/deo/deo.png" alt="Deo" className="w-6 h-6 rounded-lg" />
            )}
          </div>
          <span className={`font-semibold text-sm tracking-tight ${
            isDeo ? 'text-emerald-900' : 'text-slate-600'
          }`}>
            Deo
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onAgentChange('dia')}
        className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 group ${
          !isDeo
            ? 'bg-white text-rose-700 shadow-lg shadow-rose-500/15 ring-1 ring-rose-100'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
        }`}
        aria-label="Switch to Dia"
      >
        {!isDeo && (
          <div className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-transparent rounded-xl" />
        )}
        <div className="relative z-10 flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
            !isDeo ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-500/30' : 'bg-slate-200 group-hover:bg-rose-100'
          }`}>
            {!isDeo ? (
              <Palette className="w-4 h-4 text-white" />
            ) : (
              <img src="/assets/deo/dia.png" alt="Dia" className="w-6 h-6 rounded-lg" />
            )}
          </div>
          <span className={`font-semibold text-sm tracking-tight ${
            !isDeo ? 'text-rose-900' : 'text-slate-600'
          }`}>
            Dia
          </span>
        </div>
      </button>
    </div>
  );
});

export default AgentSelector;
