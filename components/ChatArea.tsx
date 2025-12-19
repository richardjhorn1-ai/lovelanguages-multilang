
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Live session and transcription refs
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

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
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const createNewChat = async (selectedMode: ChatMode) => {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: profile.id,
        title: 'New Session',
        mode: selectedMode
      })
      .select()
      .single();

    if (error) {
        console.error("Error creating chat:", error);
        return;
    }

    if (data) {
      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setMessages([]);
      setMode(selectedMode);
    }
  };

  const saveLiveTurnToDb = async (input: string, output: string) => {
    if (!activeChat || (!input.trim() && !output.trim())) return;

    // Save user part
    if (input.trim()) {
      const { data: userMsg } = await supabase
        .from('messages')
        .insert({ chat_id: activeChat.id, role: 'user', content: input })
        .select().single();
      if (userMsg) setMessages(prev => [...prev, userMsg]);
    }

    // Save model part
    if (output.trim()) {
      const { data: aiMsg } = await supabase
        .from('messages')
        .insert({ chat_id: activeChat.id, role: 'model', content: output })
        .select().single();
      if (aiMsg) setMessages(prev => [...prev, aiMsg]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    const userMessage = input;
    setInput('');
    setLoading(true);

    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({ chat_id: activeChat.id, role: 'user', content: userMessage })
      .select().single();
    if (savedMsg) setMessages(prev => [...prev, savedMsg]);

    const userLog = (await supabase.from('dictionary').select('word').eq('user_id', profile.id)).data?.map(d => d.word) || [];
    const result = await geminiService.generateAndExtract(userMessage, mode, userLog);

    const { data: aiMsg } = await supabase
      .from('messages')
      .insert({ chat_id: activeChat.id, role: 'model', content: result.text })
      .select().single();
    if (aiMsg) setMessages(prev => [...prev, aiMsg]);

    if (messages.length === 0) {
        const title = await geminiService.generateTitle(userMessage);
        await supabase.from('chats').update({ title }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
    }

    setLoading(false);
  };

  const startLiveSession = async (useVideo: boolean = false) => {
    setIsLive(true);
    setIsCameraOn(useVideo);
    
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: useVideo 
    });
    streamRef.current = stream;

    if (useVideo && videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          const source = audioContextInRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContextInRef.current!.destination);

          if (useVideo) {
            const interval = setInterval(() => {
              if (!isLive) { clearInterval(interval); return; }
              const canvas = canvasRef.current;
              const video = videoRef.current;
              if (canvas && video && video.readyState === video.HAVE_ENOUGH_DATA) {
                const ctx = canvas.getContext('2d');
                canvas.width = 320;
                canvas.height = 240;
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                sessionPromise.then(session => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
              }
            }, 500);
          }
        },
        onmessage: async (msg) => {
          // Handle transcriptions for persistence
          if (msg.serverContent?.inputTranscription) {
            currentInputTranscription.current += msg.serverContent.inputTranscription.text;
          }
          if (msg.serverContent?.outputTranscription) {
            currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
          }
          if (msg.serverContent?.turnComplete) {
            const userText = currentInputTranscription.current;
            const aiText = currentOutputTranscription.current;
            saveLiveTurnToDb(userText, aiText);
            currentInputTranscription.current = '';
            currentOutputTranscription.current = '';
          }

          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData && audioContextOutRef.current) {
            const buffer = await decodeAudioData(decode(audioData), audioContextOutRef.current, 24000, 1);
            const source = audioContextOutRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextOutRef.current.destination);
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            activeSourcesRef.current.add(source);
            source.onended = () => activeSourcesRef.current.delete(source);
          }
          if (msg.serverContent?.interrupted) {
            activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
            });
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => stopLiveSession(),
        onerror: (e) => console.error("Live Error", e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are in ${mode} mode. ${
          mode === 'listen' ? 'Translate what you hear into English and Polish.' :
          mode === 'tutor' ? 'Coach the user on their Polish vocabulary.' :
          'Chat naturally in English and Polish to help the user learn.'
        }. Keep your responses cute and helpful. You are a live assistant for a couple learning together.`
      }
    });

    sessionRef.current = await sessionPromise;
  };

  const stopLiveSession = () => {
    setIsLive(false);
    setIsCameraOn(false);
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
  };

  return (
    <div className="flex h-full bg-[#fdfcfd] relative overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-100 flex flex-col hidden lg:flex bg-white shadow-sm z-10">
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={() => createNewChat(mode)} 
            className="w-full bg-[#FF4761] hover:bg-[#E63E56] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95"
          >
            <ICONS.Plus className="w-5 h-5" /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <button 
                key={chat.id} 
                onClick={() => setActiveChat(chat)} 
                className={`w-full text-left p-3 rounded-xl transition-all ${activeChat?.id === chat.id ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <div className="truncate text-sm font-semibold">{chat.title}</div>
              <div className="text-[10px] uppercase text-gray-400 mt-1 font-bold flex justify-between">
                <span>{chat.mode}</span>
                <span>{new Date(chat.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['listen', 'chat', 'tutor'] as ChatMode[]).map(m => (
              <button 
                key={m} 
                onClick={() => { setMode(m); createNewChat(m); }} 
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-white shadow-md text-[#FF4761]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{profile.role}</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcf9f9]">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-400">
                <ICONS.Heart className="w-10 h-10 fill-rose-200" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-header text-[#292F36] mb-2">Cześć!</h3>
                <p className="text-gray-400 text-sm font-medium">Ready to master Polish with your favorite person? Try Voice mode for a more romantic vibe!</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[1.5rem] px-5 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#FF4761] text-white rounded-tr-none' 
                    : 'bg-white border border-rose-50 text-gray-800 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{msg.content}</p>
                <div className={`text-[9px] mt-1 opacity-40 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-rose-100 px-4 py-2 rounded-2xl flex gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Live Interface */}
        {isLive && (
          <div className="absolute inset-0 z-50 bg-[#FF4761] flex flex-col items-center justify-center p-8 text-white animate-in fade-in zoom-in duration-300">
            <div className="relative mb-12">
              <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <ICONS.Mic className="w-16 h-16 text-white" />
              </div>
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full animate-ping"></div>
            </div>
            {isCameraOn && (
              <div className="mb-12 w-full max-w-sm aspect-video bg-black rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            <h2 className="text-3xl font-bold font-header mb-2 text-center">Gemini is listening...</h2>
            <p className="text-white/70 font-bold mb-16 uppercase tracking-widest text-xs">Transcriptions will be saved to chat</p>
            <button onClick={stopLiveSession} className="bg-white text-[#FF4761] px-14 py-4 rounded-3xl font-black shadow-2xl active:scale-95 transition-all text-lg">
              End Live Call
            </button>
          </div>
        )}

        {/* Bottom Menu & Input Area */}
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex gap-4 items-end relative">
            
            {/* The + Expansion Logic */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl rotate-45 transform active:scale-90 ${
                      isMenuOpen ? 'bg-[#FF4761] text-white rotate-[225deg]' : 'bg-[#FF4761] text-white'
                  }`}
                >
                  {isMenuOpen ? <ICONS.X className="w-8 h-8 rotate-[-180deg]" /> : <ICONS.Plus className="w-8 h-8 rotate-[-45deg]" />}
                </button>
                
                {/* Menu Expansion Cards (Matching Screenshot Design) */}
                {isMenuOpen && (
                  <div className="absolute bottom-20 left-0 flex flex-col gap-4 animate-in slide-in-from-bottom-6 fade-in duration-200 z-50">
                    <button 
                      onClick={() => { startLiveSession(false); setIsMenuOpen(false); }} 
                      className="bg-white p-2 rounded-[1.5rem] flex items-center gap-4 shadow-2xl border border-rose-50 w-52 hover:bg-rose-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#FF4761]">
                        <ICONS.Mic className="w-6 h-6" />
                      </div>
                      <span className="font-black text-[#292F36] text-sm">Live Voice</span>
                    </button>

                    <button 
                      onClick={() => { startLiveSession(true); setIsMenuOpen(false); }} 
                      className="bg-white p-2 rounded-[1.5rem] flex items-center gap-4 shadow-2xl border border-rose-50 w-52 hover:bg-teal-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-[#E0F9F5] rounded-2xl flex items-center justify-center text-[#47CDBA]">
                        <ICONS.Camera className="w-6 h-6" />
                      </div>
                      <span className="font-black text-[#292F36] text-sm">Live Video</span>
                    </button>

                    <button 
                      className="bg-white p-2 rounded-[1.5rem] flex items-center gap-4 shadow-2xl border border-rose-50 w-52 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-[#E5F2FF] rounded-2xl flex items-center justify-center text-[#4791FF]">
                        <div className="w-5 h-7 border-2 border-[#4791FF] rounded-sm"></div>
                      </div>
                      <span className="font-black text-[#292F36] text-sm">Image / File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dedicated Live Voice shortcut button next to + button as requested */}
              <button 
                onClick={() => startLiveSession(false)} 
                className="w-14 h-14 bg-rose-50 text-[#FF4761] rounded-2xl flex items-center justify-center shadow-lg hover:bg-rose-100 transition-all transform active:scale-95"
                title="Quick Live Voice"
              >
                <ICONS.Mic className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 relative flex items-center">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..." 
                className="w-full px-6 py-4 bg-[#F2F4F7] border-none rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-rose-200 text-[15px] font-bold text-gray-700 placeholder:text-gray-400"
              />
            </div>
            
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="w-14 h-14 bg-[#FF4761] text-white rounded-full shadow-xl shadow-rose-100 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            >
              <ICONS.Play className="w-6 h-6 fill-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
