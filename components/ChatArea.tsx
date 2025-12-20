
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { geminiService, Attachment } from '../services/gemini';
import { LiveSession } from '../services/live-session';
import { Profile, Chat, Message, ChatMode } from '../types';
import { ICONS } from '../constants';

const parseMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]/g, '<span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">$1</span>')
    .replace(/\n/g, '<br />');
};

const CultureCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-white border border-rose-100 shadow-sm w-full">
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
      Love Goal
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
    <div className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
          <tr>{header.map((h, i) => <th key={i} className="px-4 py-3 font-black">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {body.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-gray-700 font-medium" dangerouslySetInnerHTML={{ __html: parseMarkdown(cell) }} />)}
            </tr>
          ))}
        </tbody>
      </table>
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
          const type = currentBlockType;
          currentBlockType = 'text'; 
          return <CultureCard key={index} title={currentBlockTitle || type} content={trimmed} />;
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

interface ChatAreaProps {
  profile: Profile;
}

const ChatArea: React.FC<ChatAreaProps> = ({ profile }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [liveUserText, setLiveUserText] = useState("");
  const [liveModelText, setLiveModelText] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  useEffect(() => { fetchChats(); }, [profile]);
  useEffect(() => { if (activeChat) { fetchMessages(activeChat.id); setMode(activeChat.mode); } }, [activeChat]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, liveUserText, liveModelText]);

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    if (data) { 
        setChats(data); 
        if (data.length > 0 && !activeChat) setActiveChat(data[0]); 
    }
    if (!data || data.length === 0) createNewChat('chat');
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleModeSwitch = (newMode: ChatMode) => {
    setMode(newMode);
    // Find the latest chat for that mode to navigate
    const lastChatOfMode = chats.find(c => c.mode === newMode);
    if (lastChatOfMode) {
      setActiveChat(lastChatOfMode);
    } else {
      createNewChat(newMode);
    }
  };

  const renameChat = async (id: string) => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('chats').update({ title: newTitle }).eq('id', id);
    if (!error) {
        setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
        setEditingChatId(null);
    }
  };

  const deleteChat = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    const { error } = await supabase.from('chats').delete().eq('id', id);
    if (!error) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChat?.id === id) setActiveChat(null);
    }
  };

  const saveMessage = async (role: 'user' | 'model', content: string) => {
    if (!activeChat || !content.trim()) return null;
    const { data } = await supabase.from('messages').insert({ chat_id: activeChat.id, role, content }).select().single();
    if (data) {
        setMessages(prev => [...prev, data]);
        return data;
    }
    return null;
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeChat || loading) return;
    const userMessage = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setLoading(true);

    // ACT 1: SAVE USER MESSAGE (Wait for confirmation)
    await saveMessage('user', currentAttachments.length > 0 ? `${userMessage} [Media Attached]`.trim() : userMessage);
    
    // ACT 2: FETCH AI REPLY
    const userWords = messages.map(m => m.content);
    const reply = await geminiService.generateReply(userMessage, mode, currentAttachments, userWords);
    
    // ACT 3: SAVE MODEL REPLY
    await saveMessage('model', reply);

    if (activeChat.title === 'New Session') {
        const title = await geminiService.generateTitle(userMessage);
        await supabase.from('chats').update({ title }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
    }

    setLoading(false);
  };

  const startLive = async () => {
    if (isLive) return;
    setIsLive(true);
    setIsMenuOpen(false);
    liveSessionRef.current = new LiveSession({
        userLog: messages.map(m => m.content),
        onTranscript: async (role, text, isFinal) => {
            if (role === 'user') setLiveUserText(text);
            else setLiveModelText(text);
            if (isFinal && text.trim() && activeChat) {
                if (role === 'user') {
                    await saveMessage('user', text);
                    setLiveUserText("");
                } else {
                    await saveMessage('model', text);
                    setLiveModelText("");
                }
            }
        },
        onClose: () => setIsLive(false)
    });
    await liveSessionRef.current.connect(mode);
  };

  const stopLive = () => {
    liveSessionRef.current?.disconnect();
    setIsLive(false);
    setLiveUserText("");
    setLiveModelText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target?.result as string;
        const base64 = data.split(',')[1];
        setAttachments(prev => [...prev, { data: base64, mimeType: file.type }]);
    };
    reader.readAsDataURL(file);
    setIsMenuOpen(false);
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

  return (
    <div className="flex h-full bg-[#fdfcfd] relative overflow-hidden font-header">
      {/* Sidebar with Actions */}
      <div className="w-64 border-r border-gray-100 hidden lg:flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => createNewChat(mode)} className="w-full bg-[#FF4761] text-white rounded-xl py-2.5 font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all">
            <ICONS.Plus className="w-4 h-4" /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {chats.map(c => (
            <div key={c.id} className={`group w-full text-left p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-0.5 relative ${activeChat?.id === c.id ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-400 hover:bg-gray-50'}`} onClick={() => setActiveChat(c)}>
              {editingChatId === c.id ? (
                <input 
                  autoFocus
                  className="bg-white border border-rose-200 rounded px-1 text-xs w-full outline-none" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  onBlur={() => renameChat(c.id)}
                  onKeyDown={e => e.key === 'Enter' && renameChat(c.id)}
                />
              ) : (
                <>
                  <span className="truncate text-xs pr-12">{c.title}</span>
                  <span className="text-[8px] uppercase tracking-widest opacity-60 font-black">{c.mode}</span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingChatId(c.id); setNewTitle(c.title); }} className="p-1 hover:text-rose-400 transition-colors">
                        <ICONS.Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} className="p-1 hover:text-red-500 transition-colors">
                        <ICONS.Trash className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mode Navigation */}
        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['chat', 'tutor', 'listen'] as ChatMode[]).map(m => (
              <button key={m} onClick={() => handleModeSwitch(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'}`}>{m}</button>
            ))}
          </div>
          {isLive && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-tighter">Cupid Live</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#fcf9f9] no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm ${m.role === 'user' ? 'bg-[#FF4761] text-white rounded-tr-none font-medium' : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'}`}>
                {m.role === 'user' ? <p className="text-sm leading-relaxed">{m.content}</p> : <RichMessageRenderer content={m.content} />}
              </div>
            </div>
          ))}
          
          {liveUserText && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                <div className="max-w-[85%] bg-[#FF4761]/60 text-white italic rounded-[1.5rem] rounded-tr-none px-5 py-3.5 text-sm font-medium border border-white/20">
                    {liveUserText}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-white animate-pulse"></span>
                </div>
            </div>
          )}
          {liveModelText && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="max-w-[85%] bg-white/60 border border-rose-100 text-gray-400 italic rounded-[1.5rem] rounded-tl-none px-5 py-3.5 text-sm">
                    {liveModelText}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-rose-400 animate-pulse"></span>
                </div>
            </div>
          )}

          {loading && <div className="flex gap-1.5 px-6"><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-150"></div></div>}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 relative">
          <div className={`absolute bottom-20 left-4 flex flex-col items-center gap-4 transition-all duration-300 z-20 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <button onClick={() => imgInputRef.current?.click()} className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-rose-100 shadow-xl text-rose-500 hover:scale-110 active:scale-95 transition-all">
                <ICONS.Image className="w-6 h-6" />
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-rose-100 shadow-xl text-rose-500 hover:scale-110 active:scale-95 transition-all">
                <ICONS.FileText className="w-6 h-6" />
             </button>
          </div>

          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 shrink-0 ${isMenuOpen ? 'bg-gray-100 border-gray-200 text-gray-400 rotate-90' : 'bg-white border-rose-100 text-rose-400 hover:bg-rose-50'}`}
            >
                {isMenuOpen ? <ICONS.X className="w-6 h-6" /> : <ICONS.Plus className="w-6 h-6" />}
            </button>

            <button 
              onClick={isLive ? stopLive : startLive}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all border-2 shrink-0 ml-1 ${isLive ? 'bg-rose-500 border-rose-500 text-white animate-pulse' : 'bg-white border-rose-100 text-rose-500 hover:bg-rose-50'}`}
              title="Speak to Cupid"
            >
                {isLive ? <ICONS.X className="w-5 h-5" /> : <ICONS.Mic className="w-6 h-6" />}
                {!isLive && <span className="text-[6px] font-black uppercase tracking-tighter mt-0.5">Tutor</span>}
            </button>

            <div className="flex-1 flex flex-col gap-2">
                {attachments.length > 0 && (
                    <div className="flex gap-2 p-2 bg-gray-50 rounded-xl overflow-x-auto no-scrollbar">
                        {attachments.map((a, idx) => (
                            <div key={idx} className="relative group shrink-0">
                                {a.mimeType.startsWith('image/') ? (
                                    <img src={`data:${a.mimeType};base64,${a.data}`} className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-rose-500">
                                        <ICONS.FileText className="w-5 h-5" />
                                    </div>
                                )}
                                <button onClick={() => setAttachments(p => p.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><ICONS.X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
                <div className={`w-full flex items-center bg-gray-50 border-none rounded-[2rem] px-6 py-4 transition-all ${isLive ? 'bg-rose-50 ring-2 ring-rose-100 opacity-50' : ''}`}>
                    <input 
                      type="text" 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSend()} 
                      placeholder={isLive ? "Listening to your Polish speech..." : `Message Cupid (${mode})...`} 
                      className="w-full bg-transparent border-none text-sm font-bold text-gray-700 focus:outline-none placeholder:text-gray-400" 
                      disabled={isLive}
                    />
                </div>
            </div>
            
            <button 
              onClick={handleSend} 
              disabled={loading || isLive || (!input.trim() && attachments.length === 0)} 
              className="w-14 h-14 bg-[#FF4761] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition-all shrink-0"
            >
                <ICONS.Play className="w-6 h-6 fill-white translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={imgInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
      <input type="file" ref={fileInputRef} accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />
    </div>
  );
};

export default ChatArea;
