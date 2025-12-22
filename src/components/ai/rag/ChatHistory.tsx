import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Trash2, Search, ChevronRight } from 'lucide-react';
import { ragApi } from './rag.api';
import { toast } from 'sonner';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
}

export function ChatHistory({ onSelectChat }: ChatHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await ragApi.getChatHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group history by date
  const groupedHistory = history.reduce((groups: any, chat: any) => {
    const date = new Date(chat.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Chat History</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No chat history found
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, chats]: [string, any]) => (
            <div key={date} className="mb-4">
              <h4 className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {date}
              </h4>
              <div className="space-y-1">
                {chats.map((chat: any) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg group transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">
                          {chat.question}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.answer}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
