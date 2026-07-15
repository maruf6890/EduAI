
"use client";

import { AnimatePresence } from "framer-motion";
import ChatMessage, { TypingIndicator } from "@/components/chat/ChatMessage";
import { Message } from "@/lib/types/chat";

interface ChatMessagesProps {
  messages: Message[];
  isGenerating?: boolean; // ✅ NEW: drives the typing bubble
}

export default function ChatMessages({
  messages,
  isGenerating = false,
}: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            // Mark the most recent message so we can add the subtle ring
            isLatest={index === messages.length - 1}
          />
        ))}

        {/*  NEW: Typing indicator — shown while AI is generating a reply */}
        {isGenerating && <TypingIndicator key="typing-indicator" />} 
      </AnimatePresence>
    </div>
  );
}