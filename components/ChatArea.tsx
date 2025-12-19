
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { supabase } from '../services/supabase';
import { geminiService, ExtractedWord } from '../services/gemini';
import { createBlob, decode, decodeAudioData } from '../services/live-session';
import { Profile, Chat, Message, ChatMode } from '../types';
import { ICONS } from '../constants';

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

  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages, loading]);

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
    if (!input.trim() || !activeChat) return;
    const userMessage = input;
    const isFirstMessage = messages.length === 0;
    setInput('');
    setLoading(true);

    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({ chat_id: activeChat.id, role: 'user', content: userMessage })
      .select().single();
    if (savedMsg) setMessages(prev => [...prev, savedMsg]);

    const userLog = (await supabase.from('dictionary').select('word').eq('user_id', profile.id)).data?.map(d => d.word) || [];
    const result = await geminiService.generateAndExtract(userMessage, mode, userLog);

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

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]/g, '<span class="pronunciation">$1</span>');
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    let htmlOutput = '';
    let inTable = false;
    let tableRows: string[][] = [];
    let inList = false;

    const flushList = () => { if (inList) { htmlOutput += '</ul>'; inList = false; } };
    const flushTable = () => {
      if (inTable) {
        let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
        const headers = tableRows[0];
        headers.forEach(h => tableHtml += `<th>${formatText(h.trim())}</th>`);
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
      } else {
        flushTable();
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        htmlOutput += `<h3>${formatText(trimmed.slice(4))}</h3>`;
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        htmlOutput += `<h2>${formatText(trimmed.slice(3))}</h2>`;
        return;
      }

      if (trimmed === '---') {
        flushList();
        htmlOutput += '<hr />';
        return;
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) { htmlOutput += '<ul>'; inList = true; }
        htmlOutput += `<li>${formatText(trimmed.slice(2))}</li>`;
        return;
      } else {
        flushList();
      }

      if (trimmed) {
        htmlOutput += `<p>${formatText(trimmed)}</p>`;
      } else {
        htmlOutput += '<div class="h-1"></div>';
      }
    });

    flushList();
    flushTable();
    return { __html: htmlOutput };
  };

  return (
    <div className="flex h-full bg-[#fdfcfd] relative overflow-hidden">
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

      <div className="flex-1 flex flex-col relative">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['listen', 'chat', 'tutor'] as ChatMode[]).map(m => (
              <button key={m} onClick={() => handleModeChange(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-[#FF4761]' : 'text-gray-500 hover:text-gray-700'}`}>{m.toUpperCase()}</button>
            ))}
          </div>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-3">{profile.role}</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcf9f9]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
              <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                  msg.role === 'user' ? 'bg-[#FF4761] text-white rounded-tr-none' : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'
              }`}>
                <div 
                  className={`chat-content leading-snug font-medium ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`} 
                  dangerouslySetInnerHTML={formatMessage(msg.content)} 
                />
                <div className={`text-[8px] mt-1.5 opacity-40 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-white border border-rose-100 px-3 py-1.5 rounded-xl flex gap-1 animate-pulse"><div className="w-1 h-1 bg-rose-300 rounded-full"></div><div className="w-1 h-1 bg-rose-300 rounded-full"></div><div className="w-1 h-1 bg-rose-300 rounded-full"></div></div></div>}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex gap-3 items-center relative">
            <button className="w-10 h-10 bg-rose-50 text-[#FF4761] rounded-xl flex items-center justify-center transition-all hover:bg-rose-100"><ICONS.Mic className="w-5 h-5" /></button>
            <div className="flex-1">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask in English or Polish..." className="w-full px-5 py-2.5 bg-[#F2F4F7] border-none rounded-full focus:outline-none focus:ring-1 focus:ring-rose-200 text-sm font-bold text-gray-700 placeholder:text-gray-400" />
            </div>
            <button onClick={handleSend} disabled={loading || !input.trim()} className="w-10 h-10 bg-[#FF4761] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-md active:scale-90"><ICONS.Play className="w-4 h-4 fill-white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
