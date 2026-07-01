

import { AttachmentFile } from "@/components/chat/chatinput";
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AttachmentFile[];
  createdAt?: Date;
  timestamp?: string;
}

// export interface ChatRequest {
//     messages: Message[];



// }

// // Optional:
// // Represents API responses.
// export interface ChatResponse {


// }