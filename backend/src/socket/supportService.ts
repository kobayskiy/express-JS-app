import { randomUUID } from "crypto";
import type {
  SupportChatMessage,
  SupportSenderType,
  SupportTicketStatus,
  SupportTicketSummary,
} from "./supportTypes";

type MessagesByUser = Map<number, SupportChatMessage[]>;

const messagesByUser: MessagesByUser = new Map();
const ticketStatusByUser: Map<number, SupportTicketStatus> = new Map();

const MAX_MESSAGES_PER_CHAT = 200;
const MAX_MESSAGE_LENGTH = 700;

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function addSupportMessage(params: {
  userId: number;
  senderType: SupportSenderType;
  senderLabel: string;
  text: string;
}): SupportChatMessage {
  if (!ticketStatusByUser.has(params.userId)) {
    ticketStatusByUser.set(params.userId, "OPEN");
  }

  const text = normalizeText(params.text);

  if (!text) {
    throw new Error("Сообщение не может быть пустым");
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Сообщение слишком длинное");
  }

  const message: SupportChatMessage = {
    id: randomUUID(),
    userId: params.userId,
    senderType: params.senderType,
    senderLabel: params.senderLabel,
    text,
    createdAt: Date.now(),
  };

  const current = messagesByUser.get(params.userId) ?? [];
  current.push(message);
  if (current.length > MAX_MESSAGES_PER_CHAT) {
    current.splice(0, current.length - MAX_MESSAGES_PER_CHAT);
  }
  messagesByUser.set(params.userId, current);

  return message;
}

export function getSupportHistory(userId: number): SupportChatMessage[] {
  return messagesByUser.get(userId) ?? [];
}

export function getSupportTicketStatus(userId: number): SupportTicketStatus {
  return ticketStatusByUser.get(userId) ?? "OPEN";
}

export function closeSupportTicket(userId: number): SupportTicketStatus {
  ticketStatusByUser.set(userId, "CLOSED");
  return "CLOSED";
}

export function reopenSupportTicket(userId: number): SupportTicketStatus {
  ticketStatusByUser.set(userId, "OPEN");
  messagesByUser.set(userId, []);
  return "OPEN";
}

export function getOpenSupportTickets(): SupportTicketSummary[] {
  const summaries: SupportTicketSummary[] = [];

  for (const [userId, status] of ticketStatusByUser.entries()) {
    if (status !== "OPEN") continue;
    const history = getSupportHistory(userId);
    if (history.length === 0) continue;

    const last = history[history.length - 1];
    summaries.push({
      userId,
      status,
      lastMessage: last.text,
      lastMessageAt: last.createdAt,
    });
  }

  return summaries.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export function getSupportTicketSummary(userId: number): SupportTicketSummary | null {
  const status = getSupportTicketStatus(userId);
  const history = getSupportHistory(userId);
  if (history.length === 0) return null;

  const last = history[history.length - 1];
  return {
    userId,
    status,
    lastMessage: last.text,
    lastMessageAt: last.createdAt,
  };
}

