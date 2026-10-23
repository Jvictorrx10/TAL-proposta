import type { SVGProps } from 'react';

export function Arrow({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return <svg className={`arrow-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Lightning({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 56" fill="currentColor" aria-hidden="true"><path d="M25 0 3 31h15l-4 25 24-35H23z" /></svg>;
}

export function Brand({ footer = false }: { footer?: boolean }) {
  return <span className={`brand ${footer ? 'brand-footer' : ''}`}>
    <svg viewBox="0 0 340 120" fill="currentColor" role="img" aria-label="TAL Mobilidade Elétrica">
      <path d="M10 16h113l-12 24H76v75H51V40H0z" />
      <path d="M138 10q9-12 18 0l69 96h-29l-49-69-44 78H75z" />
      <path d="M228 0h25v80l87-20-14 25-82 26q-16 3-16-15z" />
      <path d="m149 59-18 28 16-4-9 30 26-38-15 5 10-21z" />
    </svg>
    <span className="brand-caption">Mobilidade elétrica</span>
  </span>;
}

