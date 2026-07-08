import { AttachmentFile } from "@/components/chat/chatinput";


export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools_response?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result_reference?: any;

  route_used?: string | null;

  attachments?: AttachmentFile[];

  createdAt?: Date;
  timestamp?: string;
}