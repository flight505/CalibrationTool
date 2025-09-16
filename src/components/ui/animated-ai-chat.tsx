"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Paperclip,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as React from "react";
import { ChatTextarea } from "@/components/chat/ChatTextarea";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { TypingDots } from "@/components/chat/TypingDots";
import { commandSuggestions, getQueryForCommand } from "@/components/chat/commandPaletteData";
import { useAutoResizeTextarea } from "@/components/chat/useAutoResizeTextarea";

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

export function AnimatedAIChat() {
    // Generate a unique session ID for this chat instance
    const [sessionId] = React.useState(() => crypto.randomUUID());
    
    const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading, setInput } = useChat({
        api: '/api/chat',
        id: sessionId,
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Hello! I\'m your OrcaSlicer calibration assistant. I can help you with flow ratio calibration, temperature tuning, pressure advance, and more. What would you like to calibrate today?'
            }
        ],
    });
    
    const [attachments, setAttachments] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (input.startsWith('/') && !input.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(input)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [input]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    const query = getQueryForCommand(selectedCommand.prefix);
                    setInput(query);
                    setShowCommandPalette(false);
                    
                    // Auto-submit the command
                    setTimeout(() => {
                        handleChatSubmit(new Event('submit') as any);
                    }, 100);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                handleChatSubmit(e as any);
            }
        }
    };

    const handleAttachFile = async () => {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.stl,.png,.jpg,.jpeg,.gif,.bmp';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            // Add to attachments list temporarily
            setAttachments(prev => [...prev, file.name]);
            
            // Upload file
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'x-session-id': sessionId,
                    },
                    body: formData,
                });
                
                if (!response.ok) {
                    throw new Error('Upload failed');
                }
                
                const result = await response.json();
                
                // Add context about the uploaded file to the chat
                if (result.extractedContent) {
                    const fileContext = `\n\n[File uploaded: ${result.filename}]\n${result.extractedContent}`;
                    setInput(prev => prev + fileContext);
                }
            } catch (error) {
                console.error('Upload error:', error);
                // Remove from attachments on error
                setAttachments(prev => prev.filter(name => name !== file.name));
                alert('Failed to upload file. Please try again.');
            }
        };
        
        input.click();
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        const query = getQueryForCommand(selectedCommand.prefix);
        setInput(query);
        setShowCommandPalette(false);
        
        // Auto-submit the command
        setTimeout(() => {
            handleChatSubmit(new Event('submit') as any);
        }, 100);
    };

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const styleId = 'animated-ai-chat-ripple';
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = rippleKeyframes;
        document.head.appendChild(style);

        return () => {
            const existing = document.getElementById(styleId);
            existing?.remove();
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col w-full bg-transparent text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 relative z-10">
                {/* Header */}
                <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                        OrcaSlicer Calibration Assistant
                    </h1>
                    <p className="text-sm text-white/40 mt-2">
                        Ask about calibration, settings, or troubleshooting
                    </p>
                </motion.div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                'flex gap-3',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-4 py-3',
                                    message.role === 'user'
                                        ? 'bg-white/10 backdrop-blur-lg text-white border border-white/10'
                                        : 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-lg text-white border border-white/10'
                                )}
                            >
                                {message.role === 'assistant' ? (
                                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Custom components for chat-optimized rendering
                                                p: ({ children }) => (
                                                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                                ),
                                                code: ({ children, className }) => {
                                                    const isInline = !className;
                                                    if (isInline) {
                                                        return (
                                                            <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                    return (
                                                        <pre className="bg-black/30 border border-white/10 rounded-lg p-3 overflow-x-auto my-2">
                                                            <code className="text-cyan-300 text-xs font-mono">{children}</code>
                                                        </pre>
                                                    );
                                                },
                                                pre: ({ children }) => children, // Let code handle the pre wrapper
                                                strong: ({ children }) => (
                                                    <strong className="font-semibold text-cyan-300">{children}</strong>
                                                ),
                                                em: ({ children }) => (
                                                    <em className="italic text-purple-300">{children}</em>
                                                ),
                                                ul: ({ children }) => (
                                                    <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                                                ),
                                                ol: ({ children }) => (
                                                    <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                                                ),
                                                li: ({ children }) => (
                                                    <li className="leading-relaxed">{children}</li>
                                                ),
                                                h1: ({ children }) => (
                                                    <h1 className="text-lg font-bold text-cyan-300 mt-3 mb-2 first:mt-0">{children}</h1>
                                                ),
                                                h2: ({ children }) => (
                                                    <h2 className="text-base font-bold text-cyan-300 mt-3 mb-2 first:mt-0">{children}</h2>
                                                ),
                                                h3: ({ children }) => (
                                                    <h3 className="text-sm font-bold text-cyan-300 mt-2 mb-1 first:mt-0">{children}</h3>
                                                ),
                                                blockquote: ({ children }) => (
                                                    <blockquote className="border-l-2 border-cyan-500 pl-3 my-2 italic text-gray-300">
                                                        {children}
                                                    </blockquote>
                                                ),
                                                hr: () => (
                                                    <hr className="border-white/20 my-3" />
                                                ),
                                                a: ({ href, children }) => (
                                                    <a 
                                                        href={href} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                                                    >
                                                        {children}
                                                    </a>
                                                ),
                                                table: ({ children }) => (
                                                    <div className="overflow-x-auto my-2">
                                                        <table className="min-w-full border border-white/20 rounded">
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),
                                                thead: ({ children }) => (
                                                    <thead className="bg-white/5">{children}</thead>
                                                ),
                                                th: ({ children }) => (
                                                    <th className="border border-white/20 px-2 py-1 text-left text-xs font-semibold">
                                                        {children}
                                                    </th>
                                                ),
                                                td: ({ children }) => (
                                                    <td className="border border-white/20 px-2 py-1 text-xs">
                                                        {children}
                                                    </td>
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/10">
                                <TypingDots />
                            </div>
                        </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="px-4 pb-6">
                    <motion.div 
                        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <CommandPalette
                            isOpen={showCommandPalette}
                            activeIndex={activeSuggestion}
                            suggestions={commandSuggestions}
                            paletteRef={commandPaletteRef}
                            onSelect={selectCommandSuggestion}
                        />

                        <div className="p-4">
                            <ChatTextarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Ask about OrcaSlicer calibration..."
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-white/90 text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-white/20",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 pt-0 border-t border-white/[0.05] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-white/10 text-white/90"
                                    )}
                                >
                                    <Command className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                            </div>
                            
                            <motion.button
                                type="button"
                                onClick={(e) => handleChatSubmit(e as any)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading || !input.trim()}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    "flex items-center gap-2",
                                    input.trim()
                                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                                        : "bg-white/[0.05] text-white/40"
                                )}
                            >
                                {isLoading ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Command suggestions */}
                    <motion.div 
                        className="flex flex-wrap items-center justify-center gap-2 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-white/[0.05] rounded-lg"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}
