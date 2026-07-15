


export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools_response?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result_reference?: any;

  route_used?: string | null;

  createdAt?: Date;
  timestamp?: string;
}