
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
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (profile.linked_user_id) fetchPartner();

    // Set up real-time subscription for link requests
    const channel = supabase
      .channel('profile-link-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'link_requests'
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchRequests = async () => {
    const userEmail = profile.email.toLowerCase().trim();
    
    // 1. Fetch Incoming Requests (Raw, no joins to prevent RLS/FK failures)
    const { data: incomingRaw, error: incomingError } = await supabase
      .from('link_requests')
      .select('*')
      .eq('target_email', userEmail)
      .eq('status', 'pending');
    
    if (incomingError) console.error("Error fetching incoming:", incomingError);

    if (incomingRaw && incomingRaw.length > 0) {
        // 2. Manual Join: Fetch the profile names for these requesters
        const requesterIds = incomingRaw.map(r => r.requester_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', requesterIds);

        // 3. Combine data
        const combined = incomingRaw.map(req => ({
            ...req,
            requester: profiles?.find(p => p.id === req.requester_id) || { full_name: 'Unknown User', email: '...' }
        }));
        setIncomingRequests(combined);
    } else {
        setIncomingRequests([]);
    }

    // 4. Fetch Outgoing Requests
    const { data: outgoing } = await supabase
      .from('link_requests')
      .select('*')
      .eq('requester_id', profile.id)
      .eq('status', 'pending');
    
    if (outgoing) setOutgoingRequests(outgoing);
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
    const normalizedEmail = partnerEmail.toLowerCase().trim();
    if (!normalizedEmail) return;
    if (normalizedEmail === profile.email.toLowerCase()) {
      alert("You can't link to yourself!");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('link_requests')
      .insert({ 
        requester_id: profile.id, 
        target_email: normalizedEmail 
      });
    
    if (error) {
      alert(error.message);
    } else {
      setPartnerEmail('');
      fetchRequests();
    }
    setLoading(false);
  };

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase.from('link_requests').delete().eq('id', requestId);
    if (!error) fetchRequests();
  };

  const acceptRequest = async (request: any) => {
    setLoading(true);
    try {
      // 1. Mark request as accepted
      const { error: reqError } = await supabase
        .from('link_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
      
      if (reqError) throw reqError;

      // 2. Link both profiles
      const { error: p1Error } = await supabase.from('profiles').update({ linked_user_id: request.requester_id }).eq('id', profile.id);
      const { error: p2Error } = await supabase.from('profiles').update({ linked_user_id: profile.id }).eq('id', request.requester_id);
      
      if (p1Error || p2Error) throw (p1Error || p2Error);

      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to accept connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (newRole: 'student' | 'tutor') => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (!error) onRefresh();
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[#fdfcfd]">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Urgent: Incoming Requests (Shows at top for visibility) */}
        {!partner && incomingRequests.length > 0 && (
          <div className="bg-[#FF4761] p-6 rounded-[2.5rem] shadow-xl shadow-rose-200 border border-rose-400 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <h3 className="text-white text-sm font-black uppercase tracking-widest">Incoming Connection Request</h3>
            </div>
            
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 font-black text-xl shadow-inner">
                      {req.requester?.full_name ? req.requester.full_name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-white font-black text-sm leading-none mb-1">{req.requester?.full_name || 'Partner'}</p>
                      <p className="text-white/70 text-[10px] font-bold tracking-wide">{req.requester?.email || 'Unknown Email'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => acceptRequest(req)}
                    disabled={loading}
                    className="bg-white text-rose-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-4xl font-black mx-auto mb-4 border-4 border-white shadow-sm ring-1 ring-rose-100">
            {profile.full_name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-gray-800">{profile.full_name}</h2>
          <p className="text-gray-400 text-sm mb-6">{profile.email}</p>
          
          <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1.5 border border-gray-100 shadow-inner">
            <button 
              onClick={() => toggleRole('student')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                profile.role === 'student' ? 'bg-white shadow-md text-rose-500 translate-y-[-1px]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Student
            </button>
            <button 
              onClick={() => toggleRole('tutor')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                profile.role === 'tutor' ? 'bg-white shadow-md text-rose-500 translate-y-[-1px]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Tutor
            </button>
          </div>
          <div className="mt-4 py-2 px-6 bg-rose-50/50 rounded-xl inline-block">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">
              {profile.role === 'student' 
                ? "Master of Polish • Chat to grow" 
                : "The Coach • Guiding the journey"}
            </p>
          </div>
        </div>

        {/* Link Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
            <ICONS.Heart className="text-rose-400 w-4 h-4" /> 
            Connections
          </h3>

          {partner ? (
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
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invite Partner</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="Enter partner email..."
                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all font-medium"
                  />
                  <button 
                    onClick={sendRequest}
                    disabled={loading || !partnerEmail}
                    className="bg-[#FF4761] text-white px-8 py-3 rounded-2xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-rose-600 disabled:opacity-50 transition-all uppercase tracking-widest"
                  >
                    Link
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 px-1 italic">
                  Tip: If your partner is already signed up, the connection request will appear instantly on their Profile page.
                </p>
              </div>

              {/* Sent Requests List */}
              {outgoingRequests.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Request Sent (Pending)</p>
                  {outgoingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-amber-500">
                          <ICONS.Search className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-amber-800 truncate max-w-[150px]">{req.target_email}</p>
                          <p className="text-[9px] text-amber-400 font-bold uppercase">Awaiting Acceptance</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => cancelRequest(req.id)}
                        className="text-amber-500 p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <ICONS.Trash className="w-4 h-4" />
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
          className="w-full py-6 text-gray-300 text-[10px] font-black hover:text-rose-400 transition-all uppercase tracking-[0.3em]"
        >
          Disconnect Account
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
