"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import AnimatedAIChat, { AttachmentFile } from "@/components/chat/chatinput";
// import { ai_api_call } from '@/actions/ai_api_call'; // ✅ Uncommented — wire your action here
import ChatMessage from "@/components/chat/ChatMessage";
import ChatMessages from "@/components/chat/ChatMessages";
import { Message } from "@/lib/types/chat";
import { useSpeechToText } from "@/hooks/useSpeechToText";

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Advanced multimodal model" },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Strong coding model",
  },
];

const COMMAND_SUGGESTIONS = [
  {
    icon: null,
    label: "Summarize",
    description: "Analyze files",
    prefix: "/summarize",
  },
  { icon: null, label: "Debug", description: "Find bugs", prefix: "/debug" },
];

export default function AIChatbotPage() {
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);

  // ✅ Hook methods initialized here
  const { isRecording, transcript, startRecording, stopRecording, isSupported } = useSpeechToText();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Hi there! I'm ready to assist you. How can I help you today?",
      createdAt: new Date(),
    },
  ]);

  // ✅ Automatically sync spoken words to the input text field
  useEffect(() => {
    if (transcript) {
      setInputText((prev) => prev + transcript);
    }

  }, [transcript]);

  // ✅ Mic click handler: starts or stops the Web Speech API
  const handleMicToggle = useCallback(() => {
    if (!isSupported) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isSupported, isRecording, startRecording, stopRecording]);

  // ✅ FIX 1: Ref for the bottom of the message list — enables auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ FIX 1: Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  const [inputFocused, setInputFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const minHeight = 60;
  const maxHeight = 200;

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const el = textareaRef.current;
      if (!el) return;
      if (reset) { el.style.height = `${minHeight}px`; return; }
      el.style.height = `${minHeight}px`;
      el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight ?? Infinity))}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => { adjustHeight(); }, [inputText, adjustHeight]);
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const commandButton = document.querySelector("[data-command-button]");
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ FIX 3: Clean ai_api_call integration
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isGenerating) return;

    const trimmedText = inputText.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedText,
      attachments: attachments,
      createdAt: new Date(),
    };

    const messagesForApi = [...messages, userMessage];

    setMessages(messagesForApi);
    setInputText("");
    setAttachments([]);
    adjustHeight(true);
    setIsGenerating(true);

    try {
      const response = {
        content: "This is a dummy response from the AI model. In a real implementation, this would be the actual response from your AI API."
      };

      // const response = await ai_api_call({
      //   messages: messagesForApi.map((m) => ({
      //     role: m.role,
      //     content: m.content,
      //   })),
      //   model: selectedModel,
      //   // If your action supports attachments, include them too:
      //   // attachments: userMessage.attachments,
      // });

      // Assumes ai_api_call resolves to { content: string }.
      // Adjust the property name (response.text, response.message, etc.) to match yours.

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.content,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error submitting prompt", err);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Please try again.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, selectedModel, attachments, messages, isGenerating, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showCommandPalette && COMMAND_SUGGESTIONS.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveSuggestion((prev) => prev < COMMAND_SUGGESTIONS.length - 1 ? prev + 1 : 0);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveSuggestion((prev) => prev > 0 ? prev - 1 : COMMAND_SUGGESTIONS.length - 1);
        } else if ((e.key === "Tab" || e.key === "Enter") && activeSuggestion >= 0) {
          e.preventDefault();
          setInputText(COMMAND_SUGGESTIONS[activeSuggestion].prefix + " ");
          setShowCommandPalette(false);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowCommandPalette(false);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (inputText.trim() && !isGenerating) handleSend();
      }
    },
    [showCommandPalette, activeSuggestion, inputText, isGenerating, handleSend],
  );

  const onAttachFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped: AttachmentFile[] = files.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("image/")
        ? "image"
        : f.type === "application/pdf"
          ? "pdf"
          : f.type.startsWith("audio/")
            ? "audio"
            : "unknown",
    }));
    setAttachments((prev) => [...prev, ...mapped]);
    e.target.value = "";
  }, []);

  const handleCapturePicture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachments((prev) => [
      ...prev,
      { id: `${Date.now()}-${file.name}`, name: file.name, url: URL.createObjectURL(file), type: "image" },
    ]);
    e.target.value = "";
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSelectCommand = useCallback((prefix: string) => {
    setInputText((prev) => prev + prefix);
    setShowCommandPalette(false);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-bg-main text-main">
      <div className="bg-brand-primary px-6 py-4 shadow-md shrink-0 z-20 text-black font-bold">
        <h1 className="text-xl tracking-tight">AI Assistant</h1>
        <p className="text-xs opacity-80 font-medium mt-0.5">Always here to help you</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} isGenerating={isGenerating} />
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 z-20 relative bg-bg-main">
        <AnimatedAIChat
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          placeholderText="Ask AI a question..."
          textareaRef={textareaRef}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          attachments={attachments}
          onAttachFiles={onAttachFiles}
          onCapturePicture={handleCapturePicture}
          // ✅ Hook triggers the microphone instead of opening a file input on the UI side
          onCaptureAudio={handleMicToggle}
          onRemoveAttachment={handleRemoveAttachment}
          models={AI_MODELS}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          commandSuggestions={COMMAND_SUGGESTIONS}
          showCommandPalette={showCommandPalette}
          activeSuggestion={activeSuggestion}
          onToggleCommandPalette={() => setShowCommandPalette((prev) => !prev)}
          onSelectCommand={handleSelectCommand}
          commandPaletteRef={commandPaletteRef}
          isGenerating={isGenerating}
          inputFocused={inputFocused}
          mousePosition={mousePosition}
        />
      </div>
    </div>
  );
}
