
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

// --- Rich Component Renderers ---
const parseMarkdown = (text: string) => {
  if (!text) return '';
  let parsed = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]/g, '<span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">$1</span>')
    .replace(/\n/g, '<br />');
  return parsed;
};

const CultureCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-white border border-rose-100 shadow-sm animate-in zoom-in-95 duration-300 w-full">
    <div className="bg-[#FF4761]/10 px-4 py-2 border-b border-rose-100 flex items-center gap-2">
      <ICONS.Sparkles className="w-4 h-4 text-[#FF4761]" />
      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF4761]">{title || "Culture Note"}</h3>
    </div>
    <div className="p-4 text-sm text-gray-700 leading-relaxed">
      <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
    </div>
  </div>
);

const DrillCard: React.FC<{ content: string }> = ({ content }) => (
  <div className="my-4 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-1 relative w-full">
    <div className="absolute -top-3 left-4 bg-teal-100 text-teal-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-teal-200">
      Your Turn
    </div>
    <div className="p-4 text-sm text-gray-800 font-medium">
      <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
    </div>
  </div>
);

const GrammarTable: React.FC<{ content: string }> = ({ content }) => {
  const rows = content.trim().split('\n').filter(r => r.trim() && !r.includes('---'));
  if (rows.length < 2) return null;
  const header = rows[0].split('|').map(c => c.trim()).filter(c => c);
  const body = rows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(c => c));
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[300px]">
          <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              {header.map((h, i) => <th key={i} className="px-4 py-3 font-black whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {body.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap" dangerouslySetInnerHTML={{ __html: parseMarkdown(cell) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RichMessageRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(:::\s*[a-z]+.*)/i);
  let currentBlockType = 'text';
  let currentBlockTitle = '';
  
  return (
    <div className="space-y-2 w-full break-words">
      {parts.map((part, index) => {
        const trimmed = part.trim();
        if (!trimmed) return null;
        const match = trimmed.match(/^:::\s*([a-z]+)(.*)$/i);
        if (match) {
          currentBlockType = match[1].toLowerCase();
          const titleMatch = match[2].match(/\[(.*?)\]/);
          currentBlockTitle = titleMatch ? titleMatch[1] : '';
          return null; 
        }
        if (trimmed === ':::') { currentBlockType = 'text'; return null; }
        if (currentBlockType === 'culture' || currentBlockType === 'slang') {
          currentBlockType = 'text'; 
          return <CultureCard key={index} title={currentBlockTitle} content={trimmed} />;
        }
        if (currentBlockType === 'drill') {
          currentBlockType = 'text';
          return <DrillCard key={index} content={trimmed} />;
        }
        if (currentBlockType === 'table') {
          currentBlockType = 'text';
          return <GrammarTable key={index} content={trimmed} />;
        }
        return <div key={index} className="text-sm leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }} />;
      })}
    </div>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ profile }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [liveMode, setLiveMode] = useState<'audio' | 'video'>('audio');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  useEffect(() => { fetchChats(); }, [profile]);
  useEffect(() => { if (activeChat) { fetchMessages(activeChat.id); setMode(activeChat.mode); } }, [activeChat]);
  useEffect(() => { if (scrollRef.current) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; } }, [messages, loading, attachments, transcripts, isLiveActive, isSaving]);
  useEffect(() => { if (isLiveActive && liveMode === 'video' && videoRef.current && localStream) { videoRef.current.srcObject = localStream; videoRef.current.play().catch(e => console.error(e)); } }, [isLiveActive, liveMode, localStream]);

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    if (data && data.length > 0) { setChats(data); setActiveChat(data[0]); }
    else { createNewChat('chat'); }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
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
    setAttachments([]); 
    setLoading(true);

    const { data: savedMsg } = await supabase.from('messages').insert({ chat_id: activeChat.id, role: 'user', content: userMessage + (currentAttachments.length ? ' [Attachment]' : '') }).select().single();
    if (savedMsg) setMessages(prev => [...prev, savedMsg]);

    // Simplified Reply Call - No extraction happens here now.
    const replyText = await geminiService.generateReply(userMessage, mode, currentAttachments);

    const { data: aiMsg } = await supabase.from('messages').insert({ chat_id: activeChat.id, role: 'model', content: replyText }).select().single();
    if (aiMsg) setMessages(prev => [...prev, aiMsg]);

    if (messages.length === 0 || activeChat.title === 'New Session') {
        const title = await geminiService.generateTitle(userMessage);
        await supabase.from('chats').update({ title }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
        setActiveChat(prev => prev ? { ...prev, title } : null);
    }
    setLoading(false);
  };

  const createNewChat = async (selectedMode: ChatMode) => {
    const { data } = await supabase.from('chats').insert({ user_id: profile.id, title: 'New Session', mode: selectedMode }).select().single();
    if (data) { setChats(prev => [data, ...prev]); setActiveChat(data); setMessages([]); setMode(selectedMode); }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure?")) return;
    await supabase.from('chats').delete().eq('id', id);
    setChats(prev => prev.filter(c => c.id !== id));
  };

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

  const startLiveSession = async (type: 'audio' | 'video') => {
    if (isSaving) return;
    setIsMenuOpen(false);
    setLiveMode(type);
    setIsLiveActive(true);
    setTranscripts([]);
    const { data } = await supabase.from('dictionary').select('word').eq('user_id', profile.id);
    const userLog = data?.map((d: any) => d.word) || [];
    try {
        let stream = null;
        if (type === 'video') { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); setLocalStream(stream); }
        liveSessionRef.current = new LiveSession({
            videoRef: videoRef,
            userLog: userLog,
            onClose: () => { if (!isSaving) endLiveSession(); },
            onTranscript: (role, text) => {
                setTranscripts(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === role) return [...prev.slice(0, -1), { role, text: last.text + text }];
                    return [...prev, { role, text }];
                });
            }
        });
        await liveSessionRef.current.connect(mode);
    } catch (e) { alert("Microphone/Camera access required."); endLiveSession(); }
  };

  const endLiveSession = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (liveSessionRef.current) { liveSessionRef.current['config'].onClose = undefined; liveSessionRef.current.disconnect(); liveSessionRef.current = null; }
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }
    if (transcripts.length > 0 && activeChat) {
        const messagesToInsert = transcripts.map(t => ({ chat_id: activeChat.id, role: t.role, content: t.text }));
        await supabase.from('messages').insert(messagesToInsert);
    }
    setTranscripts([]);
    setIsLiveActive(false);
    setIsSaving(false);
  };

  return (
    <div className="flex h-full bg-[#fdfcfd] relative overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="w-64 border-r border-gray-100 flex flex-col hidden lg:flex bg-white shadow-sm z-10">
        <div className="p-3 border-b border-gray-100">
          <button onClick={() => createNewChat(mode)} className="w-full bg-[#FF4761] hover:bg-[#E63E56] text-white rounded-xl py-2 px-3 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm">
            <ICONS.Plus className="w-4 h-4" /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <div key={chat.id} className="group relative" onClick={() => setActiveChat(chat)}>
              <div className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-0.5 cursor-pointer ${activeChat?.id === chat.id ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>
                <div className="flex justify-between items-start w-full">
                  <div className="truncate text-xs font-semibold flex-1 pr-6">{chat.title}</div>
                  <button onClick={(e) => deleteChat(chat.id, e)} className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100"><ICONS.Trash className="w-3 h-3" /></button>
                </div>
                <div className="text-[9px] uppercase text-gray-400 font-bold">{chat.mode}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['listen', 'chat', 'tutor'] as ChatMode[]).map(m => (
                    <button key={m} onClick={() => handleModeChange(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-[#FF4761]' : 'text-gray-500'}`}>{m.toUpperCase()}</button>
                ))}
            </div>
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-3">{profile.role}</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#fcf9f9] pb-32">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
              <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user' ? 'bg-[#FF4761] text-white rounded-tr-none' : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'}`}>
                {msg.role === 'user' ? <div className="text-sm font-medium leading-relaxed break-words">{msg.content}</div> : <RichMessageRenderer content={msg.content} />}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-white border border-rose-100 px-4 py-3 rounded-2xl flex gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce [animation-delay:0.1s]"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce [animation-delay:0.2s]"></div></div></div>}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 z-30">
          <div className="max-w-4xl mx-auto flex gap-3 items-center relative">
            <div className="relative">
                <div className={`absolute bottom-14 left-0 flex flex-col gap-3 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <button onClick={() => startLiveSession('video')} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50"><ICONS.Video className="w-5 h-5" /></button>
                    <button onClick={() => startLiveSession('audio')} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50"><ICONS.Mic className="w-5 h-5" /></button>
                    <button onClick={() => cameraInputRef.current?.click()} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50"><ICONS.Image className="w-5 h-5" /></button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-white border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-50"><ICONS.FileText className="w-5 h-5" /></button>
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${isMenuOpen ? 'bg-gray-100 text-gray-500 rotate-45' : 'bg-[#FF4761] text-white'}`}><ICONS.Plus className="w-6 h-6" /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <input type="file" ref={cameraInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" capture="environment" />
            <div className="flex-1"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Message Cupid..." className="w-full px-5 py-2.5 bg-[#F2F4F7] border-none rounded-full focus:outline-none focus:ring-1 focus:ring-rose-200 text-sm font-bold text-gray-700" /></div>
            <button onClick={handleSend} disabled={loading || (!input.trim() && attachments.length === 0)} className="w-10 h-10 bg-[#FF4761] text-white rounded-full flex items-center justify-center disabled:opacity-50"><ICONS.Play className="w-4 h-4 fill-white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
