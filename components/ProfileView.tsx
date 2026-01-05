
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { ICONS } from '../constants';
import InviteLinkCard from './InviteLinkCard';

interface ProfileViewProps {
  profile: Profile;
  onRefresh: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onRefresh }) => {
  const [partner, setPartner] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile.linked_user_id) fetchPartner();
  }, [profile]);

  const fetchPartner = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.linked_user_id)
      .single();
    if (data) setPartner(data);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[#fdfcfd]">
      <div className="max-w-xl mx-auto space-y-6">

        {/* User Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-4xl font-black mx-auto mb-4 border-4 border-white shadow-sm ring-1 ring-rose-100">
            {profile.full_name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-gray-800">{profile.full_name}</h2>
          <p className="text-gray-400 text-sm mb-4">{profile.email}</p>

          {/* Role Badge (display only, not toggleable) */}
          <div className="py-2 px-6 bg-rose-50/50 rounded-xl inline-block">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">
              {profile.role === 'student'
                ? "Learning Polish"
                : "Language Coach"}
            </p>
          </div>
        </div>

        {/* Connected Partner Card - Only show if linked */}
        {partner && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
              <ICONS.Heart className="text-rose-400 w-4 h-4" />
              Your Partner
            </h3>
            <div className="flex items-center gap-4 p-5 bg-rose-50 rounded-[2rem] border border-rose-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ICONS.Heart className="w-16 h-16 fill-rose-500" />
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 font-black shadow-sm z-10 border-2 border-rose-100">
                {partner.full_name[0].toUpperCase()}
              </div>
              <div className="flex-1 z-10">
                <p className="font-black text-gray-800 text-sm leading-none mb-1">{partner.full_name}</p>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{partner.email}</p>
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

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-6 text-gray-300 text-[10px] font-black hover:text-rose-400 transition-all uppercase tracking-[0.3em]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
