
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { geminiService, Attachment } from '../services/gemini';
import { Profile, Chat, Message, ChatMode } from '../types';
import { ICONS } from '../constants';

interface ChatAreaProps {
  profile: Profile;
}

// --- Specialized UI Components for Gemini Output ---
const parseMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]/g, '<span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">$1</span>')
    .replace(/\n/g, '<br />');
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

const ChatArea: React.FC<ChatAreaProps> = ({ profile }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchChats(); }, [profile]);
  useEffect(() => { if (activeChat) { fetchMessages(activeChat.id); setMode(activeChat.mode); } }, [activeChat]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

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

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    // Restoration: Find last chat of this type
    const latestOfType = chats.find(c => c.mode === newMode);
    if (latestOfType) {
      setActiveChat(latestOfType);
    } else {
      createNewChat(newMode);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat || loading) return;
    const userMessage = input;
    setInput('');
    setLoading(true);

    const { data: savedMsg } = await supabase.from('messages').insert({ chat_id: activeChat.id, role: 'user', content: userMessage }).select().single();
    if (savedMsg) setMessages(prev => [...prev, savedMsg]);

    const reply = await geminiService.generateReply(userMessage, mode, []);
    const { data: aiMsg } = await supabase.from('messages').insert({ chat_id: activeChat.id, role: 'model', content: reply }).select().single();
    if (aiMsg) setMessages(prev => [...prev, aiMsg]);

    if (activeChat.title === 'New Session') {
        const newTitle = await geminiService.generateTitle(userMessage);
        await supabase.from('chats').update({ title: newTitle }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title: newTitle } : c));
    }
    setLoading(false);
  };

  const createNewChat = async (selectedMode: ChatMode) => {
    const { data } = await supabase.from('chats').insert({ user_id: profile.id, title: 'New Session', mode: selectedMode }).select().single();
    if (data) { setChats(prev => [data, ...prev]); setActiveChat(data); setMessages([]); setMode(selectedMode); }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this session forever?")) return;
    await supabase.from('chats').delete().eq('id', id);
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (activeChat?.id === id) setActiveChat(newChats[0] || null);
  };

  const renameChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = chats.find(c => c.id === id);
    const newTitle = prompt("Enter new title:", current?.title);
    if (newTitle && newTitle !== current?.title) {
        await supabase.from('chats').update({ title: newTitle }).eq('id', id);
        setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
        if (activeChat?.id === id) setActiveChat(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  return (
    <div className="flex h-full bg-[#fdfcfd]">
      {/* Sidebar Restoration */}
      <div className="w-64 border-r border-gray-100 hidden lg:flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => createNewChat(mode)} className="w-full bg-[#FF4761] text-white rounded-xl py-2.5 font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all">
            <ICONS.Plus className="w-4 h-4" /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(c => (
            <div key={c.id} className="group relative" onClick={() => setActiveChat(c)}>
              <div className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-0.5 ${activeChat?.id === c.id ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate text-xs flex-1 pr-6">{c.title}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={(e) => renameChat(c.id, e)} className="p-1 hover:text-rose-400"><ICONS.Pencil className="w-3 h-3" /></button>
                    <button onClick={(e) => deleteChat(c.id, e)} className="p-1 hover:text-red-500"><ICONS.Trash className="w-3 h-3" /></button>
                  </div>
                </div>
                <span className="text-[8px] uppercase tracking-widest opacity-60 font-black">{c.mode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['chat', 'tutor', 'listen'] as ChatMode[]).map(m => (
              <button key={m} onClick={() => handleModeChange(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'}`}>{m}</button>
            ))}
          </div>
          <div className="text-[10px] font-black uppercase text-rose-300 px-3 truncate max-w-[150px]">{activeChat?.title}</div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#fcf9f9]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${m.role === 'user' ? 'bg-[#FF4761] text-white rounded-tr-none' : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'}`}>
                {m.role === 'user' ? <p className="text-sm font-medium leading-relaxed">{m.content}</p> : <RichMessageRenderer content={m.content} />}
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-1 px-4"><div className="w-1 h-1 bg-rose-300 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-rose-300 rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-rose-300 rounded-full animate-bounce delay-150"></div></div>}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Message Cupid in ${mode} mode...`} className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-full text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-100" />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="w-12 h-12 bg-[#FF4761] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition-all"><ICONS.Play className="w-5 h-5 fill-white translate-x-0.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
