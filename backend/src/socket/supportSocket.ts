import type { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import {
  addSupportMessage,
  closeSupportTicket,
  getOpenSupportTickets,
  getSupportHistory,
  getSupportTicketSummary,
  getSupportTicketStatus,
  reopenSupportTicket,
} from "./supportService";
import type {
  SupportAgentJoinPayload,
  SupportClosePayload,
  SupportJoinAck,
  SupportSendAck,
  SupportSendPayload,
} from "./supportTypes";

type SupportSocketData = {
  role?: "USER" | "AGENT" | "ADMIN";
  userId?: number;
  targetUserId?: number;
};

function getRoomName(userId: number): string {
  return `support:user:${userId}`;
}

function getStaffRoomName(): string {
  return "support:staff";
}

function parseBearerToken(value: string | undefined): string | null {
  if (!value) return null;
  const [scheme, token] = value.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function extractUserToken(socket: Socket): string | null {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth.length > 0) return fromAuth;

  const fromHeader = socket.handshake.headers.authorization;
  if (typeof fromHeader === "string") return parseBearerToken(fromHeader);

  return null;
}

export function registerSupportHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const socketData = socket.data as SupportSocketData;

    const userToken = extractUserToken(socket);
    if (userToken) {
      try {
        const payload = verifyToken(userToken);
        socketData.role = payload.role;
        socketData.userId = payload.userId;
      } catch {
        // noop
      }
    }

    if (!socketData.role) {
      socket.disconnect(true);
      return;
    }

    socket.on("support:join", (callback: (ack: SupportJoinAck) => void) => {
      try {
        if (socketData.role === "USER" && socketData.userId) {
          const room = getRoomName(socketData.userId);
          socket.join(room);

          const history = getSupportHistory(socketData.userId);
          callback({
            ok: true,
            userId: socketData.userId,
            history,
            ticketStatus: getSupportTicketStatus(socketData.userId),
          });

          if (history.length === 0) {
            const welcome = addSupportMessage({
              userId: socketData.userId,
              senderType: "system",
              senderLabel: "Support Bot",
              text: "Здравствуйте! Опишите вашу проблему, и оператор скоро подключится.",
            });
            io.to(room).emit("support:message:new", welcome);
          }
          return;
        }

        callback({ ok: false, error: "Только пользователь может выполнять support:join" });
      } catch (e) {
        callback({
          ok: false,
          error: e instanceof Error ? e.message : "Ошибка подключения к чату поддержки",
        });
      }
    });

    socket.on(
      "support:staff:subscribe",
      (callback: (ack: { ok: true; tickets: Array<{ userId: number; status: string; lastMessage: string; lastMessageAt: number }> }) => void) => {
        if (socketData.role !== "AGENT" && socketData.role !== "ADMIN") {
          return;
        }
        socket.join(getStaffRoomName());
        callback({ ok: true, tickets: getOpenSupportTickets() });
      },
    );

    socket.on(
      "support:ticket:create",
      (callback: (ack: SupportJoinAck) => void) => {
        try {
          if (socketData.role !== "USER" || !socketData.userId) {
            callback({ ok: false, error: "Только пользователь может создать обращение" });
            return;
          }

          const userId = socketData.userId;
          const room = getRoomName(userId);
          socket.join(room);

          reopenSupportTicket(userId);

          const welcome = addSupportMessage({
            userId,
            senderType: "system",
            senderLabel: "Support Bot",
            text: "Новое обращение создано. Опишите вашу проблему.",
          });

          io.to(room).emit("support:ticket:status", { status: "OPEN" });
          io.to(room).emit("support:message:new", welcome);

          const summary = getSupportTicketSummary(userId);
          if (summary) {
            io.to(getStaffRoomName()).emit("support:ticket:upsert", summary);
          }

          callback({
            ok: true,
            userId,
            history: getSupportHistory(userId),
            ticketStatus: "OPEN",
          });
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : "Ошибка создания обращения",
          });
        }
      },
    );

    socket.on(
      "support:agent:join",
      (payload: SupportAgentJoinPayload, callback: (ack: SupportJoinAck) => void) => {
        try {
          if (socketData.role !== "AGENT" && socketData.role !== "ADMIN") {
            callback({ ok: false, error: "Недостаточно прав" });
            return;
          }

          const userId = Number(payload?.userId);
          if (!Number.isInteger(userId) || userId <= 0) {
            callback({ ok: false, error: "Некорректный userId" });
            return;
          }

          socketData.targetUserId = userId;
          socket.join(getRoomName(userId));

          callback({
            ok: true,
            userId,
            history: getSupportHistory(userId),
            ticketStatus: getSupportTicketStatus(userId),
          });
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : "Ошибка подключения агента",
          });
        }
      },
    );

    socket.on(
      "support:message:send",
      (payload: SupportSendPayload, callback: (ack: SupportSendAck) => void) => {
        try {
          const text = payload?.text?.toString?.() ?? "";
          const targetUserId =
            socketData.role === "USER" ? socketData.userId : socketData.targetUserId;

          if (!targetUserId) {
            callback({ ok: false, error: "Сначала подключитесь к чату" });
            return;
          }
          const currentStatus = getSupportTicketStatus(targetUserId);
          if (currentStatus === "CLOSED") {
            if (socketData.role !== "USER") {
              callback({ ok: false, error: "Обращение закрыто" });
              return;
            }
            reopenSupportTicket(targetUserId);
            io.to(getRoomName(targetUserId)).emit("support:ticket:status", { status: "OPEN" });
          }

          const message = addSupportMessage({
            userId: targetUserId,
            senderType: socketData.role === "USER" ? "user" : "agent",
            senderLabel: socketData.role === "USER" ? "User" : "Support Agent",
            text,
          });

          io.to(getRoomName(targetUserId)).emit("support:message:new", message);

          if (socketData.role === "USER") {
            const summary = getSupportTicketSummary(targetUserId);
            if (summary) {
              io.to(getStaffRoomName()).emit("support:ticket:upsert", summary);
            }
          }
          callback({ ok: true });
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : "Ошибка отправки сообщения",
          });
        }
      },
    );

    socket.on(
      "support:ticket:close",
      (payload: SupportClosePayload, callback: (ack: SupportSendAck) => void) => {
        try {
          if (socketData.role === "USER") {
            callback({ ok: false, error: "Пользователь не может закрыть обращение" });
            return;
          }
          if (socketData.role !== "AGENT" && socketData.role !== "ADMIN") {
            callback({ ok: false, error: "Недостаточно прав" });
            return;
          }

          const targetUserId = Number(payload?.userId ?? socketData.targetUserId);
          if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
            callback({ ok: false, error: "Некорректный userId обращения" });
            return;
          }

          closeSupportTicket(targetUserId);

          const systemMessage = addSupportMessage({
            userId: targetUserId,
            senderType: "system",
            senderLabel: "System",
            text: "Обращение закрыто агентом поддержки",
          });

          io.to(getRoomName(targetUserId)).emit("support:message:new", systemMessage);
          io.to(getRoomName(targetUserId)).emit("support:ticket:status", { status: "CLOSED" });
          io.to(getStaffRoomName()).emit("support:ticket:closed", { userId: targetUserId });
          callback({ ok: true });
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : "Ошибка закрытия обращения",
          });
        }
      },
    );
  });
}

