import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  MessageCircle, Send, Loader2, Users, Building2, Hash, Plus,
  AtSign, Search, X, Trash2, MoreVertical, Power, PowerOff,
  Eraser, Settings2, ShieldAlert, Menu, Pin, PinOff, Smile,
  Archive, RotateCcw, ChevronDown, Paperclip, FileText, Image,
  Download, User, Mail, Volume2, VolumeX, Globe, FileSearch,
  UserSearch, Bell,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Common emojis for quick reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '💯', '🙏', '😮', '👎', '💡'];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

interface Mention {
  type: 'user' | 'client';
  id: number;
  name: string;
}

interface MentionSuggestion {
  type: 'user' | 'client';
  id: number;
  name: string;
  avatar?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

// Notification sound - simple beep using Web Audio API
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Silently fail if audio context is not available
  }
}

export default function Chat() {
  const { user: currentUser } = useAuth();
  const isAdmin = (currentUser as any)?.role === 'admin';
  const utils = trpc.useUtils();

  // State
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionType, setMentionType] = useState<'user' | 'client'>('user');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelTipo, setNewChannelTipo] = useState<'projeto' | 'setor'>('projeto');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{ channelId: number; ativo: boolean } | null>(null);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<number | null>(null);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<number | null>(null);
  const [confirmRestoreChannel, setConfirmRestoreChannel] = useState<number | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'active' | 'inactive' | 'trash' | 'dm'>('active');
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [typingTimeout, setTypingTimeoutState] = useState<ReturnType<typeof setTimeout> | null>(null);

  // New state for v31 features
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('chat-sound') !== 'off'; } catch { return true; }
  });
  const [searchMode, setSearchMode] = useState<'local' | 'global' | 'files' | 'user'>('local');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [fileSearchType, setFileSearchType] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const prevMessageCountRef = useRef<number>(0);
  const prevUnreadRef = useRef<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Queries — FAST POLLING
  const { data: channels = [], isLoading: loadingChannels } = trpc.chat.channels.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  const { data: unreadData } = trpc.chat.unreadCount.useQuery(
    undefined,
    { refetchInterval: 2000 }
  );

  const { data: messages = [], isLoading: loadingMessages } = trpc.chat.list.useQuery(
    { channelId: activeChannelId!, limit: 200 },
    { enabled: !!activeChannelId, refetchInterval: 1500 }
  );

  // DM channels query
  const { data: dmChannels = [] } = trpc.chat.dmChannels.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  // Reactions query for visible messages
  const messageIds = useMemo(() => (messages as any[]).map((m: any) => m.id), [messages]);
  const { data: reactions = [] } = trpc.chat.reactions.useQuery(
    { messageIds },
    { enabled: messageIds.length > 0, refetchInterval: 3000 }
  );

  // Pinned messages query
  const { data: pinnedMessages = [] } = trpc.chat.pinnedMessages.useQuery(
    { channelId: activeChannelId! },
    { enabled: !!activeChannelId }
  );

  // Typing indicator query
  const { data: typingUsers = [] } = trpc.chat.typingUsers.useQuery(
    { channelId: activeChannelId! },
    { enabled: !!activeChannelId, refetchInterval: 1500 }
  );

  // User suggestions for mentions and DM
  const userSuggestions = trpc.chat.userSuggestions.useQuery(
    { query: mentionQuery },
    { enabled: showMentions && mentionType === 'user' && mentionQuery.length >= 1 }
  );

  const clientSuggestions = trpc.chat.clientSuggestions.useQuery(
    { query: mentionQuery },
    { enabled: showMentions && mentionType === 'client' && mentionQuery.length >= 1 }
  );

  // DM user search
  const dmUserSearch = trpc.chat.userSuggestions.useQuery(
    { query: dmSearchQuery },
    { enabled: showNewDm && dmSearchQuery.length >= 1 }
  );

  // Global search query
  const { data: globalSearchResults = [], isLoading: loadingGlobalSearch } = trpc.chat.searchGlobal.useQuery(
    { query: globalSearchQuery },
    { enabled: showGlobalSearch && globalSearchQuery.length >= 2 }
  );

  // File search query
  const { data: fileSearchResults = [], isLoading: loadingFileSearch } = trpc.chat.searchFiles.useQuery(
    { channelId: showFilePanel && activeChannelId ? activeChannelId : undefined, fileType: fileSearchType || undefined },
    { enabled: showFilePanel }
  );

  // User search query
  const { data: userSearchResults = [], isLoading: loadingUserSearch } = trpc.chat.searchByUser.useQuery(
    { channelId: activeChannelId!, userName: userSearchQuery },
    { enabled: showUserSearch && !!activeChannelId && userSearchQuery.length >= 1 }
  );

  const suggestions = mentionType === 'user' ? userSuggestions.data : clientSuggestions.data;

  // Sound toggle
  const toggleSound = useCallback(() => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    try { localStorage.setItem('chat-sound', newVal ? 'on' : 'off'); } catch {}
    toast.success(newVal ? 'Alerta sonoro ativado' : 'Alerta sonoro desativado');
  }, [soundEnabled]);

  // Sound alert on new messages
  useEffect(() => {
    const currentCount = (messages as any[]).length;
    if (prevMessageCountRef.current > 0 && currentCount > prevMessageCountRef.current && soundEnabled) {
      // Check if the newest message is NOT from the current user
      const newest = (messages as any[]).sort((a: any, b: any) => b.id - a.id)[0];
      if (newest && newest.userId !== currentUser?.id) {
        playNotificationSound();
      }
    }
    prevMessageCountRef.current = currentCount;
  }, [messages, soundEnabled, currentUser]);

  // Sound alert on new unread notifications (for DMs and other channels)
  useEffect(() => {
    const currentTotal = unreadData?.total || 0;
    if (prevUnreadRef.current > 0 && currentTotal > prevUnreadRef.current && soundEnabled) {
      playNotificationSound();
    }
    prevUnreadRef.current = currentTotal;
  }, [unreadData, soundEnabled]);

  // Mutations
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      utils.chat.unreadCount.invalidate();
      setInputValue('');
      setMentions([]);
      if (activeChannelId) stopTypingMut.mutate({ channelId: activeChannelId });
    },
    onError: (err) => toast.error(err.message),
  });

  const createChannel = trpc.chat.createChannel.useMutation({
    onSuccess: (data) => {
      utils.chat.channels.invalidate();
      setShowNewChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      if (data.id) setActiveChannelId(data.id);
      toast.success('Canal criado com sucesso!');
    },
    onError: (err) => toast.error(err.message),
  });

  const markRead = trpc.chat.markRead.useMutation({
    onSuccess: () => utils.chat.unreadCount.invalidate(),
  });

  const deleteMessage = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      toast.success('Mensagem excluída');
      setConfirmDeleteMsg(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const clearChannel = trpc.chat.clearChannel.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      toast.success('Todas as mensagens foram excluídas');
      setConfirmClear(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleChannel = trpc.chat.toggleChannel.useMutation({
    onSuccess: () => {
      utils.chat.channels.invalidate();
      toast.success('Canal atualizado');
      setConfirmToggle(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteChannelMut = trpc.chat.deleteChannel.useMutation({
    onSuccess: () => {
      utils.chat.channels.invalidate();
      toast.success('Canal movido para a lixeira');
      setConfirmDeleteChannel(null);
      setActiveChannelId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const restoreChannelMut = trpc.chat.restoreChannel.useMutation({
    onSuccess: () => {
      utils.chat.channels.invalidate();
      toast.success('Canal restaurado');
      setConfirmRestoreChannel(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const addReaction = trpc.chat.addReaction.useMutation({
    onSuccess: () => utils.chat.reactions.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const removeReaction = trpc.chat.removeReaction.useMutation({
    onSuccess: () => utils.chat.reactions.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const pinMessageMut = trpc.chat.pinMessage.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      utils.chat.pinnedMessages.invalidate();
      toast.success('Mensagem fixada');
    },
    onError: (err) => toast.error(err.message),
  });

  const unpinMessageMut = trpc.chat.unpinMessage.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      utils.chat.pinnedMessages.invalidate();
      toast.success('Mensagem desfixada');
    },
    onError: (err) => toast.error(err.message),
  });

  // DM mutation
  const startDm = trpc.chat.startDm.useMutation({
    onSuccess: (data: any) => {
      utils.chat.dmChannels.invalidate();
      utils.chat.channels.invalidate();
      if (data?.id) {
        setActiveChannelId(data.id);
        setSidebarTab('dm');
      }
      setShowNewDm(false);
      setDmSearchQuery('');
      toast.success('Conversa privada iniciada!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Typing mutations
  const startTypingMut = trpc.chat.startTyping.useMutation();
  const stopTypingMut = trpc.chat.stopTyping.useMutation();

  // File upload mutation
  const uploadFileMut = trpc.chat.uploadFile.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      utils.chat.unreadCount.invalidate();
      setPendingFile(null);
      setFilePreviewUrl(null);
      setUploadingFile(false);
      toast.success('Arquivo enviado!');
    },
    onError: (err) => {
      setUploadingFile(false);
      toast.error(err.message);
    },
  });

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const activeChans = channels.filter((c: any) => c.status === 'active' || (!c.status && c.ativo !== false));
      const geral = activeChans.find((c: any) => c.tipo === 'geral');
      setActiveChannelId(geral ? geral.id : (activeChans[0]?.id || channels[0].id));
    }
  }, [channels, activeChannelId]);

  // Mark as read when switching channels
  useEffect(() => {
    if (activeChannelId) {
      markRead.mutate({ channelId: activeChannelId });
    }
  }, [activeChannelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup file preview URL
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Get unread count for a channel
  const getChannelUnread = useCallback((channelId: number) => {
    if (!unreadData?.byChannel) return 0;
    const ch = unreadData.byChannel.find((c: any) => c.channelId === channelId);
    return ch?.count || 0;
  }, [unreadData]);

  // Get reactions grouped by emoji for a message
  const getMessageReactions = useCallback((messageId: number) => {
    const msgReactions = (reactions as any[]).filter((r: any) => r.messageId === messageId);
    const grouped: Record<string, { emoji: string; count: number; users: string[]; userIds: number[] }> = {};
    for (const r of msgReactions) {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], userIds: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.userName);
      grouped[r.emoji].userIds.push(r.userId);
    }
    return Object.values(grouped);
  }, [reactions]);

  // Typing indicator handler
  const handleTyping = useCallback(() => {
    if (!activeChannelId) return;
    startTypingMut.mutate({ channelId: activeChannelId });
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      if (activeChannelId) stopTypingMut.mutate({ channelId: activeChannelId });
    }, 3000);
    setTypingTimeoutState(timeout);
  }, [activeChannelId, typingTimeout]);

  // Handle input change with dual mention detection + typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    handleTyping();

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);

    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');

    if (lastAtIndex > lastHashIndex && lastAtIndex >= 0) {
      const textAfterTrigger = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterTrigger.includes(' ') || textAfterTrigger.length <= 1) {
        setShowMentions(true);
        setMentionType('user');
        setMentionQuery(textAfterTrigger);
        setMentionCursorPos(lastAtIndex);
        return;
      }
    } else if (lastHashIndex > lastAtIndex && lastHashIndex >= 0) {
      const textAfterTrigger = textBeforeCursor.slice(lastHashIndex + 1);
      if (!textAfterTrigger.includes(' ') || textAfterTrigger.length <= 1) {
        setShowMentions(true);
        setMentionType('client');
        setMentionQuery(textAfterTrigger);
        setMentionCursorPos(lastHashIndex);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = (suggestion: MentionSuggestion) => {
    const triggerChar = suggestion.type === 'user' ? '@' : '#';
    const before = inputValue.slice(0, mentionCursorPos);
    const after = inputValue.slice(mentionCursorPos + mentionQuery.length + 1);
    const newValue = `${before}${triggerChar}${suggestion.name} ${after}`;
    setInputValue(newValue);
    setMentions(prev => [...prev, { type: suggestion.type, id: suggestion.id, name: suggestion.name }]);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeChannelId) return;
    sendMessage.mutate({
      channelId: activeChannelId,
      content: inputValue.trim(),
      mentions: mentions.length > 0 ? mentions : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleToggleReaction = (messageId: number, emoji: string) => {
    const msgReactions = getMessageReactions(messageId);
    const existing = msgReactions.find(r => r.emoji === emoji);
    if (existing && currentUser && existing.userIds.includes(currentUser.id)) {
      removeReaction.mutate({ messageId, emoji });
    } else {
      addReaction.mutate({ messageId, emoji });
    }
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }
    setPendingFile(file);
    if (isImageType(file.type)) {
      setFilePreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleFileUpload = async () => {
    if (!pendingFile || !activeChannelId) return;
    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadFileMut.mutate({
          channelId: activeChannelId,
          fileName: pendingFile.name,
          fileType: pendingFile.type,
          fileSize: pendingFile.size,
          fileBase64: base64,
          content: inputValue.trim() || undefined,
          mentions: mentions.length > 0 ? mentions : undefined,
        });
        setInputValue('');
        setMentions([]);
      };
      reader.readAsDataURL(pendingFile);
    } catch {
      setUploadingFile(false);
      toast.error('Erro ao ler o arquivo');
    }
  };

  const cancelFileUpload = () => {
    setPendingFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  // Render message content with highlighted mentions
  const renderContent = useCallback((content: string, msgMentions: Mention[] | null) => {
    if (!msgMentions || msgMentions.length === 0) return content;

    let result: (string | React.ReactNode)[] = [content];
    for (const mention of msgMentions) {
      const triggerChar = mention.type === 'user' ? '@' : '#';
      const mentionText = `${triggerChar}${mention.name}`;
      const newResult: (string | React.ReactNode)[] = [];
      for (const part of result) {
        if (typeof part !== 'string') {
          newResult.push(part);
          continue;
        }
        const idx = part.indexOf(mentionText);
        if (idx === -1) {
          newResult.push(part);
          continue;
        }
        if (idx > 0) newResult.push(part.slice(0, idx));
        const isCurrentUser = mention.type === 'user' &&
          mention.name.toLowerCase() === ((currentUser as any)?.apelido || currentUser?.name || '').toLowerCase();
        newResult.push(
          <span
            key={`${mention.id}-${idx}-${Math.random()}`}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
              isCurrentUser
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 ring-1 ring-yellow-300'
                : mention.type === 'user'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}
          >
            {mention.type === 'user' ? <AtSign className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
            {mention.name}
          </span>
        );
        if (idx + mentionText.length < part.length) {
          newResult.push(part.slice(idx + mentionText.length));
        }
      }
      result = newResult;
    }
    return result;
  }, [currentUser]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const sorted = [...(messages as any[])].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const groups: { date: string; messages: any[] }[] = [];
    let currentDate = '';
    for (const msg of sorted) {
      const date = new Date(msg.createdAt).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages]);

  // Filter messages by local search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedMessages;
    const q = searchQuery.toLowerCase();
    return groupedMessages.map(g => ({
      ...g,
      messages: g.messages.filter((m: any) => m.content.toLowerCase().includes(q)),
    })).filter(g => g.messages.length > 0);
  }, [groupedMessages, searchQuery]);

  const activeChannel = channels.find((c: any) => c.id === activeChannelId) || (dmChannels as any[]).find((c: any) => c.id === activeChannelId);
  const isChannelActive = activeChannel ? (activeChannel as any).ativo !== false : true;
  const channelStatus = (activeChannel as any)?.status || 'active';
  const isDmChannel = (activeChannel as any)?.tipo === 'dm';

  // Separate channels by status
  const activeChannels = channels.filter((c: any) => (c.status === 'active' || (!c.status && c.ativo !== false)) && c.tipo !== 'dm');
  const inactiveChannels = channels.filter((c: any) => c.status === 'inactive');
  const deletedChannels = channels.filter((c: any) => c.status === 'deleted');

  const geralChannels = activeChannels.filter((c: any) => c.tipo === 'geral');
  const setorChannels = activeChannels.filter((c: any) => c.tipo === 'setor');
  const projetoChannels = activeChannels.filter((c: any) => c.tipo === 'projeto');

  const totalUnread = unreadData?.total || 0;

  // Count DM unread
  const dmUnreadCount = useMemo(() => {
    if (!unreadData?.byChannel) return 0;
    const dmIds = new Set((dmChannels as any[]).map((c: any) => c.id));
    return unreadData.byChannel
      .filter((c: any) => dmIds.has(c.channelId))
      .reduce((sum: number, c: any) => sum + (c.count || 0), 0);
  }, [unreadData, dmChannels]);

  // Get DM partner name
  const getDmPartnerName = (ch: any) => {
    if (!currentUser) return ch.nome;
    const name = ch.nome?.replace('DM: ', '') || '';
    const parts = name.split(' & ');
    if (parts.length === 2) {
      return parts[0] === ((currentUser as any)?.apelido || currentUser?.name) ? parts[1] : parts[0];
    }
    return name;
  };

  if (loadingChannels) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const renderChannelButton = (ch: any, showRestore = false, showDelete = false) => {
    const unread = getChannelUnread(ch.id);
    const isInactive = ch.status === 'inactive' || (ch.ativo === false && ch.status !== 'deleted');
    const isDeleted = ch.status === 'deleted';
    const icon = ch.tipo === 'geral' ? <MessageCircle className="w-4 h-4 shrink-0" />
      : ch.tipo === 'setor' ? <Building2 className="w-3.5 h-3.5 shrink-0" />
      : ch.tipo === 'dm' ? <User className="w-3.5 h-3.5 shrink-0" />
      : <Hash className="w-3.5 h-3.5 shrink-0" />;

    const displayName = ch.tipo === 'dm' ? getDmPartnerName(ch) : ch.nome;

    return (
      <div key={ch.id} className="flex items-center gap-0.5 group/ch">
        <button
          onClick={() => { setActiveChannelId(ch.id); setShowSidebar(false); }}
          className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors ${
            activeChannelId === ch.id
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted text-foreground/80'
          } ${isInactive || isDeleted ? 'opacity-60' : ''}`}
        >
          {icon}
          <span className="truncate flex-1">{displayName}</span>
          {isInactive && <PowerOff className="w-3 h-3 text-muted-foreground shrink-0" />}
          {isDeleted && <Trash2 className="w-3 h-3 text-muted-foreground shrink-0" />}
          {unread > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
        {isAdmin && (showRestore || showDelete) && (
          <div className="opacity-0 group-hover/ch:opacity-100 transition-opacity flex shrink-0">
            {showRestore && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-green-600"
                onClick={(e) => { e.stopPropagation(); setConfirmRestoreChannel(ch.id); }} title="Restaurar canal">
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            {showDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600"
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteChannel(ch.id); }} title="Mover para lixeira">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render file attachment in message
  const renderFileAttachment = (msg: any) => {
    if (!msg.fileUrl) return null;
    const isImage = isImageType(msg.fileType || '');
    return (
      <div className="mt-2 max-w-sm">
        {isImage ? (
          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img src={msg.fileUrl} alt={msg.fileName || 'Imagem'}
              className="rounded-lg border max-h-64 object-cover hover:opacity-90 transition-opacity cursor-pointer" loading="lazy" />
          </a>
        ) : (
          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.fileName || 'Arquivo'}</p>
              <p className="text-[10px] text-muted-foreground">
                {msg.fileSize ? formatFileSize(msg.fileSize) : ''} {msg.fileType ? `• ${msg.fileType.split('/')[1]?.toUpperCase()}` : ''}
              </p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground shrink-0" />
          </a>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Sidebar header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> Chat
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5 ml-1">
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewChannel(true)} title="Novo canal">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setShowSidebar(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-2 mt-2 h-8 shrink-0 grid grid-cols-4">
            <TabsTrigger value="active" className="text-[10px] h-6 gap-0.5 px-1">
              <Power className="w-3 h-3" /> Canais
            </TabsTrigger>
            <TabsTrigger value="dm" className="text-[10px] h-6 gap-0.5 px-1 relative">
              <Mail className="w-3 h-3" /> DMs
              {dmUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
                </span>
              )}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="inactive" className="text-[10px] h-6 gap-0.5 px-1">
                <PowerOff className="w-3 h-3" /> Inat.
                {inactiveChannels.length > 0 && <span className="text-[9px] opacity-60">({inactiveChannels.length})</span>}
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="trash" className="text-[10px] h-6 gap-0.5 px-1">
                <Trash2 className="w-3 h-3" /> Lixo
                {deletedChannels.length > 0 && <span className="text-[9px] opacity-60">({deletedChannels.length})</span>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="active" className="flex-1 overflow-y-auto mt-0 p-2 space-y-3">
            {geralChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Geral</p>
                {geralChannels.map(ch => renderChannelButton(ch, false, isAdmin))}
              </div>
            )}
            {setorChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Setores</p>
                {setorChannels.map(ch => renderChannelButton(ch, false, isAdmin))}
              </div>
            )}
            {projetoChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Projetos</p>
                {projetoChannels.map(ch => renderChannelButton(ch, false, isAdmin))}
              </div>
            )}
            {activeChannels.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum canal ativo</p>
            )}
          </TabsContent>

          {/* DM Tab */}
          <TabsContent value="dm" className="flex-1 overflow-y-auto mt-0 p-2 space-y-2">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mb-2" onClick={() => setShowNewDm(true)}>
              <Plus className="w-3.5 h-3.5" /> Nova Conversa Privada
            </Button>
            {(dmChannels as any[]).length > 0 ? (
              (dmChannels as any[]).map((ch: any) => renderChannelButton(ch))
            ) : (
              <div className="text-center py-6">
                <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma conversa privada</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Clique acima para iniciar</p>
              </div>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="inactive" className="flex-1 overflow-y-auto mt-0 p-2 space-y-1">
              {inactiveChannels.length > 0 ? (
                inactiveChannels.map(ch => renderChannelButton(ch, true, true))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum canal inativo</p>
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="trash" className="flex-1 overflow-y-auto mt-0 p-2 space-y-1">
              {deletedChannels.length > 0 ? (
                deletedChannels.map(ch => renderChannelButton(ch, true, false))
              ) : (
                <div className="text-center py-4">
                  <Trash2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Lixeira vazia</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 rounded-xl border overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Channel sidebar */}
      <div className={`
        ${showSidebar ? 'fixed inset-y-0 left-0 z-50 w-72' : 'hidden'}
        lg:relative lg:block lg:w-64 lg:z-auto
        shrink-0 border-r bg-muted/30 flex flex-col
      `}>
        {sidebarContent}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Chat header */}
        <div className="h-12 border-b flex items-center justify-between px-3 sm:px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden shrink-0 relative" onClick={() => setShowSidebar(true)}>
              <Menu className="w-4 h-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Button>
            {activeChannel && (
              <>
                {(activeChannel as any).tipo === 'geral' && <MessageCircle className="w-4 h-4 text-primary shrink-0" />}
                {(activeChannel as any).tipo === 'setor' && <Building2 className="w-4 h-4 text-primary shrink-0" />}
                {(activeChannel as any).tipo === 'projeto' && <Hash className="w-4 h-4 text-primary shrink-0" />}
                {(activeChannel as any).tipo === 'dm' && <User className="w-4 h-4 text-primary shrink-0" />}
                <span className="font-semibold text-sm truncate">
                  {isDmChannel ? getDmPartnerName(activeChannel) : (activeChannel as any).nome}
                </span>
                {isDmChannel && <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 shrink-0">DM</Badge>}
                {channelStatus === 'inactive' && <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 shrink-0">Inativo</Badge>}
                {channelStatus === 'deleted' && <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 shrink-0">Lixeira</Badge>}
                {!isDmChannel && (activeChannel as any).descricao && (
                  <span className="text-xs text-muted-foreground hidden md:inline ml-2 truncate">— {(activeChannel as any).descricao}</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Sound toggle */}
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={toggleSound} title={soundEnabled ? 'Desativar som' : 'Ativar som'}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            {/* Pinned messages button */}
            {activeChannelId && (pinnedMessages as any[]).length > 0 && (
              <Button variant="ghost" size="icon" className={`h-8 w-8 relative ${showPinnedPanel ? 'text-primary' : ''}`}
                onClick={() => setShowPinnedPanel(!showPinnedPanel)} title={`${(pinnedMessages as any[]).length} mensagem(ns) fixada(s)`}>
                <Pin className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {(pinnedMessages as any[]).length}
                </span>
              </Button>
            )}

            {/* Search dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${showSearch || showGlobalSearch || showFilePanel || showUserSearch ? 'text-primary' : ''}`}>
                  <Search className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => {
                  setShowSearch(true); setShowGlobalSearch(false); setShowFilePanel(false); setShowUserSearch(false);
                }}>
                  <Search className="w-4 h-4 mr-2" /> Buscar no canal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setShowGlobalSearch(true); setShowSearch(false); setShowFilePanel(false); setShowUserSearch(false);
                }}>
                  <Globe className="w-4 h-4 mr-2" /> Busca global
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setShowFilePanel(true); setShowSearch(false); setShowGlobalSearch(false); setShowUserSearch(false);
                }}>
                  <FileSearch className="w-4 h-4 mr-2" /> Buscar arquivos
                </DropdownMenuItem>
                {activeChannelId && (
                  <DropdownMenuItem onClick={() => {
                    setShowUserSearch(true); setShowSearch(false); setShowGlobalSearch(false); setShowFilePanel(false);
                  }}>
                    <UserSearch className="w-4 h-4 mr-2" /> Buscar por usuário
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin channel controls */}
            {isAdmin && activeChannelId && !isDmChannel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Administração
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirmClear(true)} className="text-red-600 focus:text-red-600">
                    <Eraser className="w-4 h-4 mr-2" /> Limpar todas as mensagens
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmToggle({ channelId: activeChannelId, ativo: !isChannelActive })}>
                    {isChannelActive ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar canal</> : <><Power className="w-4 h-4 mr-2" /> Reativar canal</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {channelStatus !== 'deleted' ? (
                    <DropdownMenuItem onClick={() => setConfirmDeleteChannel(activeChannelId)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Mover para lixeira
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setConfirmRestoreChannel(activeChannelId)} className="text-green-600 focus:text-green-600">
                      <RotateCcw className="w-4 h-4 mr-2" /> Restaurar canal
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Local search bar */}
        {showSearch && (
          <div className="px-3 sm:px-4 py-2 border-b flex items-center gap-2 bg-muted/20 shrink-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mensagens neste canal..." className="h-8 text-sm" autoFocus />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Global search bar */}
        {showGlobalSearch && (
          <div className="px-3 sm:px-4 py-2 border-b bg-blue-50/50 dark:bg-blue-900/10 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Busca Global</span>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowGlobalSearch(false); setGlobalSearchQuery(''); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Input value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Buscar em todos os canais..." className="h-8 text-sm" autoFocus />
            {globalSearchQuery.length >= 2 && (
              <div className="mt-2 max-h-[300px] overflow-y-auto space-y-1">
                {loadingGlobalSearch ? (
                  <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : (globalSearchResults as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhum resultado encontrado</p>
                ) : (
                  (globalSearchResults as any[]).map((r: any) => (
                    <button key={r.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => { setActiveChannelId(r.channelId); setShowGlobalSearch(false); setGlobalSearchQuery(''); }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{r.channelNome || `Canal #${r.channelId}`}</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">{r.userName}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-foreground/80 truncate">{r.content}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* File search panel */}
        {showFilePanel && (
          <div className="px-3 sm:px-4 py-2 border-b bg-emerald-50/50 dark:bg-emerald-900/10 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <FileSearch className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Arquivos {activeChannelId ? 'neste canal' : 'em todos os canais'}
              </span>
              <div className="flex-1" />
              <Select value={fileSearchType || 'all'} onValueChange={(v) => setFileSearchType(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-7 w-32 text-[10px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="image">Imagens</SelectItem>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowFilePanel(false); setFileSearchType(''); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {loadingFileSearch ? (
                <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              ) : (fileSearchResults as any[]).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Nenhum arquivo encontrado</p>
              ) : (
                (fileSearchResults as any[]).map((f: any) => (
                  <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {isImageType(f.fileType || '') ? <Image className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{f.fileName || 'Arquivo'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.userName} • {f.fileSize ? formatFileSize(f.fileSize) : ''} • {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* User search panel */}
        {showUserSearch && activeChannelId && (
          <div className="px-3 sm:px-4 py-2 border-b bg-purple-50/50 dark:bg-purple-900/10 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <UserSearch className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Buscar por usuário</span>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowUserSearch(false); setUserSearchQuery(''); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Input value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Nome do usuário..." className="h-8 text-sm" autoFocus />
            {userSearchQuery.length >= 1 && (
              <div className="mt-2 max-h-[250px] overflow-y-auto space-y-1">
                {loadingUserSearch ? (
                  <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : (userSearchResults as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhuma mensagem encontrada</p>
                ) : (
                  (userSearchResults as any[]).map((m: any) => (
                    <div key={m.id} className="px-3 py-2 rounded-lg bg-background/80 border">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold">{m.userName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80">{m.content}</p>
                      {m.fileUrl && (
                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                          <Paperclip className="w-3 h-3" /> {m.fileName || 'Arquivo'}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Pinned messages panel */}
        {showPinnedPanel && (pinnedMessages as any[]).length > 0 && (
          <div className="border-b bg-amber-50/50 dark:bg-amber-900/10 px-3 sm:px-4 py-2 shrink-0 max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5" /> Mensagens Fixadas ({(pinnedMessages as any[]).length})
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPinnedPanel(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {(pinnedMessages as any[]).map((pm: any) => (
                <div key={pm.id} className="flex items-start gap-2 py-1.5 px-2 rounded-md bg-background/80 border border-amber-200/50">
                  <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{pm.userName}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(pm.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-foreground/80 truncate">{pm.content}</p>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-red-500 shrink-0"
                      onClick={() => unpinMessageMut.mutate({ messageId: pm.id })} title="Desfixar">
                      <PinOff className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-1" style={{ minHeight: 0 }}>
          {!activeChannelId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">Selecione um canal</p>
              <p className="text-sm">Escolha um canal na barra lateral para iniciar</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">{searchQuery ? 'Nenhum resultado' : 'Nenhuma mensagem'}</p>
              <p className="text-sm">{searchQuery ? 'Tente outra busca' : 'Envie a primeira mensagem neste canal!'}</p>
            </div>
          ) : (
            filteredGroups.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-medium capitalize whitespace-nowrap">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {group.messages.map((msg: any, mi: number) => {
                  const isOwn = msg.userId === currentUser?.id;
                  const isDeleted = !!msg.deletedAt;
                  const isPinned = !!msg.pinned;
                  const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                  const isSameUser = prevMsg && prevMsg.userId === msg.userId;
                  const timeDiff = prevMsg ? (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) / 60000 : 999;
                  const showHeader = !isSameUser || timeDiff > 5;
                  const msgReactions = getMessageReactions(msg.id);

                  return (
                    <div key={msg.id}
                      className={`group flex gap-2.5 px-2 py-0.5 hover:bg-muted/30 rounded-lg transition-colors ${showHeader ? 'mt-3' : 'mt-0'} ${isDeleted ? 'opacity-50' : ''} ${isPinned ? 'border-l-2 border-amber-400 pl-3' : ''}`}>
                      <div className="w-8 shrink-0">
                        {showHeader && (
                          <Avatar className="h-8 w-8">
                            {msg.userAvatar && <AvatarImage src={msg.userAvatar} />}
                            <AvatarFallback className={`text-xs font-medium ${isOwn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {(msg.userName || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-semibold ${isOwn ? 'text-primary' : 'text-foreground'}`}>{msg.userName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isPinned && (
                              <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600 py-0 gap-0.5">
                                <Pin className="w-2.5 h-2.5" /> Fixada
                              </Badge>
                            )}
                            {isDeleted && <Badge variant="outline" className="text-[9px] border-red-200 text-red-500 py-0">excluída</Badge>}
                          </div>
                        )}
                        <div className={`text-sm leading-relaxed break-words ${isDeleted ? 'italic text-muted-foreground' : 'text-foreground/90'}`}>
                          {isDeleted ? msg.content : renderContent(msg.content, msg.mentions)}
                        </div>

                        {!isDeleted && renderFileAttachment(msg)}

                        {!isDeleted && msgReactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msgReactions.map((r) => {
                              const hasReacted = currentUser && r.userIds.includes(currentUser.id);
                              return (
                                <button key={r.emoji} onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                    hasReacted ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border hover:bg-muted'
                                  }`} title={r.users.join(', ')}>
                                  <span>{r.emoji}</span>
                                  <span className="font-medium">{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {!isDeleted && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start mt-1 flex items-center gap-0.5">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Reagir">
                                <Smile className="w-3.5 h-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="top" align="end">
                              <div className="grid grid-cols-6 gap-1">
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors">
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {isAdmin && (
                            <Button variant="ghost" size="icon"
                              className={`h-6 w-6 ${isPinned ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
                              onClick={() => isPinned ? unpinMessageMut.mutate({ messageId: msg.id }) : pinMessageMut.mutate({ messageId: msg.id })}
                              title={isPinned ? 'Desfixar mensagem' : 'Fixar mensagem'}>
                              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            </Button>
                          )}

                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => setConfirmDeleteMsg(msg.id)} title="Excluir mensagem">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {activeChannelId && (typingUsers as any[]).length > 0 && (
          <div className="px-4 py-1.5 border-t bg-muted/10 shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic">
                {(typingUsers as any[]).length === 1
                  ? `${(typingUsers as any[])[0].userName} está digitando...`
                  : (typingUsers as any[]).length === 2
                    ? `${(typingUsers as any[])[0].userName} e ${(typingUsers as any[])[1].userName} estão digitando...`
                    : `${(typingUsers as any[]).length} pessoas estão digitando...`}
              </span>
            </div>
          </div>
        )}

        {/* File preview bar */}
        {pendingFile && (
          <div className="border-t bg-muted/20 px-3 py-2 shrink-0">
            <div className="flex items-center gap-3">
              {filePreviewUrl && isImageType(pendingFile.type) ? (
                <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(pendingFile.size)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={cancelFileUpload} title="Cancelar">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input area */}
        {activeChannelId && isChannelActive && channelStatus !== 'deleted' && (
          <div className="border-t p-2 sm:p-3 relative shrink-0">
            <input ref={fileInputRef} type="file" className="hidden" accept={ALLOWED_FILE_TYPES.join(',')} onChange={handleFileSelect} />

            {showMentions && suggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full mb-1 left-2 right-2 sm:left-3 sm:right-3 bg-popover text-popover-foreground border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                <div className="px-3 py-1.5 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {mentionType === 'user' ? '@ Usuários' : '# Clientes'}
                  </p>
                </div>
                {(suggestions as MentionSuggestion[]).map((s) => (
                  <button key={`${s.type}-${s.id}`}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                    onClick={() => handleSelectMention(s)}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      s.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {s.type === 'user' ? <Users className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.type === 'user' ? 'Usuário' : 'Cliente'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()} title="Anexar arquivo">
                <Paperclip className="w-4 h-4" />
              </Button>

              <div className="relative flex-1 min-w-0">
                <Input ref={inputRef} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder={pendingFile ? "Adicione uma mensagem (opcional)..." : "Mensagem... @ para usuários, # para clientes"}
                  className="pr-16 sm:pr-20 text-sm" disabled={sendMessage.isPending || uploadingFile} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button className="text-muted-foreground hover:text-blue-500 transition-colors p-1 rounded"
                    onClick={() => {
                      setInputValue(prev => prev + '@');
                      setShowMentions(true); setMentionType('user'); setMentionQuery(''); setMentionCursorPos(inputValue.length);
                      inputRef.current?.focus();
                    }} title="Mencionar usuário (@)">
                    <AtSign className="w-4 h-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-emerald-500 transition-colors p-1 rounded"
                    onClick={() => {
                      setInputValue(prev => prev + '#');
                      setShowMentions(true); setMentionType('client'); setMentionQuery(''); setMentionCursorPos(inputValue.length);
                      inputRef.current?.focus();
                    }} title="Mencionar cliente (#)">
                    <Hash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {pendingFile ? (
                <Button onClick={handleFileUpload} disabled={uploadingFile} size="sm" className="gap-1.5 px-3 sm:px-4 shrink-0">
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!inputValue.trim() || sendMessage.isPending} size="sm" className="gap-1.5 px-3 sm:px-4 shrink-0">
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              )}
            </div>

            {mentions.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Menções:</span>
                {mentions.map((m, i) => (
                  <Badge key={i} variant="outline" className={`text-[10px] ${m.type === 'user' ? 'border-blue-200 text-blue-600' : 'border-emerald-200 text-emerald-600'}`}>
                    {m.type === 'user' ? '@' : '#'}{m.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inactive/deleted channel message */}
        {activeChannelId && (!isChannelActive || channelStatus === 'deleted') && (
          <div className="border-t p-3 shrink-0 bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              {channelStatus === 'deleted' ? (
                <><Trash2 className="w-4 h-4" /> Este canal está na lixeira. Apenas administradores podem restaurá-lo.</>
              ) : (
                <><PowerOff className="w-4 h-4" /> Este canal está inativo. Apenas administradores podem reativá-lo.</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Canal</DialogTitle>
            <DialogDescription>Crie um novo canal de comunicação para a equipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Ex: Projeto Alpha" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} placeholder="Breve descrição do canal" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newChannelTipo} onValueChange={(v) => setNewChannelTipo(v as 'projeto' | 'setor')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="setor">Setor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChannel(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!newChannelName.trim()) { toast.error('Nome é obrigatório'); return; }
              createChannel.mutate({ nome: newChannelName.trim(), descricao: newChannelDesc.trim() || undefined, tipo: newChannelTipo });
            }} disabled={createChannel.isPending}>
              {createChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Criar Canal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New DM Dialog */}
      <Dialog open={showNewDm} onOpenChange={setShowNewDm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Nova Conversa Privada</DialogTitle>
            <DialogDescription>Selecione um usuário para iniciar uma conversa direta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input value={dmSearchQuery} onChange={(e) => setDmSearchQuery(e.target.value)} placeholder="Buscar usuário..." autoFocus />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {dmSearchQuery.length >= 1 && dmUserSearch.data ? (
                (dmUserSearch.data as any[]).filter((u: any) => u.id !== currentUser?.id).map((u: any) => (
                  <button key={u.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => startDm.mutate({ targetUserId: u.id })} disabled={startDm.isPending}>
                    <Avatar className="h-9 w-9">
                      {u.avatar && <AvatarImage src={u.avatar} />}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{(u.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{u.name}</p></div>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              ) : dmSearchQuery.length < 1 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Digite pelo menos 1 caractere para buscar</p>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Message Dialog */}
      <AlertDialog open={!!confirmDeleteMsg} onOpenChange={(open) => !open && setConfirmDeleteMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mensagem</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta mensagem? A mensagem será marcada como excluída e o conteúdo original não poderá ser recuperado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteMsg && deleteMessage.mutate({ messageId: confirmDeleteMsg })} className="bg-red-600 hover:bg-red-700">
              {deleteMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Clear Channel Dialog */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Canal</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir TODAS as mensagens deste canal? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => activeChannelId && clearChannel.mutate({ channelId: activeChannelId })} className="bg-red-600 hover:bg-red-700">
              {clearChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Eraser className="w-4 h-4 mr-1" />} Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Toggle Channel Dialog */}
      <AlertDialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmToggle?.ativo ? 'Reativar Canal' : 'Desativar Canal'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmToggle?.ativo
                ? 'Deseja reativar este canal? Os usuários poderão enviar mensagens novamente.'
                : 'Deseja desativar este canal? Os usuários não poderão enviar novas mensagens, mas o histórico será mantido.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmToggle && toggleChannel.mutate(confirmToggle)}>
              {toggleChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {confirmToggle?.ativo ? 'Reativar' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Channel Dialog */}
      <AlertDialog open={!!confirmDeleteChannel} onOpenChange={(open) => !open && setConfirmDeleteChannel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover Canal para Lixeira</AlertDialogTitle>
            <AlertDialogDescription>Deseja mover este canal para a lixeira? O canal ficará oculto para os usuários comuns, mas poderá ser restaurado por um administrador.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteChannel && deleteChannelMut.mutate({ channelId: confirmDeleteChannel })} className="bg-red-600 hover:bg-red-700">
              {deleteChannelMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Restore Channel Dialog */}
      <AlertDialog open={!!confirmRestoreChannel} onOpenChange={(open) => !open && setConfirmRestoreChannel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Canal</AlertDialogTitle>
            <AlertDialogDescription>Deseja restaurar este canal? Ele voltará a ficar visível e ativo para todos os usuários.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRestoreChannel && restoreChannelMut.mutate({ channelId: confirmRestoreChannel })} className="bg-green-600 hover:bg-green-700">
              {restoreChannelMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />} Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
