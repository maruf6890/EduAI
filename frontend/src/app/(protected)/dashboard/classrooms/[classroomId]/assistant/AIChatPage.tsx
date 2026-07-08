"use client";

import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import AnimatedAIChat, { AttachmentFile } from "@/components/chat/chatinput";
import ChatMessages from "@/components/chat/ChatMessages";
import { Message } from "@/lib/types/chat";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { private_api_call } from "@/actions/private_api_call";
import { ClassroomContext, useClassroom } from "../ClassroomContext";
import { Loader2, PanelRightOpen, Plus, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { public_api_call } from "@/actions/public_api_call";
import { ChatSession } from "@/lib/types/classrooms";
import { toast } from "sonner";
import { p } from "framer-motion/client";


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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map_chat_data = (data: any): Message[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: item?.id || crypto.randomUUID(),
    role: item?.message_type == "human" ? "user" : "assistant",
    content: item.message?.content ?? "",
    tools_response: item.tool_result,
    result_reference: item.result_reference,
    route_used: item.route_used,
    attachments: item.attachments ?? [],
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    timestamp: item.timestamp,
  }));
}



export default function AIChatbotPage() {
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const classroom_data = useContext(ClassroomContext);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const classroom = useClassroom();
  const [selectedSessions, setSelectedSessions] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);


  //  Hook methods initialized here
  const { isRecording, transcript, startRecording, stopRecording, isSupported } = useSpeechToText();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Hi there! I'm ready to assist you. How can I help you today?",
      createdAt: new Date(),
    },
  ]);


  useEffect(() => {
    const setInputFromTranscript = async () => {
      if (transcript) {
        setInputText((prev) => prev + transcript);
      }
    }
    setInputFromTranscript();
  }, [transcript]);



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


  const messagesEndRef = useRef<HTMLDivElement>(null);


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
  
  const handleCreateNewSession = async () => {
    try {
      const payload = {
        user_id: classroom?.current_user.id,
        classroom_id: classroom?.id,
        title: `Session ${new Date().toLocaleString()}`,
      };
      setCreatingSession(true);
      const res = await public_api_call({
        path: "chat/sessions",
        method: "POST",
        body: payload,
      });

      if (res.success) {
        toast.success("New session created successfully!");
        setChatSessions((prev) => [res.data, ...prev]);
        setSelectedSessions(res.data);
      } else {
        toast.error(res.message || "Failed to create session.");
        console.error("Failed to create session:", res.message);
      }
    } catch (error) {
      toast.error("An error occurred while creating the session.");
      console.error("Error creating session:", error);
    } finally {
      setCreatingSession(false);
    }
  };
  const handleSend = useCallback(async () => {
    
    
    if (!inputText.trim() || isGenerating) return;
    if (!selectedSessions) {
      handleCreateNewSession();
      return;
    }

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
      const payload = {
        question: trimmedText,
        role: classroom_data?.current_user?.role ?? "student",
        user_id: classroom_data?.current_user?.id ?? "",
        classroom_id: classroom_data?.id ?? "",
      };
      console.log(payload);

      const res = await private_api_call({
        path: `chat/sessions/${selectedSessions?.id}/message`,
        method: "POST",
        body: payload,
      });
      console.log("API Response:", res);



      const assistantMessage: Message = map_chat_data([res.data])[0] ?? {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't generate a response. Please try again.",
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

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await public_api_call({
          path: `chat/sessions/${classroom?.current_user.id}/classrooms/${classroom?.id}`,
          method: "GET",
        });
        if (res.success) {
          setChatSessions(res.data ?? []);
        } else {
          console.error("Failed to fetch sessions:", res.message);
          setChatSessions([]);    
        }
        

      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, []);

  
  useEffect(() => {
    const fetchMessagesForSession = async () => {
      if (!selectedSessions) {
        setMessages([]);
        return;
      }
      try {
        setLoadingMessages(true);
        const res = await public_api_call({
          path: `chat/sessions/detail/${selectedSessions?.id}/messages`,
          method: "GET",
        });
        console.log("Fetched messages for session:", res);
        if (res.success) {
          setMessages(map_chat_data(res.data)??[]);
        } else {
          console.error("Failed to fetch messages:", res.message);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }finally {
        setLoadingMessages(false);
      }
    };

    
   fetchMessagesForSession();
    
  }, [selectedSessions]);

  // console.log("Messages:", messages);
 

  return (
    <div className="flex flex-col px-4 h-[90vh] w-full bg-bg-main text-main">
      <div className="bg-linear-to-r flex justify-between items-center from-sky-200 to-[] px-6 py-4 shadow-sm rounded-sm shrink-0 z-20 text-black font-bold">
        <div>
          <h1 className="text-sm uppercase tracking-[2px] letter-spacing-[3px] flex gap-1 items-center">
            <Sparkle className="size-4" />
            <span>AI Assistant</span>
          </h1>
          <p className="text-xs opacity-80 font-medium mt-0.5">
            Always here to help you
          </p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsSheetOpen(true)}
        >
          <PanelRightOpen className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
           Loading messages...
          </div>
        ): (
            <>
            <ChatMessages messages={messages} isGenerating={isGenerating} />
            <div ref={messagesEndRef} />
          </>
        )}
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
          onCaptureAudio={handleMicToggle}
          onRemoveAttachment={handleRemoveAttachment}
          models={AI_MODELS}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          showCommandPalette={false}
          activeSuggestion={activeSuggestion}
          onToggleCommandPalette={() => setShowCommandPalette((prev) => !prev)}
          onSelectCommand={handleSelectCommand}
          commandPaletteRef={commandPaletteRef}
          LoadingMessages={loadingMessages}
          isGenerating={isGenerating}
          inputFocused={inputFocused}
          mousePosition={mousePosition}
        />
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sessions</SheetTitle>
            <SheetDescription className="sr-only">
              List of all sessions created by the user.
            </SheetDescription>
            <Button
              variant="secondary"
              disabled={creatingSession}
              className="flex rounded-sm! items-center gap-2"
              onClick={handleCreateNewSession}
            >
              {creatingSession ? (
                <Loader2 className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              Create New Session
            </Button>
          </SheetHeader>
          {loadingSessions ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading sessions...</p>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p>No sessions found. Create a new session to get started.</p>
            </div>
          ) : (
            <div className="grid flex-1 auto-rows-min gap-6 px-4">
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedSessions(session);
                    }}
                    key={session.id}
                    className="border cursor-pointer rounded-sm p-2"
                  >
                    <p className="font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created:{" "}
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <SheetFooter>
            <SheetClose> </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
