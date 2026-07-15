"use client";

import { useState, useRef, useEffect, useCallback, useContext } from "react";
import AnimatedAIChat from "@/components/chat/chatinput";
import ChatMessages from "@/components/chat/ChatMessages";
import { Message } from "@/lib/types/chat";
import { private_api_call } from "@/actions/private_api_call";
import { ClassroomContext, useClassroom } from "../ClassroomContext";
import { Loader2, PanelRightOpen, Plus, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { public_api_call } from "@/actions/public_api_call";
import { ChatSession } from "@/lib/types/classrooms";
import { toast } from "sonner";
import EmptyChatState from "./EmptyChatPage";
import Loading from "@/app/loader";





// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map_chat_data = (data: any): Message[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: item?.id || crypto.randomUUID(),
    role: item?.message_type == "human" ? "user" : "assistant",
    content: item?.message || "",
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
  const [isGenerating, setIsGenerating] = useState(false);
  const classroom_data = useContext(ClassroomContext);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const classroom = useClassroom();
  const [selectedSessions, setSelectedSessions] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);



  const [messages, setMessages] = useState<Message[]>([]);








  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 
  const [inputFocused, setInputFocused] = useState(false);


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

  const createSession = async (title: string) => {
  const payload = {
    user_id: classroom?.current_user.id,
    classroom_id: classroom?.id,
    title: title || `Session ${new Date().toLocaleString()}`,
  };

  const res = await public_api_call({
    path: "chat/sessions",
    method: "POST",
    body: payload,
  });

  if (!res.success) {
    throw new Error("Failed to create session");
  }

  setChatSessions((prev) => [
    res.data,
    ...prev,
  ]);

  setSelectedSessions(res.data);

  return res.data;
};



  const handleSend = useCallback(async () => {
    
    
    if (!inputText.trim() || isGenerating) return;
    let currentSession= selectedSessions;
    if (!currentSession) {
       currentSession = await createSession(inputText.trim().length > 20 ? inputText.trim().substring(0, 20)+"..." : inputText.trim());
     
    }

    const trimmedText = inputText.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedText,
      createdAt: new Date(),
    };

    const messagesForApi = [...messages, userMessage];

    setMessages(messagesForApi);
    setInputText("");
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
        path: `chat/sessions/${currentSession?.id}/message`,
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
  }, [inputText, messages, isGenerating, adjustHeight]);

  
  






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
  }, [classroom?.current_user.id, classroom?.id]);

  
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
        {
          selectedSessions === null ? (
           <EmptyChatState onSuggestionClick={(message) => {
              setInputText(message);
              handleSend();
           }}/>
          ) :
        
        
          loadingMessages ? (
          <div className="flex items-center justify-center h-full">
          <Loading/>
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
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          LoadingMessages={loadingMessages}
          isGenerating={isGenerating}
   
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
