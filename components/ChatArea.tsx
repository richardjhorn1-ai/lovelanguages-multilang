
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { geminiService, Attachment, ExtractedWord, SessionContext, ProposedAction } from '../services/gemini';
import { LiveSession, LiveSessionState } from '../services/live-session';
import { GladiaSession, GladiaState, TranscriptChunk } from '../services/gladia-session';
import { Profile, Chat, Message, ChatMode, WordType } from '../types';
import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../services/sounds';
import { speak } from '../services/audio';
import NewWordsNotification from './NewWordsNotification';
import { ChatEmptySuggestions } from './ChatEmptySuggestions';
import { sanitizeHtml, escapeHtml } from '../utils/sanitize';
import { ThinkingIndicator } from './ThinkingIndicator';
import { CoachActionConfirmModal } from './CoachActionConfirmModal';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';

// Listen session types
interface TranscriptEntry {
  id: string;
  speaker: string;
  word: string;          // Target language text (was 'polish')
  translation: string;   // Native language translation (was 'english')
  timestamp: number;
  isBookmarked: boolean;
  isFinal: boolean;
  language?: string;  // 'target' | 'native' | 'mixed' or legacy language code
}

// Normalize old session data (polish/english) to new format (word/translation)
// Provides backward compatibility for sessions saved before multi-language update
function normalizeTranscriptEntries(entries: any[]): TranscriptEntry[] {
  if (!entries || !Array.isArray(entries)) return [];
  return entries.map(e => ({
    id: e.id || `entry_${Date.now()}`,
    speaker: e.speaker || 'speaker_0',
    word: e.word || e.polish || e.text || '',           // Support: word, polish, text
    translation: e.translation || e.english || '',      // Support: translation, english
    timestamp: e.timestamp || Date.now(),
    isBookmarked: e.isBookmarked || false,
    isFinal: e.isFinal !== false,
    language: e.language,
  }));
}

// Get flag emoji for detected language
function getLanguageFlag(lang?: string): string {
  switch (lang) {
    case 'pl': return '🇵🇱';
    case 'en': return '🇬🇧';
    case 'de': return '🇩🇪';
    case 'fr': return '🇫🇷';
    case 'es': return '🇪🇸';
    case 'it': return '🇮🇹';
    case 'ru': return '🇷🇺';
    case 'uk': return '🇺🇦';
    case 'zh': return '🇨🇳';
    case 'ja': return '🇯🇵';
    case 'ko': return '🇰🇷';
    case 'pt': return '🇵🇹';
    case 'nl': return '🇳🇱';
    case 'cs': return '🇨🇿';
    case 'sv': return '🇸🇪';
    default: return '🗣️';  // Generic speech for unknown
  }
}

interface ListenSession {
  id: string;
  user_id: string;
  context_label: string | null;
  duration_seconds: number;
  transcript: TranscriptEntry[];
  bookmarked_phrases: TranscriptEntry[];
  created_at: string;
}

// Note: Speaker diarization not supported in Gladia live streaming
// All transcripts attributed to single speaker, so we use accent color styling

const parseMarkdown = (text: string) => {
  if (!text) return '';

  // Step 1: Clean legacy CSS artifacts from stored messages (before escaping)
  let clean = text
    .split('(#FF4761) font-semibold">').join('')
    .split('(#FF4761)font-semibold">').join('')
    .split('#FF4761) font-semibold">').join('')
    .split('font-semibold">').join('')
    .split('font-semibold>').join('');

  clean = clean
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    .replace(/font-semibold["'>:\s]*/gi, '')
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Step 2: Escape HTML to prevent XSS injection
  clean = escapeHtml(clean);

  // Step 3: Apply safe markdown transformations (on escaped text)
  // Pronunciation: subtle italic gray
  clean = clean.replace(/\[(.*?)\]/g, '<span class="text-gray-400 italic text-scale-label">($1)</span>');
  // Target language words: accent color semi-bold highlight + clickable for TTS
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="tts-word" data-word="$1" style="color: var(--accent-color); font-weight: 600; cursor: pointer;">$1</strong>');
  // Line breaks
  clean = clean.replace(/\n/g, '<br />');

  // Step 4: Final sanitization with DOMPurify
  return sanitizeHtml(clean);
};

const CultureCard: React.FC<{ title: string; content: string; t: (key: string) => string }> = ({ title, content, t }) => (
  <div className="my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg-card)] border border-[var(--accent-border)] shadow-sm w-full">
    <div className="bg-[var(--accent-light)] px-4 py-2 border-b border-[var(--accent-border)] flex items-center gap-2">
      <ICONS.Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
      <h3 className="text-scale-caption font-black uppercase tracking-widest text-[var(--accent-color)]">{title || t('chat.blocks.cultureNote')}</h3>
    </div>
    <div className="p-4 text-scale-label text-[var(--text-secondary)] leading-relaxed">
      <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
    </div>
  </div>
);

const DrillCard: React.FC<{ content: string; t: (key: string) => string }> = ({ content, t }) => (
  <div className="my-4 rounded-2xl border-2 border-dashed border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/20 p-1 relative w-full">
    <div className="absolute -top-3 left-4 bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300 text-scale-micro font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-700">
      {t('chat.blocks.loveGoal')}
    </div>
    <div className="p-4 text-scale-label text-[var(--text-primary)] font-medium">
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
    <div className="my-4 overflow-hidden rounded-xl border border-[var(--border-color)] shadow-sm bg-[var(--bg-card)] w-full overflow-x-auto">
      <table className="w-full text-scale-label text-left">
        <thead className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-scale-micro uppercase font-bold tracking-wider">
          <tr>{header.map((h, i) => <th key={i} className="px-4 py-3 font-black">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {body.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--bg-primary)]/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-[var(--text-secondary)] font-medium" dangerouslySetInnerHTML={{ __html: parseMarkdown(cell) }} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RichMessageRenderer: React.FC<{ content: string; t: (key: string) => string; targetLanguage?: string }> = ({ content, t, targetLanguage }) => {
  const parts = content.split(/(:::\s*[a-z]+.*)/i);
  let currentBlockType = 'text';
  let currentBlockTitle = '';

  // Handle click on foreign words to trigger TTS
  const handleTTSClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tts-word') && targetLanguage) {
      const word = target.dataset.word;
      if (word) speak(word, targetLanguage);
    }
  };

  return (
    <div className="space-y-2 w-full break-words" onClick={handleTTSClick}>
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
          return <CultureCard key={index} title={currentBlockTitle || type} content={trimmed} t={t} />;
        }
        if (currentBlockType === 'drill') {
          currentBlockType = 'text';
          return <DrillCard key={index} content={trimmed} t={t} />;
        }
        if (currentBlockType === 'table') {
          currentBlockType = 'text';
          return <GrammarTable key={index} content={trimmed} />;
        }
        return <div key={index} className="text-scale-label leading-relaxed text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }} />;
      })}
    </div>
  );
};

interface ChatAreaProps {
  profile: Profile;
}

const ChatArea: React.FC<ChatAreaProps> = ({ profile }) => {
  const { t } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // Default mode based on role: tutors use 'coach', students use 'ask'
  const [mode, setMode] = useState<ChatMode>(profile.role === 'tutor' ? 'coach' : 'ask');
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

  // Theme
  const { accentHex } = useTheme();

  // Language
  const { languageParams, targetLanguage, nativeLanguage, targetFlag, targetName, nativeFlag } = useLanguage();

  // Offline state
  const { isOnline, cachedWordCount, lastSyncTime } = useOffline(profile.id, targetLanguage);

  // Track voice session messages for post-session extraction
  const voiceSessionStartIdx = useRef<number>(0);

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Listen mode state
  const [listenSessions, setListenSessions] = useState<ListenSession[]>([]);
  const [activeListenSession, setActiveListenSession] = useState<ListenSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [listenState, setListenState] = useState<GladiaState>('disconnected');
  const [listenEntries, setListenEntries] = useState<TranscriptEntry[]>([]);
  const [listenPartial, setListenPartial] = useState<TranscriptEntry | null>(null);
  const [listenDuration, setListenDuration] = useState(0);
  const [listenContextLabel, setListenContextLabel] = useState('');
  const [showListenPrompt, setShowListenPrompt] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [showWordExtractor, setShowWordExtractor] = useState(false);
  const [extractedWords, setExtractedWords] = useState<any[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [extractedSessionIds, setExtractedSessionIds] = useState<Set<string>>(new Set());
  const gladiaRef = useRef<GladiaSession | null>(null);
  const listenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session context - loaded once, reused for all chat messages
  const sessionContextRef = useRef<SessionContext | null>(null);
  const contextLoadedRef = useRef(false);

  // Coach mode state
  const [isThinking, setIsThinking] = useState(false);
  const [pendingAction, setPendingAction] = useState<ProposedAction | null>(null);
  const [showActionConfirm, setShowActionConfirm] = useState(false);

  // Boot session on mount - fetch context once
  useEffect(() => {
    const bootSession = async () => {
      if (contextLoadedRef.current) return;
      const context = await geminiService.bootSession();
      if (context) {
        sessionContextRef.current = context;
        contextLoadedRef.current = true;
      }
    };
    bootSession();
  }, []);

  // Invalidate context when vocabulary changes
  useEffect(() => {
    const invalidateContext = () => {
      contextLoadedRef.current = false;
      sessionContextRef.current = null;
      // Re-boot after invalidation
      geminiService.bootSession().then(context => {
        if (context) {
          sessionContextRef.current = context;
          contextLoadedRef.current = true;
        }
      });
    };

    window.addEventListener('dictionary-updated', invalidateContext);

    return () => {
      window.removeEventListener('dictionary-updated', invalidateContext);
    };
  }, []);

  useEffect(() => { fetchChats(); fetchListenSessions(); }, [profile]);
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      // Tutors always use 'coach' mode, students use chat's saved mode
      setMode(profile.role === 'tutor' ? 'coach' : activeChat.mode);
    }
  }, [activeChat, profile.role]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, streamingText, listenEntries]);

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', profile.id).eq('language_code', targetLanguage).order('created_at', { ascending: false });
    if (data) {
        setChats(data);
        if (data.length > 0 && !activeChat && !activeListenSession) setActiveChat(data[0]);
    }
    // Create initial chat - everyone starts in Ask mode
    if (!data || data.length === 0) createNewChat('ask');
  };

  const fetchListenSessions = async () => {
    const { data } = await supabase.from('listen_sessions').select('*').eq('user_id', profile.id).eq('language_code', targetLanguage).order('created_at', { ascending: false });
    if (data) {
      setListenSessions(data);
    }
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
    if (!confirm(t('chat.session.deleteConfirm'))) return;
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

    // Get list of words we're trying to save
    const wordStrings = words.map(w => w.word.toLowerCase().trim());

    // Check which words already exist in the dictionary
    const { data: existingWords } = await supabase
      .from('dictionary')
      .select('word')
      .eq('user_id', profile.id)
      .in('word', wordStrings);

    const existingWordSet = new Set((existingWords || []).map(w => w.word.toLowerCase()));
    const newWordCount = wordStrings.filter(w => !existingWordSet.has(w)).length;

    const wordsToSave = words.map(w => ({
      user_id: profile.id,
      word: w.word.toLowerCase().trim(),
      translation: w.translation,
      word_type: w.type as WordType,
      pronunciation: w.pronunciation || null,
      gender: w.gender || null,
      plural: w.plural || null,
      conjugations: w.conjugations || null,
      adjective_forms: w.adjectiveForms || null,
      example_sentence: w.examples?.[0] || w.context || null,
      pro_tip: w.proTip || null,
      notes: w.context || null,
      language_code: targetLanguage,
      source: 'chat'
    }));

    const { error } = await supabase
      .from('dictionary')
      .upsert(wordsToSave, {
        onConflict: 'user_id,word,language_code',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to save words:', error);
      return;
    }

    // Notify Love Log to refresh
    window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count: words.length } }));

    // Increment XP only for NEW words (1 XP per new word)
    if (newWordCount > 0) {
      await geminiService.incrementXP(newWordCount);
    }
  };

  const handleSend = async (directMessage?: string) => {
    const messageToSend = directMessage || input;
    if ((!messageToSend.trim() && attachments.length === 0) || !activeChat || loading) return;
    const userMessage = messageToSend;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setLoading(true);
    setStreamingText('');

    // ACT 1: SAVE USER MESSAGE
    await saveMessage('user', currentAttachments.length > 0 ? `${userMessage} [Media Attached]`.trim() : userMessage);

    const userWords = messages.map(m => m.content);
    const messageHistory = messages.map(m => ({ role: m.role, content: m.content }));

    let replyText: string;
    let newWords: ExtractedWord[] = [];

    // ACT 2: FETCH AI REPLY
    // Use non-streaming for: images OR coach mode (coach needs structured output)
    console.log('[ChatArea] handleSend - mode:', mode, 'attachments:', currentAttachments.length, 'sessionContext.role:', sessionContextRef.current?.role);

    if (currentAttachments.length > 0 || mode === 'coach') {
      console.log('[ChatArea] Using NON-STREAMING path (generateReply)');
      setIsThinking(true);

      const result = await geminiService.generateReply(
        userMessage,
        mode,
        currentAttachments,
        userWords,
        messageHistory,
        sessionContextRef.current,
        languageParams
      );

      console.log('[ChatArea] generateReply result:', { replyText: result.replyText?.slice(0, 100), newWords: result.newWords?.length, proposedAction: result.proposedAction });

      setIsThinking(false);
      replyText = result.replyText;
      newWords = result.newWords;

      // Handle proposed action from coach mode
      if (result.proposedAction) {
        console.log('[ChatArea] Got proposedAction:', result.proposedAction);
        setPendingAction(result.proposedAction);
        setShowActionConfirm(true);
      }
    } else {
      console.log('[ChatArea] Using STREAMING path (generateReplyStream)');
      // Use streaming for text-only student messages (shows typing effect)
      replyText = await geminiService.generateReplyStream(
        userMessage,
        mode,
        userWords,
        messageHistory,
        languageParams,
        (chunk) => setStreamingText(prev => prev + chunk)
      );

      // Clear streaming UI immediately after stream completes
      setStreamingText('');
    }

    // ACT 3: SAVE MODEL REPLY
    await saveMessage('model', replyText);

    // Release loading state immediately so user can send next message
    setLoading(false);

    // ACT 4: BACKGROUND TASKS (don't block user input)
    // Extract vocabulary for student modes only (tutors don't add to Love Log)
    if (mode !== 'coach') {
      if (currentAttachments.length === 0) {
        // Streaming path - extract vocabulary from conversation
        geminiService.analyzeHistory(
          [...messageHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: replyText }],
          userWords,
          languageParams
        ).then(extracted => {
          if (extracted.length > 0) {
            saveExtractedWords(extracted).catch(console.error);
            setNewWordsNotification(extracted);
            setTimeout(() => setNewWordsNotification([]), 5000);
          }
        }).catch(console.error);
      } else if (newWords.length > 0) {
        // Image path - words already extracted in generateReply
        saveExtractedWords(newWords).catch(console.error);
        setNewWordsNotification(newWords);
        setTimeout(() => setNewWordsNotification([]), 5000);
      }
    }

    // Generate title in background if needed
    if (activeChat.title === 'New Session') {
      geminiService.generateTitle(userMessage).then(async title => {
        await supabase.from('chats').update({ title }).eq('id', activeChat.id);
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title } : c));
      }).catch(console.error);
    }
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
        targetLanguage: targetLanguage,
        nativeLanguage: nativeLanguage,
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
          knownWords,
          languageParams
        );

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

  // Handle coach action confirmation
  const handleConfirmAction = async (modifiedAction: ProposedAction, createLinkedChallenge: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Please log in to continue');
    }

    const response = await fetch('/api/execute-coach-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: modifiedAction,
        createLinkedChallenge
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to execute action');
    }

    // Add confirmation to chat
    await saveMessage('model', `✅ ${result.message}`);

    setShowActionConfirm(false);
    setPendingAction(null);
  };

  const createNewChat = async (selectedMode: ChatMode) => {
    const { data } = await supabase.from('chats').insert({ user_id: profile.id, title: 'New Session', mode: selectedMode, language_code: targetLanguage }).select().single();
    if (data) {
        setChats(prev => [data, ...prev]);
        setActiveChat(data);
        setActiveListenSession(null);
        setMessages([]);
        setMode(selectedMode);
    }
  };

  // ========== LISTEN MODE FUNCTIONS ==========

  // Note: getSpeakerInfo removed - speaker diarization not supported in Gladia live
  // All entries use accent color styling

  // Format duration as MM:SS
  const formatListenDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle transcript from Gladia
  const handleListenTranscript = useCallback((chunk: TranscriptChunk) => {
    // Filter out background sounds like [MUZYKA], [music], [silence], etc.
    const backgroundSoundPattern = /^\s*\[.*\]\s*$/i;
    if (backgroundSoundPattern.test(chunk.text)) {
      return; // Skip non-speech audio events
    }

    const entry: TranscriptEntry = {
      id: chunk.id,
      speaker: chunk.speaker,
      word: chunk.text,
      translation: chunk.translation || '',
      timestamp: chunk.timestamp,
      isBookmarked: false,
      isFinal: chunk.isFinal,
      language: chunk.language,
    };

    if (chunk.isFinal) {
      setListenEntries(prev => {
        // Find last entry from same speaker (ES5-compatible)
        let lastSameSpeakerIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].speaker === chunk.speaker) {
            lastSameSpeakerIdx = i;
            break;
          }
        }

        if (lastSameSpeakerIdx >= 0) {
          const lastEntry = prev[lastSameSpeakerIdx];
          const isExtension = entry.word.startsWith(lastEntry.word.slice(0, 10)) ||
                             lastEntry.word.startsWith(entry.word.slice(0, 10)) ||
                             entry.word.length > lastEntry.word.length;
          const isRecent = entry.timestamp - lastEntry.timestamp < 10000;

          if (isExtension && isRecent && !lastEntry.isBookmarked) {
            const updated = [...prev];
            updated[lastSameSpeakerIdx] = { ...entry, isBookmarked: lastEntry.isBookmarked };
            return updated;
          }
        }

        const filtered = prev.filter(e => e.isFinal || e.speaker !== chunk.speaker);
        return [...filtered, entry];
      });
      setListenPartial(null);
    } else {
      setListenPartial(entry);
    }

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  // Start listening
  const startListening = async () => {
    // Play recording start sound
    sounds.play('record-start');

    setShowListenPrompt(false);
    setListenError(null);
    setListenEntries([]);
    setListenPartial(null);
    setListenDuration(0);
    setActiveChat(null);
    setActiveListenSession(null);
    setIsListening(true);

    try {
      gladiaRef.current = new GladiaSession({
        onTranscript: handleListenTranscript,
        onStateChange: (state) => {
          setListenState(state);
        },
        onError: (err) => {
          console.error('[Listen] Error:', err);
          setListenError(err.message);
        },
        onClose: () => {
          // Session closed - handled by stopListening
        },
        targetLanguage,
        nativeLanguage,
      });

      await gladiaRef.current.connect();

      listenTimerRef.current = setInterval(() => {
        setListenDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setListenError(err.message || 'Failed to start listening');
      setIsListening(false);
    }
  };

  // Stop listening and save session
  const stopListening = async () => {
    // Play recording stop sound
    sounds.play('record-stop');

    gladiaRef.current?.disconnect();
    gladiaRef.current = null;

    if (listenTimerRef.current) {
      clearInterval(listenTimerRef.current);
      listenTimerRef.current = null;
    }

    // Save session if we have entries
    if (listenEntries.length > 0) {
      const bookmarkedPhrases = listenEntries.filter(e => e.isBookmarked);

      // Save raw session first
      const { data, error } = await supabase.from('listen_sessions').insert({
        user_id: profile.id,
        context_label: listenContextLabel.trim() || null,
        duration_seconds: listenDuration,
        transcript: listenEntries,
        bookmarked_phrases: bookmarkedPhrases,
        detected_words: [],
      }).select().single();

      if (!error && data) {
        setListenSessions(prev => [data, ...prev]);
        setActiveListenSession(data);

        // Start post-processing in background
        setIsProcessingTranscript(true);
        processTranscript(data.id, listenEntries, listenContextLabel);
      }
    }

    setIsListening(false);
    setListenContextLabel('');
  };

  // Post-process transcript with Gemini
  const processTranscript = async (sessionId: string, entries: TranscriptEntry[], contextLabel: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          transcript: entries.map(e => ({
            id: e.id,
            speaker: e.speaker,
            text: e.word,
            language: e.language,
            timestamp: e.timestamp
          })),
          contextLabel: contextLabel,
          ...languageParams
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Update entries with processed data, using the index from API response
        const processedEntries = entries.map((entry, idx) => {
          const processed = result.processedTranscript.find((p: any) => p.index === idx);
          if (processed) {
            return {
              ...entry,
              word: processed.text,
              translation: processed.translation || entry.translation || '',
              language: processed.language,
              originalText: processed.originalText,
            };
          }
          return entry;
        });

        // Update local state
        setListenEntries(processedEntries);

        // Update the session in database (note: summary not stored - table has no summary column)
        await supabase.from('listen_sessions').update({
          transcript: processedEntries,
        }).eq('id', sessionId);

        // Update sessions list
        setListenSessions(prev => prev.map(s =>
          s.id === sessionId ? { ...s, transcript: processedEntries } : s
        ));
        setActiveListenSession(prev =>
          prev?.id === sessionId ? { ...prev, transcript: processedEntries } : prev
        );
      } else {
        const errorText = await response.text();
        console.error('[processTranscript] API error:', response.status, errorText);
      }
    } catch (err) {
      console.error('[processTranscript] Failed:', err);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  // Extract words from listen session using analyze-history API
  const extractWordsFromSession = async () => {
    if (!activeListenSession || listenEntries.length === 0) {
      return;
    }

    setShowWordExtractor(true);
    setExtractedWords([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[extractWords] No auth session');
        return;
      }

      // Format transcript as messages for the analyze-history API
      const messages = listenEntries
        .filter(e => e.language === 'target' || e.translation) // Focus on target language content
        .map(e => ({
          role: 'assistant',
          content: e.translation
            ? `${e.word} (${e.translation})`
            : e.word
        }));

      // Get user's current words to avoid duplicates
      const { data: existingWords } = await supabase
        .from('dictionary')
        .select('word')
        .eq('user_id', profile.id);

      const currentWords = (existingWords || []).map((w: any) => w.word);

      const response = await fetch('/api/analyze-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages, currentWords, ...languageParams })
      });

      if (response.ok) {
        const result = await response.json();
        const words = result.newWords || [];
        setExtractedWords(words);
        // Select all words by default
        setSelectedWords(new Set(words.map((w: any) => w.word)));
      } else {
        const errorText = await response.text();
        console.error('[extractWords] API error:', response.status, errorText);
      }
    } catch (err) {
      console.error('[extractWords] Failed:', err);
    }
  };

  // Add selected words to dictionary
  const [isAddingWords, setIsAddingWords] = useState(false);
  const addSelectedWordsToDictionary = async () => {
    const wordsToAdd = extractedWords.filter(w => selectedWords.has(w.word));
    if (wordsToAdd.length === 0) {
      setShowWordExtractor(false);
      return;
    }

    setIsAddingWords(true);
    try {
      const entries = wordsToAdd.map(word => ({
        user_id: profile.id,
        word: word.word.toLowerCase().trim(),
        translation: word.translation,
        word_type: word.type || 'phrase',
        pronunciation: word.pronunciation || null,
        gender: word.gender || null,
        plural: word.plural || null,
        conjugations: word.conjugations || null,
        adjective_forms: word.adjectiveForms || null,
        example_sentence: word.examples?.[0] || null,
        pro_tip: word.proTip || null,
        language_code: targetLanguage,
        source: 'listen'
      }));

      // Use upsert to handle duplicates - update existing words with new context
      const { data, error } = await supabase.from('dictionary').upsert(entries, {
        onConflict: 'user_id,word,language_code',
        ignoreDuplicates: false  // Update existing entries with new data
      }).select();

      if (error) {
        console.error('Supabase error adding words:', error);
        alert(t('chat.errors.addWordsFailed', { message: error.message }));
      } else {
        // Play new words sound
        sounds.play('new-words');
        setShowWordExtractor(false);
        setExtractedWords([]);
        setSelectedWords(new Set());
        // Mark this session as having words extracted
        if (activeListenSession?.id) {
          setExtractedSessionIds(prev => new Set([...prev, activeListenSession.id]));
        }
        // Dispatch event for Love Log to refresh
        window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count: data?.length || 0 } }));
      }
    } catch (err) {
      console.error('Failed to add words:', err);
      alert(t('chat.errors.addWordsError'));
    } finally {
      setIsAddingWords(false);
    }
  };

  // Toggle bookmark on listen entry
  const toggleListenBookmark = (entryId: string) => {
    setListenEntries(prev =>
      prev.map(e =>
        e.id === entryId ? { ...e, isBookmarked: !e.isBookmarked } : e
      )
    );
  };

  // Select a listen session from sidebar
  const selectListenSession = (session: ListenSession) => {
    setActiveChat(null);
    setActiveListenSession(session);
    // Normalize transcript for backward compatibility (old sessions may have polish/english fields)
    setListenEntries(normalizeTranscriptEntries(session.transcript));
    setListenDuration(session.duration_seconds);
    setListenContextLabel(session.context_label || '');
    setIsMobileSidebarOpen(false);
  };

  // Delete a listen session
  const deleteListenSession = async (id: string) => {
    if (!confirm(t('chat.listen.deleteConfirm'))) return;
    const { error } = await supabase.from('listen_sessions').delete().eq('id', id);
    if (!error) {
      setListenSessions(prev => prev.filter(s => s.id !== id));
      if (activeListenSession?.id === id) {
        setActiveListenSession(null);
        if (chats.length > 0) setActiveChat(chats[0]);
      }
    }
  };

  // Combined sidebar items (chats + listen sessions) sorted by date
  const sidebarItems = [
    ...chats.map(c => ({ ...c, type: 'chat' as const })),
    ...listenSessions.map(s => ({
      ...s,
      type: 'listen' as const,
      title: s.context_label || 'Listen Session',
      mode: 'listen' as const
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Get bookmarked count for listen mode
  const listenBookmarkedCount = listenEntries.filter(e => e.isBookmarked).length;

  return (
    <div className="flex h-full bg-[var(--bg-primary)] relative overflow-hidden font-header">
      {/* Sidebar with Actions - Collapsible */}
      <div className={`border-r border-[var(--border-color)] hidden lg:flex flex-col bg-[var(--bg-card)] transition-all duration-300 ${isSidebarCollapsed ? 'w-14' : 'w-64'}`}>
        {/* Header */}
        <div className={`p-2 md:p-3 border-b border-[var(--border-color)] flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
          {/* Collapsed: Just the new chat button at top */}
          {isSidebarCollapsed ? (
            <button
              onClick={() => createNewChat(mode)}
              className="w-10 h-10 text-white rounded-xl font-bold shadow-sm flex items-center justify-center transition-all"
              style={{ backgroundColor: accentHex }}
              title={t('chat.sidebar.newSession')}
            >
              <ICONS.Plus className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button onClick={() => createNewChat(mode)} className="flex-1 text-white rounded-xl py-2.5 font-bold text-scale-label shadow-sm flex items-center justify-center gap-2 transition-all" style={{ backgroundColor: accentHex }}>
                <ICONS.Plus className="w-4 h-4" /> {t('chat.sidebar.newSession')}
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2 rounded-xl hover:bg-[var(--bg-primary)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title={t('chat.sidebar.collapse')}
              >
                <ICONS.ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Expanded: Full chat + listen session list */}
        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {sidebarItems.map(item => {
              const isActive = item.type === 'chat'
                ? activeChat?.id === item.id
                : activeListenSession?.id === item.id;
              const isListenItem = item.type === 'listen';

              return (
                <div
                  key={item.id}
                  className={`group w-full text-left p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-0.5 relative ${
                    isActive ? 'font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  }`}
                  style={isActive ? { backgroundColor: `${accentHex}15`, color: accentHex } : {}}
                  onClick={() => {
                    if (isListenItem) {
                      selectListenSession(item as ListenSession);
                    } else {
                      setActiveChat(item as Chat);
                      setActiveListenSession(null);
                    }
                  }}
                >
                  {editingChatId === item.id && !isListenItem ? (
                    <input
                      autoFocus
                      className="bg-[var(--bg-card)] border border-[var(--accent-border)] rounded px-1 text-scale-caption w-full outline-none text-[var(--text-primary)]"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onBlur={() => renameChat(item.id)}
                      onKeyDown={e => e.key === 'Enter' && renameChat(item.id)}
                    />
                  ) : (
                    <>
                      <span className="truncate text-scale-caption pr-12 flex items-center gap-1.5">
                        {isListenItem && <span>👂</span>}
                        {item.title}
                      </span>
                      <span className={`text-scale-micro uppercase tracking-widest opacity-60 font-black ${isListenItem ? 'text-blue-500' : ''}`}>
                        {isListenItem ? `listen • ${formatListenDuration((item as ListenSession).duration_seconds)}` : (item as Chat).mode}
                      </span>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isListenItem && (
                          <button onClick={(e) => { e.stopPropagation(); setEditingChatId(item.id); setNewTitle(item.title); }} className="p-1 hover:text-[var(--accent-color)] transition-colors">
                            <ICONS.Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isListenItem) {
                              deleteListenSession(item.id);
                            } else {
                              deleteChat(item.id);
                            }
                          }}
                          className="p-1 hover:text-red-500 transition-colors"
                        >
                          <ICONS.Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Mode Navigation */}
        <div className="p-2 md:p-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mobile: Hamburger menu button for conversation sidebar */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl hover:bg-[var(--bg-primary)] transition-all text-[var(--text-secondary)] flex items-center justify-center"
              title="Conversations"
            >
              <ICONS.Menu className="w-5 h-5" />
            </button>
            {/* Desktop: Expand sidebar button - only shown when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden lg:flex w-10 h-10 rounded-xl hover:bg-[var(--bg-primary)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] items-center justify-center"
                title={t('chat.sidebar.expand')}
              >
                <ICONS.ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center bg-[var(--bg-primary)] h-10 px-1 rounded-xl">
              {profile.role === 'tutor' ? (
                // Tutors see single Coach mode (always context-aware)
                <div className="px-4 py-1.5 rounded-lg text-scale-micro font-black uppercase tracking-widest bg-[var(--bg-card)] text-teal-500 shadow-sm">
                  {t('chat.modes.coach')}
                </div>
              ) : (
                // Students see Ask/Learn modes
                (['ask', 'learn'] as ChatMode[]).map(m => (
                  <button key={m} onClick={() => handleModeSwitch(m)} className={`px-4 py-1.5 rounded-lg text-scale-micro font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-[var(--bg-card)] shadow-sm' : 'text-[var(--text-secondary)]'}`} style={mode === m ? { color: accentHex } : {}}>{t(`chat.modes.${m}`)}</button>
                ))
              )}
            </div>
          </div>

          {/* Right side - Listen Mode button or indicator */}
          {isListening ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-scale-caption font-bold text-red-600 dark:text-red-400">
                  {t('chat.listen.recording')} {formatListenDuration(listenDuration)}
                </span>
              </div>
              <button
                onClick={stopListening}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-scale-caption font-bold hover:bg-red-600 transition-colors"
              >
                {t('chat.listen.stop')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowListenPrompt(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--accent-light)] transition-all text-[var(--text-secondary)] hover:text-[var(--accent-color)]"
              title={t('chat.listen.modeTooltip', { language: targetName })}
            >
              <span>👂</span>
              <span className="text-scale-caption font-bold hidden sm:inline">{t('chat.listen.title')}</span>
              <span className="text-scale-micro px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-bold">{t('chat.listen.beta')}</span>
            </button>
          )}
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <OfflineIndicator
              isOnline={isOnline}
              cachedWordCount={cachedWordCount}
              lastSyncTime={lastSyncTime}
              compact={true}
            />
          </div>
        )}

        {/* Messages / Listen Transcripts */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-6 bg-[var(--bg-primary)] no-scrollbar">
          {/* ========== LISTEN MODE VIEW ========== */}
          {(isListening || activeListenSession) ? (
            <>
              {/* Listen mode header info */}
              {activeListenSession && !isListening && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <span>👂</span>
                    <span className="text-scale-label font-medium text-blue-700 dark:text-blue-300">
                      {activeListenSession.context_label || t('chat.listen.sessionLabel')}
                    </span>
                    <span className="text-scale-caption text-blue-500">
                      {formatListenDuration(activeListenSession.duration_seconds)}
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state for listen mode */}
              {listenEntries.length === 0 && !listenPartial && isListening && (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-scale-label">
                  <div className="text-center">
                    <ICONS.Mic className="w-8 h-8 mx-auto mb-2 animate-pulse" style={{ color: accentHex }} />
                    <p>{t('chat.listen.listeningFor', { language: targetName })}</p>
                    {listenError && (
                      <p className="text-red-500 text-scale-caption mt-2">{listenError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Transcript entries - using accent color */}
              {listenEntries.map((entry) => (
                <div key={entry.id} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div
                    className="max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm rounded-tl-none border bg-[var(--accent-light)] border-[var(--accent-border)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-medium">
                          {getLanguageFlag(entry.language)} {entry.word}
                        </p>
                        {entry.translation && (
                          <div className="mt-1.5 ml-4 pl-3 border-l-2 border-[var(--accent-color)]/30">
                            <p className="text-[var(--text-secondary)] text-scale-label">
                              {nativeFlag} {entry.translation}
                            </p>
                          </div>
                        )}
                      </div>
                      {isListening && (
                        <button
                          onClick={() => toggleListenBookmark(entry.id)}
                          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                            entry.isBookmarked
                              ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400'
                              : 'hover:bg-white/50 dark:hover:bg-black/20 text-[var(--text-secondary)]'
                          }`}
                          title={entry.isBookmarked ? t('chat.listen.bookmarkRemove') : t('chat.listen.bookmarkAdd')}
                        >
                          <ICONS.Star className={`w-4 h-4 ${entry.isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      {!isListening && entry.isBookmarked && (
                        <ICONS.Star className="w-4 h-4 text-amber-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Partial (interim result) */}
              {listenPartial && (
                <div className="flex justify-start animate-in fade-in duration-200">
                  <div className="max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-3 rounded-tl-none border border-dashed border-[var(--accent-color)]/50 bg-[var(--accent-light)]/50">
                    <p className="text-[var(--text-secondary)] italic flex items-center gap-2">
                      {getLanguageFlag(listenPartial.language)} {listenPartial.word}
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Bookmark count footer for listen mode */}
              {isListening && listenBookmarkedCount > 0 && (
                <div className="text-center py-2">
                  <span className="inline-flex items-center gap-1 text-scale-caption text-amber-600 dark:text-amber-400">
                    <ICONS.Star className="w-3 h-3 fill-current" />
                    {t('chat.listen.bookmarked', { count: listenBookmarkedCount })}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ========== REGULAR CHAT VIEW ========== */}
              {/* Empty state with suggestions */}
              {messages.length === 0 && !loading && !streamingText && (
                <ChatEmptySuggestions
                  mode={mode}
                  role={profile.role}
                  onSuggestionClick={(text) => handleSend(text)}
                />
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl md:rounded-[1.5rem] px-3 py-2 md:px-5 md:py-3.5 shadow-sm ${m.role === 'user' ? 'text-white rounded-tr-sm md:rounded-tr-none font-medium' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm md:rounded-tl-none'}`} style={m.role === 'user' ? { backgroundColor: accentHex } : {}}>
                    {m.role === 'user' ? <p className="text-scale-label leading-relaxed">{m.content}</p> : <RichMessageRenderer content={m.content} t={t} targetLanguage={targetLanguage} />}
                  </div>
                </div>
              ))}

              {/* Encourage new chat after 50 messages */}
              {messages.length >= 50 && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--accent-light)] border border-[var(--accent-border)] rounded-xl text-scale-label">
                    <span className="text-[var(--text-secondary)]">{t('chat.session.longConversation')}</span>
                    <button
                      onClick={async () => {
                        const { data } = await supabase.from('chats').insert({ user_id: profile.id, title: 'New Session', mode, language_code: targetLanguage }).select().single();
                        if (data) { setActiveChat(data); setMessages([]); }
                      }}
                      className="px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
                      style={{ backgroundColor: accentHex }}
                    >
                      {t('chat.session.startFresh')}
                    </button>
                  </div>
                </div>
              )}

              {/* Streaming response */}
              {streamingText && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[90%] md:max-w-[85%] rounded-2xl md:rounded-[1.5rem] px-3 py-2 md:px-5 md:py-3.5 shadow-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm md:rounded-tl-none">
                    <RichMessageRenderer content={streamingText} t={t} targetLanguage={targetLanguage} />
                    <span className="inline-block w-2 h-4 ml-1 animate-pulse rounded-sm" style={{ backgroundColor: accentHex }}></span>
                  </div>
                </div>
              )}

              {/* Loading indicator (only show if not streaming) */}
              {loading && !streamingText && !isThinking && (
                <div className="flex gap-1.5 px-6">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: `${accentHex}80` }}></div>
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-75" style={{ backgroundColor: `${accentHex}80` }}></div>
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-150" style={{ backgroundColor: `${accentHex}80` }}></div>
                </div>
              )}

              {/* Coach mode thinking indicator */}
              {isThinking && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ThinkingIndicator partnerName={sessionContextRef.current?.partnerName || undefined} />
                </div>
              )}

              {/* Live Voice - User transcript bubble */}
              {liveUserText && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm text-white rounded-tr-none font-medium border-2 border-dashed" style={{ backgroundColor: `${accentHex}cc`, borderColor: accentHex }}>
                    <p className="text-scale-label leading-relaxed italic">{liveUserText}</p>
                    <span className="inline-block w-2 h-4 ml-1 bg-white/50 animate-pulse rounded-sm"></span>
                  </div>
                </div>
              )}

              {/* Live Voice - Model transcript bubble */}
              {liveModelText && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm bg-[var(--bg-card)] border-2 border-dashed border-teal-200 dark:border-teal-700 text-[var(--text-primary)] rounded-tl-none">
                    <p className="text-scale-label leading-relaxed">{liveModelText}</p>
                    <span className="inline-block w-2 h-4 ml-1 bg-teal-400 animate-pulse rounded-sm"></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Voice Status & Error */}
        {isLive && (
          <div className="px-4 pb-2 bg-[var(--bg-card)]">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              {/* Compact Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${
                liveState === 'listening'
                  ? 'bg-[var(--accent-light)] border-[var(--accent-border)]'
                  : liveState === 'speaking'
                  ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700'
                  : liveState === 'connecting'
                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
              }`}>
                {liveState === 'listening' && (
                  <>
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentHex }}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentHex, animationDelay: '0.1s' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentHex, animationDelay: '0.2s' }}></span>
                    </div>
                    <span className="text-scale-micro font-bold" style={{ color: accentHex }}>{t('chat.status.listening')}</span>
                  </>
                )}
                {liveState === 'speaking' && (
                  <>
                    <ICONS.Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                    <span className="text-scale-micro font-bold text-teal-600">{t('chat.status.speaking')}</span>
                  </>
                )}
                {liveState === 'connecting' && (
                  <>
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-scale-micro font-bold text-amber-600">{t('chat.status.connecting')}</span>
                  </>
                )}
              </div>

              {/* Error Display */}
              {liveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <ICONS.X className="w-3 h-3 text-red-500" />
                  <span className="text-scale-micro text-red-600">{liveError}</span>
                  <button onClick={() => setLiveError(null)} className="text-red-400 hover:text-red-600">
                    <ICONS.X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input - Hidden in listen mode */}
        {!isListening && !activeListenSession && (
          <div className="p-2 md:p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] relative safe-area-bottom shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-1.5 md:gap-3">
              {/* Attach button with popup */}
              <div className="relative shrink-0">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-3 md:gap-4 transition-all duration-300 z-20 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <button onClick={() => imgInputRef.current?.click()} className="w-10 h-10 md:w-14 md:h-14 bg-[var(--bg-card)] rounded-full flex items-center justify-center border-2 border-[var(--accent-border)] shadow-xl hover:scale-110 active:scale-95 transition-all" style={{ color: accentHex }}>
                    <ICONS.Image className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 md:w-14 md:h-14 bg-[var(--bg-card)] rounded-full flex items-center justify-center border-2 border-[var(--accent-border)] shadow-xl hover:scale-110 active:scale-95 transition-all" style={{ color: accentHex }}>
                    <ICONS.FileText className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  disabled={isLive}
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${isMenuOpen ? 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] rotate-45' : 'bg-[var(--bg-card)] border-[var(--accent-border)] hover:bg-[var(--accent-light)]'} disabled:opacity-50`}
                  style={!isMenuOpen ? { color: accentHex } : {}}
                >
                  <ICONS.Plus className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Microphone Button */}
              <button
                onClick={isLive ? stopLive : startLive}
                className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 shrink-0 ${
                  isLive
                    ? 'text-white'
                    : 'bg-[var(--bg-card)] border-[var(--accent-border)] hover:bg-[var(--accent-light)]'
                } ${liveState === 'listening' ? 'animate-pulse' : ''}`}
                style={isLive ? { backgroundColor: accentHex, borderColor: accentHex } : { color: accentHex }}
              >
                  <ICONS.Mic className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="flex-1 flex flex-col gap-2">
                  {attachments.length > 0 && (
                      <div className="flex gap-2 p-2 bg-[var(--bg-primary)] rounded-xl overflow-x-auto no-scrollbar">
                          {attachments.map((a, idx) => (
                              <div key={idx} className="relative group shrink-0">
                                  {a.mimeType.startsWith('image/') ? (
                                      <img src={`data:${a.mimeType};base64,${a.data}`} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
                                  ) : (
                                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-color)]">
                                          <ICONS.FileText className="w-4 h-4 md:w-5 md:h-5" />
                                      </div>
                                  )}
                                  <button onClick={() => setAttachments(p => p.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><ICONS.X className="w-3 h-3" /></button>
                              </div>
                          ))}
                      </div>
                  )}
                  <div className={`w-full flex items-center bg-[var(--bg-card)] rounded-full md:rounded-[2rem] px-4 py-2.5 md:px-6 md:py-4 transition-all duration-300 ${isLive ? 'border-2 border-[var(--accent-border)]' : 'border border-[var(--border-color)]'}`} style={isLive ? { boxShadow: `inset 0 0 20px var(--accent-shadow)` } : {}}>
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isLive && isOnline && handleSend()}
                        onFocus={() => {
                          // Auto-scroll to bottom when user focuses input
                          setTimeout(() => {
                            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                          }, 100);
                        }}
                        placeholder={!isOnline ? t('offline.chat_unavailable', 'Chat unavailable offline') : isLive ? (liveState === 'listening' ? t('chat.input.listeningPlaceholder') : liveState === 'speaking' ? t('chat.input.speakingPlaceholder') : t('chat.input.connectingPlaceholder')) : (profile.role === 'tutor' ? t('chat.input.tutorPlaceholder') : mode === 'ask' ? t('chat.input.askPlaceholder') : t('chat.input.learnPlaceholder'))}
                        disabled={isLive || !isOnline}
                        className="w-full bg-transparent border-none text-scale-body font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed"
                      />
                  </div>
              </div>

              <button
                onClick={() => handleSend()}
                disabled={loading || !isOnline || (!input.trim() && attachments.length === 0)}
                className="w-10 h-10 md:w-14 md:h-14 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-50 transition-all shrink-0"
                style={{ backgroundColor: accentHex }}
              >
                  <ICONS.Play className="w-5 h-5 md:w-6 md:h-6 fill-white translate-x-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* Listen Mode Footer - shown when listening or viewing session */}
        {(isListening || activeListenSession) && (
          <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
            <div className="max-w-4xl mx-auto">
              {isListening ? (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={stopListening}
                    className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                  >
                    <ICONS.Square className="w-5 h-5" />
                    {t('chat.listen.stopSave')}
                  </button>
                </div>
              ) : activeListenSession && (
                <div className="flex flex-col items-center gap-3">
                  {/* Polishing indicator */}
                  {isProcessingTranscript && (
                    <div className="flex items-center gap-2 text-scale-label text-[var(--text-secondary)]">
                      <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                      {t('chat.listen.improving')}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {activeListenSession && extractedSessionIds.has(activeListenSession.id) ? (
                      <div className="px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <ICONS.Check className="w-4 h-4" />
                        {t('chat.listen.wordsAdded')}
                      </div>
                    ) : (
                      <button
                        onClick={() => extractWordsFromSession()}
                        disabled={isProcessingTranscript}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-white disabled:opacity-50"
                        style={{ backgroundColor: accentHex }}
                      >
                        <ICONS.BookOpen className="w-4 h-4" />
                        {t('chat.listen.extractWords')}
                      </button>
                    )}
                    <button
                      onClick={() => setShowListenPrompt(true)}
                      className="px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border-2 hover:opacity-80 transition-opacity text-[var(--text-primary)]"
                      style={{ borderColor: accentHex }}
                    >
                      <span>👂</span>
                      {t('chat.listen.newSession')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveListenSession(null);
                        setListenEntries([]);
                        if (chats.length > 0) setActiveChat(chats[0]);
                      }}
                      className="px-5 py-2.5 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      {t('chat.listen.backToChats')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={imgInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
      <input type="file" ref={fileInputRef} accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />

      {/* Mobile Conversation Sidebar - Slide-in from left */}
      <div
        className={`lg:hidden fixed inset-0 z-[200] transition-all duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Sidebar Panel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[var(--bg-card)] shadow-2xl transform transition-transform duration-300 flex flex-col ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <ICONS.MessageCircle className="w-5 h-5" style={{ color: accentHex }} />
              <span className="text-scale-label font-bold text-[var(--text-primary)]">{t('chat.sidebar.conversations')}</span>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
            >
              <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* New Session Button */}
          <div className="p-3 border-b border-[var(--border-color)]">
            <button
              onClick={() => {
                createNewChat(mode);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full text-white rounded-xl py-2.5 font-bold text-scale-label shadow-sm flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: accentHex }}
            >
              <ICONS.Plus className="w-4 h-4" /> {t('chat.sidebar.newSession')}
            </button>
          </div>

          {/* Chat + Listen Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sidebarItems.length === 0 ? (
              <div className="py-8 text-center">
                <ICONS.MessageCircle className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)] opacity-40" />
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('chat.sidebar.noConversations')}</p>
                <p className="text-scale-micro text-[var(--text-secondary)] mt-1">{t('chat.sidebar.startSession')}</p>
              </div>
            ) : (
              sidebarItems.map(item => {
                const isActive = item.type === 'chat'
                  ? activeChat?.id === item.id
                  : activeListenSession?.id === item.id;
                const isListenItem = item.type === 'listen';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isListenItem) {
                        selectListenSession(item as ListenSession);
                      } else {
                        setActiveChat(item as Chat);
                        setActiveListenSession(null);
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 ${
                      isActive ? 'font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    }`}
                    style={isActive ? { backgroundColor: `${accentHex}15`, color: accentHex } : {}}
                  >
                    <span className="truncate text-scale-caption flex items-center gap-1.5">
                      {isListenItem && <span>👂</span>}
                      {item.title}
                    </span>
                    <span className={`text-scale-micro uppercase tracking-widest opacity-60 font-black ${isListenItem ? 'text-blue-500' : ''}`}>
                      {isListenItem ? `listen • ${formatListenDuration((item as ListenSession).duration_seconds)}` : (item as Chat).mode}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--border-color)] text-center">
            <span className="text-scale-micro text-[var(--text-secondary)]">
              {t('chat.sidebar.items', { count: sidebarItems.length })}
            </span>
          </div>
        </div>
      </div>

      {/* New Words Notification */}
      {newWordsNotification.length > 0 && (
        <NewWordsNotification
          words={newWordsNotification}
          onClose={() => setNewWordsNotification([])}
        />
      )}

      {/* Word Extractor Modal */}
      {showWordExtractor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                    <ICONS.BookOpen className="w-6 h-6" style={{ color: accentHex }} />
                  </div>
                  <div>
                    <h2 className="text-scale-heading font-bold text-[var(--text-primary)]">{t('chat.wordExtractor.title')}</h2>
                    <p className="text-scale-caption text-[var(--text-secondary)]">
                      {extractedWords.length > 0
                        ? `${t('chat.wordExtractor.found', { count: extractedWords.length })} • ${t('chat.wordExtractor.selected', { count: selectedWords.size })}`
                        : t('chat.wordExtractor.analyzing')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWordExtractor(false)}
                  className="p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                >
                  <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* Word List */}
            <div className="flex-1 overflow-y-auto p-4">
              {extractedWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                  <div className="w-8 h-8 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-scale-label">{t('chat.wordExtractor.extracting')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {extractedWords.map((word, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedWords.has(word.word)
                          ? 'bg-[var(--accent-light)] border-[var(--accent-color)]'
                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWords.has(word.word)}
                        onChange={() => {
                          setSelectedWords(prev => {
                            const next = new Set(prev);
                            if (next.has(word.word)) {
                              next.delete(word.word);
                            } else {
                              next.add(word.word);
                            }
                            return next;
                          });
                        }}
                        className="mt-1 w-4 h-4 rounded accent-[var(--accent-color)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-[var(--text-primary)]">{word.word}</span>
                          <span className="text-scale-caption px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]">
                            {word.type}
                          </span>
                        </div>
                        <p className="text-scale-label text-[var(--text-secondary)]">{word.translation}</p>
                        {word.proTip && (
                          <p className="text-scale-caption text-[var(--accent-color)] mt-1 italic">{word.proTip}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-color)] flex gap-3">
              <button
                onClick={() => setShowWordExtractor(false)}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
              >
                {t('chat.wordExtractor.cancel')}
              </button>
              <button
                onClick={addSelectedWordsToDictionary}
                disabled={selectedWords.size === 0 || isAddingWords}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: accentHex }}
              >
                {isAddingWords ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('chat.wordExtractor.adding')}
                  </>
                ) : (
                  <>
                    <ICONS.Plus className="w-4 h-4" />
                    {t('chat.wordExtractor.addWords', { count: selectedWords.size })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Action Confirmation Modal */}
      {showActionConfirm && pendingAction && (
        <CoachActionConfirmModal
          isOpen={showActionConfirm}
          action={pendingAction}
          partnerName={sessionContextRef.current?.partnerName || 'your partner'}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setShowActionConfirm(false);
            setPendingAction(null);
          }}
        />
      )}

      {/* Listen Mode Start Prompt */}
      {showListenPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-[var(--accent-light)] flex items-center justify-center mb-6">
              <span className="text-4xl">👂</span>
            </div>

            <h2 className="text-scale-heading font-bold text-[var(--text-primary)] mb-2">{t('chat.listenPrompt.title')}</h2>
            <p className="text-scale-label text-[var(--text-secondary)] mb-6">
              {t('chat.listenPrompt.description', { language: targetName })}
            </p>

            <div className="mb-6">
              <label className="block text-scale-label font-medium text-[var(--text-secondary)] mb-2 text-left">
                {t('chat.listenPrompt.contextLabel')} <span className="opacity-60">{t('chat.listenPrompt.contextOptional')}</span>
              </label>
              <input
                type="text"
                value={listenContextLabel}
                onChange={(e) => setListenContextLabel(e.target.value)}
                placeholder={t('chat.listenPrompt.contextPlaceholder')}
                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
              <p className="text-scale-caption text-[var(--text-secondary)] mt-1 text-left opacity-60">
                {t('chat.listenPrompt.contextHint')}
              </p>
            </div>

            {listenError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-scale-label">
                {listenError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowListenPrompt(false);
                  setListenContextLabel('');
                  setListenError(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
              >
                {t('chat.listenPrompt.cancel')}
              </button>
              <button
                onClick={startListening}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accentHex }}
              >
                <ICONS.Mic className="w-5 h-5" />
                {t('chat.listenPrompt.start')}
              </button>
            </div>

            <p className="text-scale-micro text-[var(--text-secondary)] mt-4 flex items-center justify-center gap-1">
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-bold">
                {t('chat.listen.beta')}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
