'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Bot, User, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: import.meta.env.DEV ? 'http://localhost:3000/api/chat' : '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your OrcaSlicer assistant. I can help you with calibration, troubleshooting, and settings optimization. What would you like to know?'
      }
    ],
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const quickActions = [
    { label: 'Flow Calibration', query: 'How do I calibrate flow ratio in OrcaSlicer?' },
    { label: 'Temperature Tower', query: 'What are the steps for temperature calibration?' },
    { label: 'Retraction Test', query: 'How to fix stringing issues with retraction?' },
    { label: 'Pressure Advance', query: 'Explain pressure advance calibration' },
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
    handleSubmit(new Event('submit') as any);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-4 top-20 bottom-4 w-96 z-50"
      >
        <Card className="h-full flex flex-col shadow-2xl border-zinc-700 bg-zinc-900/95 backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">OrcaSlicer Assistant</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 text-sm',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-100'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-zinc-500 mb-2">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.query)}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded px-2 py-1.5 text-left transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Attachments */}
          {attachedFiles.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-zinc-800 rounded px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.jpg,.jpeg,.png,.stl"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="hover:bg-zinc-800"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about calibration, settings, or troubleshooting..."
                className="flex-1 min-h-[60px] max-h-[120px] bg-zinc-800 border-zinc-700 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="sm"
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}