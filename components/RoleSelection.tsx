import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ userId, onRoleSelected }) => {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (role: UserRole) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      onRoleSelected();
    } catch (err) {
      console.error('Error saving role:', err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
            Welcome to Love Languages!
          </h1>
          <p className="text-gray-600">
            How will you be using the app?
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-4">
          <button
            onClick={() => handleSelect('student')}
            disabled={saving}
            className="w-full p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">I'm Learning Polish</h3>
                <p className="text-gray-500 text-sm">For my Polish-speaking partner</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelect('tutor')}
            disabled={saving}
            className="w-full p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">I'm Teaching Polish</h3>
                <p className="text-gray-500 text-sm">Helping my partner learn</p>
              </div>
            </div>
          </button>
        </div>

        {saving && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              Setting up your account...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;
