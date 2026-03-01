import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../../../constants/language-config';
import type { LanguageCode } from '../../../constants/language-config';

interface Props {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  accentColor: string;
}

const DemoLanguageSelector: React.FC<Props> = ({ value, onChange, accentColor }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Calculate position when opening
  const updatePos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    // Close on outside click
    const handler = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    // Close on scroll (parent scroll containers)
    const scrollHandler = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', scrollHandler, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', scrollHandler, true);
    };
  }, [open, updatePos]);

  const current = LANGUAGE_CONFIGS[value];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${open ? accentColor + '40' : 'rgba(0,0,0,0.08)'}`,
          color: 'var(--text-primary)',
        }}
      >
        <span className="text-base">{current?.flag}</span>
        <span className="text-xs">{current?.nativeName}</span>
        <span className="text-[10px] text-[var(--text-secondary)]" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed p-2 rounded-xl grid grid-cols-3 gap-1"
          style={{
            top: pos.top,
            left: pos.left,
            zIndex: 50,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.06)',
            animation: 'lang-dropdown-in 0.15s ease-out both',
            minWidth: '280px',
          }}
        >
          {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
            const lang = LANGUAGE_CONFIGS[code];
            if (!lang) return null;
            const isActive = code === value;
            return (
              <button
                key={code}
                onClick={() => { onChange(code as LanguageCode); setOpen(false); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors"
                style={{
                  backgroundColor: isActive ? `${accentColor}15` : 'transparent',
                  border: isActive ? `1px solid ${accentColor}25` : '1px solid transparent',
                }}
              >
                <span className="text-sm">{lang.flag}</span>
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: isActive ? accentColor : 'var(--text-primary)' }}
                >
                  {lang.nativeName}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}

      <style>{`
        @keyframes lang-dropdown-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default DemoLanguageSelector;
