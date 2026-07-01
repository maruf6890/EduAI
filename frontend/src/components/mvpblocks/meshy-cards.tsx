'use client';

import React from 'react';

// 📑 Define the structural data blueprint contract
export interface MeshyCardItem {
  id: string;
  title: string;
  description: string;
  metaIcon: React.ReactNode;
  metaText: string;
  backgroundImageUrl: string;
  icon: React.ReactNode;
}

interface MeshyCardsProps {
  items: MeshyCardItem[];
}

export default function MeshyCards({ items }: MeshyCardsProps) {
  return (
    <div className="mx-auto my-8 grid w-full max-w-7xl grid-cols-2 gap-6 p-4 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="scale-in group visible cursor-pointer transition-transform duration-300"
          style={{ transform: 'translateY(0px) scale(1)' }}
        >
          <div
            className="relative transform overflow-hidden rounded-2xl p-6 border border-white/[0.08] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-brand-primary/30 hover:shadow-2xl"
            style={{
              backgroundImage: `url(${item.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Ambient dark overlay backdrop wrapper to make light text pop over variable image hues */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark-bg-main/40 via-dark-bg-main/85 to-dark-bg-main/95 transition-opacity group-hover:opacity-90" />

            <div className="relative z-10">
              {/* Dynamic Action Icon Container Box */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10 border border-brand-primary/20 backdrop-blur-sm text-brand-primary group-hover:bg-brand-primary/20 transition-all duration-300">
                {item.icon}
              </div>

              <h3 className="mb-2 font-sans text-lg font-black text-text-main-white tracking-tight group-hover:text-brand-primary transition-colors duration-300">
                {item.title}
              </h3>

              <p className="mb-4 font-sans text-sm text-text-main-white/70 min-h-[40px] leading-relaxed">
                {item.description}
              </p>

              {/* Dynamic Bottom Context Footer Row */}
              <div className="flex items-center text-brand-secondary/80 text-xs font-bold font-sans">
                <span className="mr-1.5 shrink-0 text-brand-secondary">{item.metaIcon}</span>
                <span>{item.metaText}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}