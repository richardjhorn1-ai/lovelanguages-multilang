
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, OnboardingData } from '../types';
import { ICONS } from '../constants';
import InviteLinkCard from './InviteLinkCard';
import { useTheme } from '../context/ThemeContext';
import {
  AccentColor,
  DarkModeStyle,
  FontSize,
  ACCENT_COLORS,
  DARK_MODE_STYLES,
  FONT_SIZES
} from '../services/theme';

interface ProfileViewProps {
  profile: Profile;
  onRefresh: () => void;
}

// Options for dropdowns (matching onboarding)
const VIBE_OPTIONS = ['Passionate', 'Playful', 'Growing', 'Forever', 'Long-distance', 'New love'];
const TIME_OPTIONS = ['5 min', '10 min', '20+ min'];
const WHEN_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Whenever'];
const FEAR_OPTIONS = ['Pronunciation', 'Grammar', 'Sounding silly', 'Forgetting words'];
const RELATION_OPTIONS = ['partner', 'spouse', 'friend', 'family'];
const CONNECTION_OPTIONS = ['native', 'heritage', 'fluent', 'bilingual'];
const ORIGIN_OPTIONS = ['poland', 'family', 'school', 'self'];
const STYLE_OPTIONS = ['patient', 'playful', 'structured', 'immersive'];

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onRefresh }) => {
  const [partner, setPartner] = useState<Profile | null>(null);
  const [showCustomisation, setShowCustomisation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editData, setEditData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { theme, setAccentColor, setDarkMode, setFontSize, accentHex, isDark } = useTheme();

  useEffect(() => {
    if (profile.linked_user_id) fetchPartner();
    // Initialize edit data from profile
    setEditData(profile.onboarding_data || {});
  }, [profile]);

  const fetchPartner = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.linked_user_id)
      .single();
    if (data) setPartner(data);
  };

  const updateField = (key: keyof OnboardingData, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const partnerNameValue = profile.role === 'tutor' ? editData.learnerName : editData.partnerName;

      await supabase
        .from('profiles')
        .update({
          full_name: editData.userName || profile.full_name,
          partner_name: partnerNameValue || null,
          onboarding_data: editData
        })
        .eq('id', profile.id);

      setSaved(true);
      onRefresh();
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[var(--bg-primary)]">
      <div className="max-w-xl mx-auto space-y-6">

        {/* User Card */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4 border-[var(--bg-card)] shadow-sm"
            style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
          >
            {profile.full_name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">{profile.full_name}</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">{profile.email}</p>

          {/* Role Badge (display only, not toggleable) */}
          <div className="py-2 px-6 rounded-xl inline-block" style={{ backgroundColor: `${accentHex}15` }}>
            <p className="text-[10px] font-black uppercase tracking-tighter" style={{ color: accentHex }}>
              {profile.role === 'student'
                ? "Learning Polish"
                : "Language Coach"}
            </p>
          </div>
        </div>

        {/* Connected Partner Card - Only show if linked */}
        {partner && (
          <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
            <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
              <ICONS.Heart style={{ color: accentHex }} className="w-4 h-4" />
              Your Partner
            </h3>
            <div
              className="flex items-center gap-4 p-5 rounded-[2rem] border relative overflow-hidden group"
              style={{ backgroundColor: `${accentHex}15`, borderColor: `${accentHex}30` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ICONS.Heart className="w-16 h-16" style={{ fill: accentHex }} />
              </div>
              <div
                className="w-12 h-12 bg-[var(--bg-card)] rounded-full flex items-center justify-center font-black shadow-sm z-10 border-2"
                style={{ color: accentHex, borderColor: `${accentHex}30` }}
              >
                {partner.full_name[0].toUpperCase()}
              </div>
              <div className="flex-1 z-10">
                <p className="font-black text-[var(--text-primary)] text-sm leading-none mb-1">{partner.full_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentHex }}>{partner.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 z-10">
                <ICONS.Check className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Magic Invite Link - Only show for students without a partner */}
        {!partner && profile.role === 'student' && (
          <InviteLinkCard profile={profile} />
        )}

        {/* Customisation Section */}
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCustomisation(!showCustomisation)}
            className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
                <span className="text-xl">🎨</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-[var(--text-primary)]">Customisation</h3>
                <p className="text-xs text-[var(--text-secondary)]">Visual settings</p>
              </div>
            </div>
            <ICONS.ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showCustomisation ? 'rotate-180' : ''}`} />
          </button>

          {showCustomisation && (
            <div className="px-6 pb-6 space-y-6 border-t border-[var(--border-color)] pt-4">
              {/* Accent Color */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Accent Color</label>
                <div className="flex gap-3">
                  {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`relative w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                        theme.accentColor === color ? 'ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110' : ''
                      }`}
                      style={{ backgroundColor: ACCENT_COLORS[color].primary }}
                      title={ACCENT_COLORS[color].name}
                    >
                      {theme.accentColor === color && (
                        <ICONS.Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{ACCENT_COLORS[theme.accentColor].name}</p>
              </div>

              {/* Dark Mode */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Dark Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DARK_MODE_STYLES) as DarkModeStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setDarkMode(style)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        theme.darkMode === style
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg border border-gray-300"
                        style={{ backgroundColor: DARK_MODE_STYLES[style].bgPrimary }}
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {DARK_MODE_STYLES[style].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Font Size</label>
                <div className="flex gap-2">
                  {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        theme.fontSize === size
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <span
                        className="font-medium text-[var(--text-primary)]"
                        style={{ fontSize: FONT_SIZES[size].base }}
                      >
                        Aa
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{FONT_SIZES[size].name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Preview</p>
                <p className="text-[var(--text-primary)]">
                  <strong>Kocham cię</strong> means "I love you" in Polish
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                <ICONS.Settings className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-[var(--text-primary)]">Advanced Preferences</h3>
                <p className="text-xs text-[var(--text-secondary)]">Edit your onboarding answers</p>
              </div>
            </div>
            <ICONS.ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 space-y-4 border-t border-[var(--border-color)] pt-4">
              {/* Common fields */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  value={editData.userName || ''}
                  onChange={(e) => updateField('userName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none"
                />
              </div>

              {profile.role === 'student' ? (
                <>
                  {/* Student-specific fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Partner's Name</label>
                    <input
                      type="text"
                      value={editData.partnerName || ''}
                      onChange={(e) => updateField('partnerName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship Vibe</label>
                    <select
                      value={editData.relationshipVibe || ''}
                      onChange={(e) => updateField('relationshipVibe', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      {VIBE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Why are you learning Polish?</label>
                    <textarea
                      value={editData.learningReason || ''}
                      onChange={(e) => updateField('learningReason', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none resize-none"
                      placeholder="Your motivation..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Daily Time</label>
                      <select
                        value={editData.dailyTime || ''}
                        onChange={(e) => updateField('dailyTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none bg-white"
                      >
                        <option value="">Select...</option>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preferred Time</label>
                      <select
                        value={editData.preferredTime || ''}
                        onChange={(e) => updateField('preferredTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none bg-white"
                      >
                        <option value="">Select...</option>
                        {WHEN_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Biggest Challenge</label>
                    <select
                      value={editData.biggestFear || ''}
                      onChange={(e) => updateField('biggestFear', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      {FEAR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Goal</label>
                    <input
                      type="text"
                      value={editData.firstGoal || ''}
                      onChange={(e) => updateField('firstGoal', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--accent-border)] focus:outline-none"
                      placeholder="What do you want to achieve?"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Tutor-specific fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Learner's Name</label>
                    <input
                      type="text"
                      value={editData.learnerName || ''}
                      onChange={(e) => updateField('learnerName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship Type</label>
                    <select
                      value={editData.relationshipType || ''}
                      onChange={(e) => updateField('relationshipType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      {RELATION_OPTIONS.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Polish Connection</label>
                    <select
                      value={editData.polishConnection || ''}
                      onChange={(e) => updateField('polishConnection', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      {CONNECTION_OPTIONS.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How You Learned Polish</label>
                    <select
                      value={editData.polishOrigin || ''}
                      onChange={(e) => updateField('polishOrigin', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="poland">Grew up in Poland</option>
                      <option value="family">From family</option>
                      <option value="school">Studied formally</option>
                      <option value="self">Self-taught</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dream Phrase</label>
                    <input
                      type="text"
                      value={editData.dreamPhrase || ''}
                      onChange={(e) => updateField('dreamPhrase', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none"
                      placeholder="What do you want to hear them say?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teaching Style</label>
                    <select
                      value={editData.teachingStyle || ''}
                      onChange={(e) => updateField('teachingStyle', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:outline-none bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="patient">Patient & Gentle</option>
                      <option value="playful">Playful & Fun</option>
                      <option value="structured">Structured</option>
                      <option value="immersive">Immersive</option>
                    </select>
                  </div>
                </>
              )}

              {/* Save button */}
              <button
                onClick={saveChanges}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                  saved
                    ? 'bg-green-500'
                    : profile.role === 'student'
                      ? 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)]'
                      : 'bg-teal-500 hover:bg-teal-600'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => supabase.auth.signOut({ scope: 'local' })}
          className="w-full py-6 text-[var(--text-secondary)] text-[10px] font-black hover:opacity-70 transition-all uppercase tracking-[0.3em]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
