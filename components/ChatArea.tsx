
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { geminiService, Attachment } from '../services/gemini';
import { LiveSession } from '../services/live-session';
import { Profile, Chat, Message, ChatMode } from '../types';
import { ICONS } from '../constants';

interface ChatAreaProps {
  profile: Profile;
}

interface TranscriptItem {
    role: 'user' | 'model';
    text: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ profile }) => {
  // Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Menu & Live State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveMode, setLiveMode] = useState<'audio' | 'video'>('audio');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    fetchChats();
  }, [profile]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      setMode(activeChat.mode);
    }
  }, [activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, attachments]);

  useEffect(() => {
    if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  // --- Chat Data Logic ---

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setChats(data);
        setActiveChat(data[0]);
      } else {
        createNewChat('chat');
      }
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleModeChange = async (newMode: ChatMode) => {
    setMode(newMode);
    const latestOfType = chats.find(c => c.mode === newMode);
    if (latestOfType) setActiveChat(latestOfType);
    else createNewChat(newMode);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeChat) return;
    
    const userMessage = input;
    const currentAttachments = [...attachments];
    
    setInput('');
    setAttachments([]); // Clear immediately
    setLoading(true);

    const isFirstMessage = messages.length === 0;

    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({ chat_id: activeChat.id, role: 'user', content: userMessage + (currentAttachments.length ? ' [Attachment]' : '') })
      .select().single();
    if (savedMsg) setMessages(prev => [...prev, savedMsg]);

    const userLog = (await supabase.from('dictionary').select('word').eq('user_id', profile.id)).data?.map(d => d.word) || [];
    
    const result = await geminiService.generateAndExtract(userMessage, mode, userLog, currentAttachments);

    if (result.words?.length > 0) {
      for (const w of result.words) {
        await supabase.from('dictionary').upsert({
          user_id: profile.id, 
          word: w.word, 
          translation: w.translation,
          word_type: w.type, 
          importance: w.importance, 
          context: w.context, 
          root_word: w.rootWord,
          unlocked_at: new Date().toISOString()
        }, { onConflict: 'user_id,word' });
      }
    }

    const { data: aiMsg } = await supabase
      .from('messages')
      .insert({ chat_id: activeChat.id, role: 'model', content: result.text })
      .select().single();
    if (aiMsg) setMessages(prev => [...prev, aiMsg]);

    if (isFirstMessage || activeChat.title === 'New Session') {
        const title = await geminiService.generateTitle(userMessage);
        await supabase.from('chats').update({ title }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
        setActiveChat(prev => prev ? { ...prev, title } : null);
    }
    setLoading(false);
  };

  const createNewChat = async (selectedMode: ChatMode) => {
    const { data } = await supabase.from('chats').insert({ user_id: profile.id, title: 'New Session', mode: selectedMode }).select().single();
    if (data) {
      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setMessages([]);
      setMode(selectedMode);
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure?")) return;
    await supabase.from('chats').delete().eq('id', id);
    setChats(prev => prev.filter(c => c.id !== id));
  };

  // --- Attachments & Menu ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsMenuOpen(false);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, { data: base64String, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Live Session Logic ---

  const startLiveSession = async (type: 'audio' | 'video') => {
    setIsMenuOpen(false);
    setLiveMode(type);
    setIsLiveActive(true);
    setTranscripts([]);

    try {
        let stream;
        if (type === 'video') {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        }
        
        liveSessionRef.current = new LiveSession({
            videoElement: type === 'video' ? videoRef.current! : undefined,
            onClose: endLiveSession,
            onTranscript: (role, text) => {
                setTranscripts(prev => {
                    const last = prev[prev.length - 1];
                    // Simple logic: if same role, append text, else new item.
                    // Note: Gemini streams chunks, sometimes duplicates. 
                    // This is a naive implementation; for production, use IDs if available or smarter diffing.
                    if (last && last.role === role) {
                         return [...prev.slice(0, -1), { role, text: last.text + text }];
                    }
                    return [...prev, { role, text }];
                });
            }
        });
        
        await liveSessionRef.current.connect();

    } catch (e) {
        console.error("Failed to start live session", e);
        alert("Could not access camera/microphone. Please allow permissions.");
        endLiveSession();
    }
  };

  const endLiveSession = () => {
    if (liveSessionRef.current) {
        liveSessionRef.current.disconnect();
        liveSessionRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
    }

    setIsLiveActive(false);
  };

  // --- Formatting Helpers ---
  const formatText = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]/g, '<span class="pronunciation">$1</span>');
  
  const formatMessage = (content: string) => {
    // (Same parsing logic as before, abbreviated for brevity in changes but fully retained in implementation)
    const lines = content.split('\n');
    let htmlOutput = '';
    let inTable = false;
    let tableRows: string[][] = [];
    let inList = false;

    const flushList = () => { if (inList) { htmlOutput += '</ul>'; inList = false; } };
    const flushTable = () => {
      if (inTable) {
        let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
        tableRows[0].forEach(h => tableHtml += `<th>${formatText(h.trim())}</th>`);
        tableHtml += '</tr></thead><tbody>';
        for (let i = 2; i < tableRows.length; i++) {
          tableHtml += '<tr>';
          tableRows[i].forEach(cell => tableHtml += `<td>${formatText(cell.trim())}</td>`);
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';
        htmlOutput += tableHtml;
        inTable = false;
        tableRows = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        inTable = true;
        const cells = trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (cells.length > 0) tableRows.push(cells);
        return;
      }
      flushTable();
      if (trimmed.startsWith('### ')) { flushList(); htmlOutput += `<h3>${formatText(trimmed.slice(4))}</h3>`; return; }
      if (trimmed.startsWith('## ')) { flushList(); htmlOutput += `<h2>${formatText(trimmed.slice(3))}</h2>`; return; }
      if (trimmed === '---') { flushList(); htmlOutput += '<hr />'; return; }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) { htmlOutput += '<ul>'; inList = true; }
        htmlOutput += `<li>${formatText(trimmed.slice(2))}</li>`;
        return;
      }
      flushList();
      htmlOutput += trimmed ? `<p>${formatText(trimmed)}</p>` : '<div class="h-1"></div>';
    });
    flushList(); flushTable();
    return { __html: htmlOutput };
  };

  return (
    <div className="flex h-full bg-[#fdfcfd] relative overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="w-64 border-r border-gray-100 flex flex-col hidden lg:flex bg-white shadow-sm z-10">
        <div className="p-3 border-b border-gray-100">
          <button onClick={() => createNewChat(mode)} className="w-full bg-[#FF4761] hover:bg-[#E63E56] text-white rounded-xl py-2 px-3 flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-sm">
            <ICONS.Plus className="w-4 h-4" /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <div key={chat.id} className="group relative">
              <div onClick={() => setActiveChat(chat)} className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-0.5 cursor-pointer ${activeChat?.id === chat.id ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>
                <div className="flex justify-between items-start w-full">
                  <div className="truncate text-xs font-semibold flex-1 pr-6">{chat.title}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                    <button onClick={(e) => deleteChat(chat.id, e)} className="p-1 hover:text-red-500"><ICONS.Trash className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="text-[9px] uppercase text-gray-400 font-bold">{chat.mode}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['listen', 'chat', 'tutor'] as ChatMode[]).map(m => (
                <button key={m} onClick={() => handleModeChange(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-[#FF4761]' : 'text-gray-500 hover:text-gray-700'}`}>{m.toUpperCase()}</button>
                ))}
            </div>
          </div>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-3">{profile.role}</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcf9f9] relative pb-32">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
              <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                  msg.role === 'user' ? 'bg-[#FF4761] text-white rounded-tr-none' : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'
              }`}>
                <div 
                  className={`chat-content leading-snug font-medium ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`} 
                  dangerouslySetInnerHTML={formatMessage(msg.content)} 
                />
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-white border border-rose-100 px-3 py-1.5 rounded-xl flex gap-1 animate-pulse"><div className="w-1 h-1 bg-rose-300 rounded-full"></div><div className="w-1 h-1 bg-rose-300 rounded-full"></div><div className="w-1 h-1 bg-rose-300 rounded-full"></div></div></div>}
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
                {attachments.map((file, i) => (
                    <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                        {file.mimeType.startsWith('image/') ? (
                            <img src={`data:${file.mimeType};base64,${file.data}`} className="w-full h-full object-cover" alt="attachment" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">FILE</div>
                        )}
                        <button onClick={() => removeAttachment(i)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                            <ICONS.X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* --- LIVE CONTROL DECK (Compact) --- */}
        {isLiveActive && (
            <div className="absolute bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-5 duration-300">
                <div className="relative bg-white/95 backdrop-blur-xl border border-rose-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-64 sm:h-72">
                    
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                             <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                                {liveMode === 'audio' ? 'Live Voice' : 'Live Video'}
                             </span>
                        </div>
                        <button onClick={endLiveSession} className="text-rose-300 hover:text-red-500 transition-colors">
                            <ICONS.X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 relative overflow-hidden bg-gray-50">
                        {/* Video Background Layer */}
                        {liveMode === 'video' && (
                             <video 
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                autoPlay
                                muted
                                playsInline
                             />
                        )}

                        {/* Transcripts Layer */}
                        <div ref={transcriptRef} className={`absolute inset-0 overflow-y-auto p-4 space-y-3 ${liveMode === 'video' ? 'bg-gradient-to-t from-black/80 to-transparent' : ''}`}>
                             {transcripts.length === 0 && (
                                 <div className={`h-full flex flex-col items-center justify-center text-center ${liveMode === 'video' ? 'text-white/70' : 'text-gray-400'}`}>
                                     <ICONS.Mic className={`w-8 h-8 mb-2 ${liveMode === 'video' ? 'text-white/50' : 'text-gray-300'}`} />
                                     <p className="text-xs font-bold">Listening...</p>
                                 </div>
                             )}
                             {transcripts.map((t, i) => (
                                 <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs font-medium leading-relaxed ${
                                         t.role === 'user' 
                                            ? 'bg-rose-500 text-white rounded-tr-none' 
                                            : (liveMode === 'video' ? 'bg-white/90 text-gray-800' : 'bg-white border border-rose-100 text-gray-700') + ' rounded-tl-none'
                                     }`}>
                                         {t.text}
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        )}


        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 z-30">
          <div className="max-w-4xl mx-auto flex gap-3 items-center relative">
            
            {/* The Cute Menu */}
            <div className="relative">
                {/* Expandable Options */}
                <div className={`absolute bottom-14 left-0 flex flex-col gap-3 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    
                    {/* Live Video */}
                    <button onClick={() => startLiveSession('video')} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50 transition-transform hover:scale-110" title="Live Video">
                        <ICONS.Video className="w-5 h-5" />
                    </button>
                    
                    {/* Live Voice */}
                    <button onClick={() => startLiveSession('audio')} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50 transition-transform hover:scale-110" title="Live Voice">
                        <ICONS.Mic className="w-5 h-5" />
                    </button>

                    {/* Camera (Photo) */}
                    <button onClick={() => cameraInputRef.current?.click()} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50 transition-transform hover:scale-110" title="Take Photo">
                        <ICONS.Image className="w-5 h-5" />
                    </button>

                    {/* Document */}
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50 transition-transform hover:scale-110" title="Upload File">
                        <ICONS.FileText className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Toggle Button */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md z-20 ${isMenuOpen ? 'bg-gray-100 text-gray-500 rotate-45' : 'bg-[#FF4761] text-white hover:scale-105'}`}
                >
                    <ICONS.Plus className="w-6 h-6" />
                </button>
            </div>

            {/* Hidden Inputs */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <input type="file" ref={cameraInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" capture="environment" />

            {/* Text Input */}
            <div className="flex-1">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask in English or Polish..." className="w-full px-5 py-2.5 bg-[#F2F4F7] border-none rounded-full focus:outline-none focus:ring-1 focus:ring-rose-200 text-sm font-bold text-gray-700 placeholder:text-gray-400" />
            </div>
            
            <button onClick={handleSend} disabled={loading || (!input.trim() && attachments.length === 0)} className="w-10 h-10 bg-[#FF4761] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-md active:scale-90"><ICONS.Play className="w-4 h-4 fill-white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
