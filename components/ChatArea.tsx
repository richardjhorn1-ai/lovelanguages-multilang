
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { geminiService, Attachment, ExtractedWord } from '../services/gemini';
import { LiveSession, LiveSessionState } from '../services/live-session';
import { Profile, Chat, Message, ChatMode, WordType } from '../types';
import { ICONS } from '../constants';
import NewWordsNotification from './NewWordsNotification';

const parseMarkdown = (text: string) => {
  if (!text) return '';

  // Sanitize any legacy CSS artifacts that might exist in stored messages
  let clean = text
    .split('(#FF4761) font-semibold">').join('')
    .split('(#FF4761)font-semibold">').join('')
    .split('#FF4761) font-semibold">').join('')
    .split('font-semibold">').join('')
    .split('font-semibold>').join('');

  // Then regex patterns for remaining variations
  clean = clean
    // Remove patterns like: (#HEX) font-semibold"> with any hex color
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    // Remove hex colors in parentheses: (#FF4761)
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    // Remove font-semibold with trailing punctuation
    .replace(/font-semibold["'>:\s]*/gi, '')
    // Remove Tailwind classes: text-[#FF4761]
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    // Remove HTML tags
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    // Remove style/class attributes
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    // Remove stray hex colors (6 digits only to preserve 3-digit numbers)
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    // Clean orphaned quotes/brackets/angles
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Then apply markdown formatting
  // IMPORTANT: Pronunciation replacement MUST run first to avoid matching brackets in HTML attributes
  return clean
    // Pronunciation: subtle italic gray
    .replace(/\[(.*?)\]/g, '<span class="text-gray-400 italic text-sm">($1)</span>')
    // Polish words: rose/pink semi-bold highlight
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FF4761; font-weight: 600;">$1</strong>')
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
  const [mode, setMode] = useState<ChatMode>('ask');
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Live mode state (Voice Mode)
  const [isLive, setIsLive] = useState(false);
  const [liveState, setLiveState] = useState<LiveSessionState>('disconnected');
  const [liveUserText, setLiveUserText] = useState("");
  const [liveModelText, setLiveModelText] = useState("");
  const [liveError, setLiveError] = useState<string | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  // New words notification state
  const [newWordsNotification, setNewWordsNotification] = useState<ExtractedWord[]>([]);

  // Track voice session messages for post-session extraction
  const voiceSessionStartIdx = useRef<number>(0);

  useEffect(() => { fetchChats(); }, [profile]);
  useEffect(() => { if (activeChat) { fetchMessages(activeChat.id); setMode(activeChat.mode); } }, [activeChat]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, streamingText]);

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    if (data) { 
        setChats(data); 
        if (data.length > 0 && !activeChat) setActiveChat(data[0]); 
    }
    if (!data || data.length === 0) createNewChat('ask');
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

  const saveExtractedWords = async (words: ExtractedWord[]) => {
    if (words.length === 0) return;

    const wordsToSave = words.map(w => ({
      user_id: profile.id,
      word: w.word.toLowerCase().trim(),
      translation: w.translation,
      word_type: w.type as WordType,
      importance: Math.max(1, Math.min(5, w.importance || 1)), // Clamp to 1-5
      context: JSON.stringify({
        original: w.context || '',
        root: w.rootWord || w.word,
        examples: w.examples || [],
        proTip: w.proTip || '',
        // Structured data for Love Log card display
        conjugations: w.conjugations || null,
        adjectiveForms: w.adjectiveForms || null,
        gender: w.gender || null,
        plural: w.plural || null
      }),
      unlocked_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('dictionary')
      .upsert(wordsToSave, {
        onConflict: 'user_id,word',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to save words:', error);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeChat || loading) return;
    const userMessage = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setLoading(true);
    setStreamingText('');

    // ACT 1: SAVE USER MESSAGE
    await saveMessage('user', currentAttachments.length > 0 ? `${userMessage} [Media Attached]`.trim() : userMessage);

    // ACT 2: FETCH AI REPLY (using non-streaming API for clean formatting)
    const userWords = messages.map(m => m.content);

    // Always use generateReply (non-streaming) as it produces clean markdown
    const { replyText, newWords } = await geminiService.generateReply(userMessage, mode, currentAttachments, userWords);

    // ACT 3: SAVE MODEL REPLY
    setStreamingText('');
    await saveMessage('model', replyText);

    // ACT 4: SAVE EXTRACTED WORDS & SHOW NOTIFICATION
    if (newWords.length > 0) {
      saveExtractedWords(newWords).catch(console.error);
      setNewWordsNotification(newWords);
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNewWordsNotification([]), 5000);
    }

    if (activeChat.title === 'New Session') {
      const title = await geminiService.generateTitle(userMessage);
      await supabase.from('chats').update({ title }).eq('id', activeChat.id);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
    }

    setLoading(false);
  };

  const startLive = async () => {
    if (isLive || !activeChat) return;
    setIsLive(true);
    setIsMenuOpen(false);
    setLiveError(null);

    // Mark the current message count so we can extract vocabulary later
    voiceSessionStartIdx.current = messages.length;

    liveSessionRef.current = new LiveSession({
        mode: mode,
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
        onStateChange: (state) => {
            setLiveState(state);
        },
        onError: (error) => {
            console.error('Voice mode error:', error);
            setLiveError(error.message);
        },
        onClose: () => {
            setIsLive(false);
            setLiveState('disconnected');
        }
    });

    try {
        await liveSessionRef.current.connect();
    } catch (err: any) {
        console.error('Voice mode failed:', err);
        setLiveError(err.message || 'Failed to start voice mode');
        setIsLive(false);
        setLiveState('disconnected');
    }
  };

  const stopLive = async () => {
    const chatId = activeChat?.id;
    const startIdx = voiceSessionStartIdx.current;

    liveSessionRef.current?.disconnect();
    setIsLive(false);
    setLiveUserText("");
    setLiveModelText("");

    if (!chatId) return;

    // Wait for any final messages to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Fetch fresh messages from DB to ensure we have all voice transcripts
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!allMessages) return;

      // Update local state with fresh messages
      setMessages(allMessages);

      // Get voice session messages (messages added after session started)
      const voiceMessages = allMessages.slice(startIdx);

      console.log(`Voice session ended. Extracting vocabulary from ${voiceMessages.length} messages...`);

      if (voiceMessages.length > 0) {
        // Get known words to avoid duplicates
        const { data: existingWords } = await supabase
          .from('dictionary')
          .select('word')
          .eq('user_id', profile.id);

        const knownWords = existingWords?.map(w => w.word.toLowerCase()) || [];

        // Analyze the voice transcripts
        const harvested = await geminiService.analyzeHistory(
          voiceMessages.map(m => ({ role: m.role, content: m.content })),
          knownWords
        );

        console.log(`Extracted ${harvested.length} words from voice session`);

        if (harvested.length > 0) {
          // Save extracted words
          await saveExtractedWords(harvested);

          // Show notification
          setNewWordsNotification(harvested);
          setTimeout(() => setNewWordsNotification([]), 5000);
        }
      }
    } catch (e) {
      console.error('Voice vocabulary extraction failed:', e);
    }
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
            {(['ask', 'learn'] as ChatMode[]).map(m => (
              <button key={m} onClick={() => handleModeSwitch(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'}`}>{m}</button>
            ))}
          </div>
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
          
          {/* Streaming response */}
          {streamingText && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm bg-white border border-rose-50 text-gray-800 rounded-tl-none">
                <RichMessageRenderer content={streamingText} />
                <span className="inline-block w-2 h-4 ml-1 bg-rose-400 animate-pulse rounded-sm"></span>
              </div>
            </div>
          )}

          {/* Loading indicator (only show if not streaming) */}
          {loading && !streamingText && (
            <div className="flex gap-1.5 px-6">
              <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-150"></div>
            </div>
          )}

          {/* Live Voice - User transcript bubble */}
          {liveUserText && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm bg-[#FF4761]/80 text-white rounded-tr-none font-medium border-2 border-dashed border-[#FF4761]">
                <p className="text-sm leading-relaxed italic">{liveUserText}</p>
                <span className="inline-block w-2 h-4 ml-1 bg-white/50 animate-pulse rounded-sm"></span>
              </div>
            </div>
          )}

          {/* Live Voice - Model transcript bubble */}
          {liveModelText && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm bg-white border-2 border-dashed border-teal-200 text-gray-800 rounded-tl-none">
                <p className="text-sm leading-relaxed">{liveModelText}</p>
                <span className="inline-block w-2 h-4 ml-1 bg-teal-400 animate-pulse rounded-sm"></span>
              </div>
            </div>
          )}
        </div>

        {/* Voice Status & Error */}
        {isLive && (
          <div className="px-4 pb-2 bg-white">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              {/* Compact Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${
                liveState === 'listening'
                  ? 'bg-rose-50 border-rose-200'
                  : liveState === 'speaking'
                  ? 'bg-teal-50 border-teal-200'
                  : liveState === 'connecting'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {liveState === 'listening' && (
                  <>
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500">Listening</span>
                  </>
                )}
                {liveState === 'speaking' && (
                  <>
                    <ICONS.Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-teal-600">Speaking</span>
                  </>
                )}
                {liveState === 'connecting' && (
                  <>
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-amber-600">Connecting</span>
                  </>
                )}
              </div>

              {/* Error Display */}
              {liveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <ICONS.X className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] text-red-600">{liveError}</span>
                  <button onClick={() => setLiveError(null)} className="text-red-400 hover:text-red-600">
                    <ICONS.X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
              disabled={isLive}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 shrink-0 ${isMenuOpen ? 'bg-gray-100 border-gray-200 text-gray-400 rotate-90' : 'bg-white border-rose-100 text-rose-400 hover:bg-rose-50'} disabled:opacity-50`}
            >
                {isMenuOpen ? <ICONS.X className="w-6 h-6" /> : <ICONS.Plus className="w-6 h-6" />}
            </button>

            {/* Microphone Button */}
            <button
              onClick={isLive ? stopLive : startLive}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 shrink-0 ${
                isLive
                  ? 'bg-[#FF4761] border-[#FF4761] text-white'
                  : 'bg-white border-rose-100 text-rose-400 hover:bg-rose-50'
              } ${liveState === 'listening' ? 'animate-pulse' : ''}`}
            >
                <ICONS.Mic className="w-6 h-6" />
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
                <div className={`w-full flex items-center bg-gray-50 rounded-[2rem] px-6 py-4 transition-all duration-300 ${isLive ? 'shadow-[inset_0_0_20px_rgba(255,71,97,0.25)] border-2 border-rose-200' : 'border-none'}`}>
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder={isLive ? (liveState === 'listening' ? "Listening..." : liveState === 'speaking' ? "Cupid is speaking..." : "Connecting...") : (mode === 'ask' ? "Ask Cupid anything..." : "Ready for your next lesson?")}
                      disabled={isLive}
                      className="w-full bg-transparent border-none text-sm font-bold text-gray-700 focus:outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="w-14 h-14 bg-[#FF4761] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition-all shrink-0"
            >
                <ICONS.Play className="w-6 h-6 fill-white translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={imgInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
      <input type="file" ref={fileInputRef} accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />

      {/* New Words Notification */}
      {newWordsNotification.length > 0 && (
        <NewWordsNotification
          words={newWordsNotification}
          onClose={() => setNewWordsNotification([])}
        />
      )}
    </div>
  );
};

export default ChatArea;
