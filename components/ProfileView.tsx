
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { ICONS } from '../constants';

interface ProfileViewProps {
  profile: Profile;
  onRefresh: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onRefresh }) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (profile.linked_user_id) fetchPartner();
  }, [profile]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('link_requests')
      .select('*, requester:requester_id(full_name, email)')
      .eq('target_email', profile.email)
      .eq('status', 'pending');
    if (data) setPendingRequests(data);
  };

  const fetchPartner = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.linked_user_id)
      .single();
    if (data) setPartner(data);
  };

  const sendRequest = async () => {
    if (!partnerEmail) return;
    setLoading(true);
    const { error } = await supabase
      .from('link_requests')
      .insert({ requester_id: profile.id, target_email: partnerEmail });
    
    if (error) alert(error.message);
    else {
      alert('Request sent!');
      setPartnerEmail('');
    }
    setLoading(false);
  };

  const acceptRequest = async (request: any) => {
    // 1. Update request status
    await supabase.from('link_requests').update({ status: 'accepted' }).eq('id', request.id);
    
    // 2. Link both profiles
    await supabase.from('profiles').update({ linked_user_id: request.requester_id, role: 'student' }).eq('id', profile.id);
    await supabase.from('profiles').update({ linked_user_id: profile.id, role: 'tutor' }).eq('id', request.requester_id);
    
    onRefresh();
  };

  const toggleRole = async () => {
    const newRole = profile.role === 'student' ? 'tutor' : 'student';
    await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    onRefresh();
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#fdfcfd]">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 text-4xl font-bold mx-auto mb-4 border-4 border-white shadow-md">
            {profile.full_name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold">{profile.full_name}</h2>
          <p className="text-gray-400 text-sm mb-6">{profile.email}</p>
          
          <div className="inline-flex bg-gray-50 rounded-2xl p-2 gap-2">
            <button 
              onClick={toggleRole}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                profile.role === 'student' ? 'bg-white shadow-md text-rose-500' : 'text-gray-400'
              }`}
            >
              Student
            </button>
            <button 
              onClick={toggleRole}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                profile.role === 'tutor' ? 'bg-white shadow-md text-rose-500' : 'text-gray-400'
              }`}
            >
              Tutor
            </button>
          </div>
        </div>

        {/* Linking Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ICONS.Heart className="text-rose-400 w-5 h-5" /> 
            {profile.linked_user_id ? 'Linked Partner' : 'Find Your Partner'}
          </h3>

          {partner ? (
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 font-bold shadow-sm">
                {partner.full_name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold">{partner.full_name}</p>
                <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">{partner.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                <ICONS.Check className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="Partner's email"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <button 
                  onClick={sendRequest}
                  disabled={loading}
                  className="bg-rose-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-600 disabled:opacity-50"
                >
                  Link
                </button>
              </div>

              {pendingRequests.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pending Requests</p>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm">{req.requester.full_name}</p>
                        <p className="text-xs text-gray-400">{req.requester.email}</p>
                      </div>
                      <button 
                        onClick={() => acceptRequest(req)}
                        className="bg-white border border-rose-200 text-rose-500 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-50"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full py-4 text-red-400 font-bold hover:bg-red-50 rounded-2xl transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
