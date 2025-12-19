
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { geminiService, Attachment } from '../services/gemini';
import { Profile, Chat, Message, ChatMode } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../services/live-session';

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  
  // Refs for managing live session state without closure staleness
  const isLiveRef = useRef(false);
  const liveSessionRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChats();
    return () => {
      stopLiveSession();
    };
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // --- Live API Logic ---
  
  const stopLiveSession = () => {
    isLiveRef.current = false;
    setIsLive(false);
    setLiveStatus('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    liveSessionRef.current = null;
  };

  const toggleLiveSession = async () => {
    if (isLiveRef.current) {
      stopLiveSession();
      return;
    }

    setIsLive(true);
    isLiveRef.current = true;
    setLiveStatus('Connecting...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      nextStartTimeRef.current = 0;
      
      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = audioContextRef.current.createGain();
      outputNode.connect(audioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a warm, helpful Polish language tutor engaged in a voice conversation.',
        },
        callbacks: {
          onopen: () => {
            if (!isLiveRef.current) return;
            setLiveStatus('Live');
            
            const source = inputContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isLiveRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              // Pass the actual sample rate so the util knows if it needs to adjust/header
              const pcmBlob = createBlob(inputData); 
              
              if (liveSessionRef.current) {
                  liveSessionRef.current.then(session => {
                      session.sendRealtimeInput({ media: pcmBlob });
                  }).catch(console.error);
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isLiveRef.current) return;
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                
                // Resume context if suspended (browser autoplay policy)
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                // Ensure we don't schedule in the past
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            stopLiveSession();
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            setLiveStatus('Error');
            // Don't auto-stop immediately on minor errors, but for connection error yes
            // stopLiveSession(); 
          }
        }
      });
      
      liveSessionRef.current = sessionPromise;
      
    } catch (e) {
      console.error("Failed to start live session", e);
      setIsLive(false);
      isLiveRef.current = false;
      alert("Could not start live session. Check console.");
    }
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
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['listen', 'chat', 'tutor'] as ChatMode[]).map(m => (
                <button key={m} onClick={() => handleModeChange(m)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-[#FF4761]' : 'text-gray-500 hover:text-gray-700'}`}>{m.toUpperCase()}</button>
                ))}
            </div>
            {isLive && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-full border border-red-100 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider">{liveStatus}</span>
                </div>
            )}
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

        {/* Attachment Preview Area */}
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

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex gap-3 items-center relative">
            <button 
                onClick={toggleLiveSession}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLive ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' : 'bg-rose-50 text-[#FF4761] hover:bg-rose-100'}`}
                title="Toggle Live Voice Mode"
            >
                <ICONS.Mic className="w-5 h-5" />
            </button>
            
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100"
                title="Attach Image/File"
            >
                <ICONS.Paperclip className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                accept="image/*"
            />

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
