// import ChatMessage from "./ChatMessage";
// import {Message } from "@/types/chat";

// interface ChatMessagesProps {
//   messages: Message[];
// }

// export default function ChatMessages({
//   messages,
// }: ChatMessagesProps) {
//   if (messages.length === 0) {
//     return (
//       <div className="flex flex-1 items-center justify-center text-white/40">
//         Start a conversation...
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
//       {messages.map((message) => (
//         <ChatMessage
//           key={message.id}
//           message={message}
//         />
//       ))}
//     </div>
//   );
// }
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

        {/* ✅ NEW: Typing indicator — shown while AI is generating a reply */}
        {isGenerating && <TypingIndicator key="typing-indicator" />}
      </AnimatePresence>
    </div>
  );
}