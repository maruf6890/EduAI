
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types/chat";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useEffect } from "react";

// ─── Typing indicator bubble (three animated dots) ────────────────────────────

export function TypingIndicator() {
  return (
    <motion.div
      className="flex items-end gap-3 px-4 py-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      {/* AI avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 text-brand-primary"
        >
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {/* Dot bubble */}
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Single message bubble ────────────────────────────────────────────────────

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export default function ChatMessage({
  message,
  isLatest = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = message.createdAt
    ? formatTime(new Date(message.createdAt))
    : null;

  const [nodes, setNodes] = React.useState(
    message.tools_response && message.route_used === "planning"
      ? message.tools_response?.flow?.nodes
      : [],
  );
  const [edges, setEdges] = React.useState(
    message.tools_response && message.route_used === "planning"
      ? message.tools_response?.flow?.edges
      : [],
  );



  const toolsResponse = message.tools_response? message?.tools_response : null;
  console.log("toolsResponse", toolsResponse);
  // console.log("toolsResponse", nodes);

  return (
    <motion.div
      className={cn(
        "flex items-end gap-3 px-4 py-1",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center self-end mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 text-brand-primary"
          >
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
      )}

      {/* Bubble + timestamp */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start",
          // ✅ FIX: cap width so text wraps instead of overflowing
          "max-w-[72%]",
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed break-words space-y-3 whitespace-pre-wrap",
            isUser
              ? [
                  "bg-brand-primary text-white font-medium",
                  "rounded-2xl rounded-br-sm",
                  // subtle pulse ring on the very latest user message
                  isLatest && "ring-1 ring-brand-primary/40",
                ]
              : [
                  "bg-surface text-foreground-muted border ",
                  "rounded-2xl rounded-bl-sm",
                ],
          )}
        >
          {message?.content}


          <div className="flex flex-col gap-1">
            {(toolsResponse && message.route_used === "planning") && (
              <div className="w-full">
              
                  <div
                    style={{ height: "600px", width: "800px" }}
                    className="border"
                  >
                    <ReactFlow nodes={nodes} edges={edges} fitView >
                      <Background />
                      <Controls />
                    </ReactFlow>
                  </div>
                
              </div>
            )}
          </div>
        </div>

        {time && (
          <span
            suppressHydrationWarning
            className="text-[10px] text-white/25 px-1 select-none"
          >
            {time}
          </span>
        )}
      </div>
    </motion.div>
  );
}
