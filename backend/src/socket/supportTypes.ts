export type SupportSenderType = "user" | "agent" | "system";
export type SupportTicketStatus = "OPEN" | "CLOSED";

export interface SupportChatMessage {
  id: string;
  userId: number;
  senderType: SupportSenderType;
  senderLabel: string;
  text: string;
  createdAt: number;
}

export interface SupportTicketSummary {
  userId: number;
  status: SupportTicketStatus;
  lastMessage: string;
  lastMessageAt: number;
}

export interface SupportJoinAckOk {
  ok: true;
  userId: number;
  history: SupportChatMessage[];
  ticketStatus: SupportTicketStatus;
}

export interface SupportJoinAckError {
  ok: false;
  error: string;
}

export type SupportJoinAck = SupportJoinAckOk | SupportJoinAckError;

export interface SupportSendPayload {
  text: string;
}

export interface SupportSendAckOk {
  ok: true;
}

export interface SupportSendAckError {
  ok: false;
  error: string;
}

export type SupportSendAck = SupportSendAckOk | SupportSendAckError;

export interface SupportAgentJoinPayload {
  userId: number;
}

export interface SupportClosePayload {
  userId?: number;
}

