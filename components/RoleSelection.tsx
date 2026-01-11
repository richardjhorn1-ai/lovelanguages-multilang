import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ userId, onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { t } = useTranslation();
  const { targetName } = useLanguage();

  // Check for intended_role from Hero signup
  useEffect(() => {
    const checkIntendedRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const intendedRole = user?.user_metadata?.intended_role;

        if (intendedRole === 'student' || intendedRole === 'tutor') {
          setSelectedRole(intendedRole);
        }
      } catch (err) {
        console.error('Error checking intended role:', err);
      } finally {
        setLoading(false);
      }
    };

    checkIntendedRole();
  }, []);

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', userId);

      if (error) throw error;
      onRoleSelected();
    } catch (err) {
      console.error('Error saving role:', err);
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">💕</div>
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            {t('roleSelection.loading')}
          </div>
        </div>
      </div>
    );
  }

  const isStudent = selectedRole === 'student';
  const isTutor = selectedRole === 'tutor';

  // Role-specific content
  const roleContent = {
    student: {
      emoji: '📚',
      title: t('roleSelection.student.title', { language: targetName }),
      subtitle: t('roleSelection.student.subtitle', { language: targetName }),
      confirmMessage: t('roleSelection.student.confirmMessage', { language: targetName }),
      confirmSubtext: t('roleSelection.student.confirmSubtext'),
      accentColor: '#FF4761',
      bgLight: 'bg-rose-50',
      bgAccent: 'bg-rose-100',
      borderAccent: 'border-rose-400',
      hoverBorder: 'hover:border-rose-300',
      hoverBg: 'hover:bg-rose-50',
    },
    tutor: {
      emoji: '🎓',
      title: t('roleSelection.tutor.title', { language: targetName }),
      subtitle: t('roleSelection.tutor.subtitle'),
      confirmMessage: t('roleSelection.tutor.confirmMessage', { language: targetName }),
      confirmSubtext: t('roleSelection.tutor.confirmSubtext'),
      accentColor: '#FF4761',
      bgLight: 'bg-rose-50',
      bgAccent: 'bg-rose-100',
      borderAccent: 'border-rose-400',
      hoverBorder: 'hover:border-rose-300',
      hoverBg: 'hover:bg-rose-50',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💕</div>
          {selectedRole ? (
            <>
              <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
                {t('roleSelection.confirmHeader')}
              </h1>
              <p className="text-gray-500">
                {t('roleSelection.confirmSubtitle')}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
                {t('roleSelection.welcomeHeader')}
              </h1>
              <p className="text-gray-500">
                {t('roleSelection.welcomeSubtitle')}
              </p>
            </>
          )}
        </div>

        {/* Role Options */}
        <div className="space-y-3 mb-6">
          {/* Student Option */}
          <button
            onClick={() => setSelectedRole('student')}
            disabled={saving}
            className={`w-full p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
              isStudent
                ? `${roleContent.student.borderAccent} ${roleContent.student.bgLight} shadow-md`
                : `border-gray-200 bg-white ${roleContent.student.hoverBorder} ${roleContent.student.hoverBg}`
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${roleContent.student.bgAccent} flex items-center justify-center`}>
                <span className="text-xl">{roleContent.student.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{roleContent.student.title}</h3>
                <p className="text-gray-500 text-sm">{roleContent.student.subtitle}</p>
              </div>
              {isStudent && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: roleContent.student.accentColor }}
                >
                  <ICONS.Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Tutor Option */}
          <button
            onClick={() => setSelectedRole('tutor')}
            disabled={saving}
            className={`w-full p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
              isTutor
                ? `${roleContent.tutor.borderAccent} ${roleContent.tutor.bgLight} shadow-md`
                : `border-gray-200 bg-white ${roleContent.tutor.hoverBorder} ${roleContent.tutor.hoverBg}`
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${roleContent.tutor.bgAccent} flex items-center justify-center`}>
                <span className="text-xl">{roleContent.tutor.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{roleContent.tutor.title}</h3>
                <p className="text-gray-500 text-sm">{roleContent.tutor.subtitle}</p>
              </div>
              {isTutor && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: roleContent.tutor.accentColor }}
                >
                  <ICONS.Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Confirmation Message & Button */}
        {selectedRole && (
          <div className="text-center animate-fadeIn">
            <p className="text-lg font-bold text-gray-700 mb-1">
              {roleContent[selectedRole].confirmMessage}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {roleContent[selectedRole].confirmSubtext}
            </p>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: roleContent[selectedRole].accentColor }}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('roleSelection.settingUp')}
                </span>
              ) : (
                t('roleSelection.letsGo')
              )}
            </button>
          </div>
        )}

        {/* Fallback if nothing selected */}
        {!selectedRole && (
          <p className="text-center text-gray-400 text-sm">
            {t('roleSelection.chooseRole')}
          </p>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;
