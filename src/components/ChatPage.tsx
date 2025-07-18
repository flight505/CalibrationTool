'use client';

import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';

export function ChatPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] -mx-4 -my-6">
      <AnimatedAIChat />
    </div>
  );
}

export default ChatPage;