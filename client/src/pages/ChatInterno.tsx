import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MessageCircle, Send, Loader2, Users, Building2, Hash, Plus,
  CheckCheck, AtSign, Search, X,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

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

export default function Chat() {
  const { user: currentUser } = useAuth();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: channels = [], isLoading: loadingChannels } = trpc.chat.channels.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const { data: unreadData } = trpc.chat.unreadCount.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );

  const { data: messages = [], isLoading: loadingMessages } = trpc.chat.list.useQuery(
    { channelId: activeChannelId!, limit: 200 },
    { enabled: !!activeChannelId, refetchInterval: 5000 }
  );

  const userSuggestions = trpc.chat.userSuggestions.useQuery(
    { query: mentionQuery },
    { enabled: showMentions && mentionType === 'user' && mentionQuery.length >= 1 }
  );

  const clientSuggestions = trpc.chat.clientSuggestions.useQuery(
    { query: mentionQuery },
    { enabled: showMentions && mentionType === 'client' && mentionQuery.length >= 1 }
  );

  const suggestions = mentionType === 'user' ? userSuggestions.data : clientSuggestions.data;

  // Mutations
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      utils.chat.unreadCount.invalidate();
      setInputValue('');
      setMentions([]);
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

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const geral = channels.find((c: any) => c.tipo === 'geral');
      setActiveChannelId(geral ? geral.id : channels[0].id);
    }
  }, [channels, activeChannelId]);

  // Mark as read when switching channels
  useEffect(() => {
    if (activeChannelId) {
      markRead.mutate({ channelId: activeChannelId });
    }
  }, [activeChannelId]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get unread count for a channel
  const getChannelUnread = useCallback((channelId: number) => {
    if (!unreadData?.byChannel) return 0;
    const ch = unreadData.byChannel.find((c: any) => c.channelId === channelId);
    return ch?.count || 0;
  }, [unreadData]);

  // Handle input change with dual mention detection (@ for users, # for clients)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Check for @ (user mention)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');

    // Determine which trigger is more recent
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
    const after = inputValue.slice(mentionCursorPos + mentionQuery.length + 1); // +1 for trigger char
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
        newResult.push(
          <span
            key={`${mention.id}-${idx}-${Math.random()}`}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
              mention.type === 'user'
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
  }, []);

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

  const activeChannel = channels.find((c: any) => c.id === activeChannelId);

  // Separate channels by type
  const geralChannels = channels.filter((c: any) => c.tipo === 'geral');
  const setorChannels = channels.filter((c: any) => c.tipo === 'setor');
  const projetoChannels = channels.filter((c: any) => c.tipo === 'projeto');

  if (loadingChannels) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 rounded-xl border overflow-hidden bg-background">
      {/* Channel sidebar */}
      <div className="w-64 shrink-0 border-r bg-muted/30 flex flex-col">
        {/* Sidebar header */}
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> Chat
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowNewChannel(true)}
            title="Novo canal"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Channel list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {/* Geral */}
            {geralChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Geral</p>
                {geralChannels.map((ch: any) => {
                  const unread = getChannelUnread(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1">{ch.nome}</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Setores */}
            {setorChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Setores</p>
                {setorChannels.map((ch: any) => {
                  const unread = getChannelUnread(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1">{ch.nome}</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Projetos */}
            {projetoChannels.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Projetos</p>
                {projetoChannels.map((ch: any) => {
                  const unread = getChannelUnread(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1">{ch.nome}</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            {activeChannel && (
              <>
                {activeChannel.tipo === 'geral' && <MessageCircle className="w-4 h-4 text-primary" />}
                {activeChannel.tipo === 'setor' && <Building2 className="w-4 h-4 text-primary" />}
                {activeChannel.tipo === 'projeto' && <Hash className="w-4 h-4 text-primary" />}
                <span className="font-semibold text-sm">{activeChannel.nome}</span>
                {activeChannel.descricao && (
                  <span className="text-xs text-muted-foreground hidden sm:inline ml-2">
                    — {activeChannel.descricao}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 py-2 border-b flex items-center gap-2 bg-muted/20">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mensagens..."
              className="h-8 text-sm"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {!activeChannelId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">Selecione um canal</p>
              <p className="text-sm">Escolha um canal na barra lateral para iniciar</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : groupedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">Nenhuma mensagem</p>
              <p className="text-sm">Envie a primeira mensagem neste canal!</p>
            </div>
          ) : (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-medium capitalize">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {group.messages.map((msg: any, mi: number) => {
                  const isOwn = msg.userId === currentUser?.id;
                  const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                  const isSameUser = prevMsg && prevMsg.userId === msg.userId;
                  const timeDiff = prevMsg
                    ? (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) / 60000
                    : 999;
                  const showHeader = !isSameUser || timeDiff > 5;

                  return (
                    <div key={msg.id} className={`flex gap-2.5 px-2 py-0.5 hover:bg-muted/30 rounded-lg transition-colors ${showHeader ? 'mt-3' : 'mt-0'}`}>
                      {/* Avatar */}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-semibold ${isOwn ? 'text-primary' : 'text-foreground'}`}>
                              {msg.userName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div className="text-sm text-foreground/90 leading-relaxed break-words">
                          {renderContent(msg.content, msg.mentions)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {activeChannelId && (
          <div className="border-t p-3 relative">
            {/* Mention suggestions dropdown */}
            {showMentions && suggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full mb-1 left-3 right-3 bg-popover text-popover-foreground border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                <div className="px-3 py-1.5 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {mentionType === 'user' ? '@ Usuários' : '# Clientes'}
                  </p>
                </div>
                {(suggestions as MentionSuggestion[]).map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                    onClick={() => handleSelectMention(s)}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
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
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem... @ para usuários, # para clientes"
                  className="pr-20"
                  disabled={sendMessage.isPending}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    className="text-muted-foreground hover:text-blue-500 transition-colors p-1 rounded"
                    onClick={() => {
                      setInputValue(prev => prev + '@');
                      setShowMentions(true);
                      setMentionType('user');
                      setMentionQuery('');
                      setMentionCursorPos(inputValue.length);
                      inputRef.current?.focus();
                    }}
                    title="Mencionar usuário (@)"
                  >
                    <AtSign className="w-4 h-4" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-emerald-500 transition-colors p-1 rounded"
                    onClick={() => {
                      setInputValue(prev => prev + '#');
                      setShowMentions(true);
                      setMentionType('client');
                      setMentionQuery('');
                      setMentionCursorPos(inputValue.length);
                      inputRef.current?.focus();
                    }}
                    title="Mencionar cliente (#)"
                  >
                    <Hash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessage.isPending}
                size="sm"
                className="gap-1.5 px-4"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Active mentions indicator */}
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
      </div>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Canal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Ex: Projeto Alpha"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="Breve descrição do canal"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newChannelTipo} onValueChange={(v) => setNewChannelTipo(v as 'projeto' | 'setor')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="setor">Setor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChannel(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newChannelName.trim()) { toast.error('Nome é obrigatório'); return; }
                createChannel.mutate({
                  nome: newChannelName.trim(),
                  descricao: newChannelDesc.trim() || undefined,
                  tipo: newChannelTipo,
                });
              }}
              disabled={createChannel.isPending}
            >
              {createChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Criar Canal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
