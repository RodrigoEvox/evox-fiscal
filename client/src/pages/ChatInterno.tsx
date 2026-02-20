import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  MessageCircle, Send, Loader2, AtSign, Users, Building2, Search,
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

export default function ChatInterno() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading } = trpc.chat.list.useQuery(
    { limit: 200 },
    { refetchInterval: 5000 }
  );

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      setInputValue('');
      setMentions([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const [inputValue, setInputValue] = useState('');
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mentionSuggestions = trpc.chat.mentionSuggestions.useQuery(
    { query: mentionQuery },
    { enabled: showMentions && mentionQuery.length >= 1 }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check if user is typing a mention (@)
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show mentions if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') || textAfterAt.length <= 1) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionCursorPos(lastAtIndex);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = (suggestion: MentionSuggestion) => {
    const before = inputValue.slice(0, mentionCursorPos);
    const after = inputValue.slice(mentionCursorPos + mentionQuery.length + 1); // +1 for @
    const newValue = `${before}@${suggestion.name} ${after}`;
    setInputValue(newValue);
    setMentions(prev => [...prev, { type: suggestion.type, id: suggestion.id, name: suggestion.name }]);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage.mutate({
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
      const mentionText = `@${mention.name}`;
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
            key={`${mention.id}-${idx}`}
            className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium ${
              mention.type === 'user'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {mention.type === 'user' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
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

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Chat Interno
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comunicação interna da equipe — use @nome para mencionar usuários ou clientes
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie a primeira mensagem para iniciar a conversa!</p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium capitalize">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200" />
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
                  <div key={msg.id} className={`flex gap-2.5 px-2 py-0.5 hover:bg-gray-50/50 rounded-lg transition-colors ${showHeader ? 'mt-3' : 'mt-0'}`}>
                    {/* Avatar */}
                    <div className="w-8 shrink-0">
                      {showHeader && (
                        <Avatar className="h-8 w-8">
                          {msg.userAvatar && <AvatarImage src={msg.userAvatar} />}
                          <AvatarFallback className={`text-xs font-medium ${isOwn ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {(msg.userName || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {showHeader && (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-semibold ${isOwn ? 'text-blue-600' : 'text-gray-800'}`}>
                            {msg.userName}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-gray-700 leading-relaxed break-words">
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
      <div className="border-t pt-3 relative">
        {/* Mention suggestions dropdown */}
        {showMentions && mentionSuggestions.data && mentionSuggestions.data.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
            {(mentionSuggestions.data as MentionSuggestion[]).map((s) => (
              <button
                key={`${s.type}-${s.id}`}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                onClick={() => handleSelectMention(s)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  s.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {s.type === 'user' ? <Users className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.type === 'user' ? 'Usuário' : 'Cliente'}</p>
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
              placeholder="Digite sua mensagem... Use @ para mencionar"
              className="pr-10"
              disabled={sendMessage.isPending}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
              onClick={() => {
                setInputValue(prev => prev + '@');
                setShowMentions(true);
                setMentionQuery('');
                setMentionCursorPos(inputValue.length);
                inputRef.current?.focus();
              }}
              title="Mencionar usuário ou cliente"
            >
              <AtSign className="w-4 h-4" />
            </button>
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
            Enviar
          </Button>
        </div>

        {/* Active mentions indicator */}
        {mentions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400">Menções:</span>
            {mentions.map((m, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${m.type === 'user' ? 'border-blue-200 text-blue-600' : 'border-purple-200 text-purple-600'}`}>
                @{m.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
