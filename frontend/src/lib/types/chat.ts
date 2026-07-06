import { AttachmentFile } from "@/components/chat/chatinput";


export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;

  tools_response?: unknown;
  result_reference?: unknown;

  route_used?: string | null;

  attachments?: AttachmentFile[];

  createdAt?: Date;
  timestamp?: string;
}