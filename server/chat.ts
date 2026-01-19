import { db } from "./db";
import { supportChats, supportMessages, users } from "@shared/schema";
import { eq, and, or, desc, asc, ne } from "drizzle-orm";

export async function createChat(userId: string, priority: string = "normal") {
  const [chat] = await db.insert(supportChats)
    .values({
      userId,
      priority,
      status: "open",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
      lastMessageAt: Math.floor(Date.now() / 1000),
    })
    .returning();
  return chat;
}

export async function getOpenChats() {
  return db.select({
    chat: supportChats,
    user: {
      id: users.id,
      username: users.username,
      email: users.email
    }
  })
  .from(supportChats)
  .leftJoin(users, eq(supportChats.userId, users.id))
  .where(ne(supportChats.status, "archived"))
  .orderBy(desc(supportChats.lastMessageAt));
}

export async function getUserChats(userId: string) {
  return db.select()
    .from(supportChats)
    .where(eq(supportChats.userId, userId))
    .orderBy(desc(supportChats.updatedAt));
}

export async function getChatMessages(chatId: number) {
  return db.select()
    .from(supportMessages)
    .where(eq(supportMessages.chatId, chatId))
    .orderBy(asc(supportMessages.createdAt));
}

export async function addMessage(
  chatId: number,
  senderId: string,
  senderRole: string,
  content: string,
  type: string = "text",
  metadata: any = {}
) {
  const [message] = await db.insert(supportMessages)
    .values({
      chatId,
      senderId,
      senderRole,
      content,
      type,
      mediaUrl: metadata.mediaUrl,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      isOneTimeView: type === "one_time_image" || type === "one_time_text",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning();

  // Update chat timestamp
  await db.update(supportChats)
    .set({
      lastMessageAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(supportChats.id, chatId));

  return message;
}

export async function markMessageRead(messageId: number) {
  return db.update(supportMessages)
    .set({
      isRead: true,
      readAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(supportMessages.id, messageId))
    .returning();
}

export async function markOTVViewed(messageId: number) {
  // First check if it's already viewed
  const [msg] = await db.select().from(supportMessages).where(eq(supportMessages.id, messageId));
  if (!msg || msg.isViewed) return null;

  const [updated] = await db.update(supportMessages)
    .set({
      isViewed: true,
      viewedAt: Math.floor(Date.now() / 1000),
      content: "[Viewed]", // Clear content for security
      mediaUrl: null,      // Clear media
    })
    .where(eq(supportMessages.id, messageId))
    .returning();
    
  return updated;
}

export async function assignAgent(chatId: number, agentId: string) {
  return db.update(supportChats)
    .set({ agentId })
    .where(eq(supportChats.id, chatId))
    .returning();
}

export async function updateChatStatus(chatId: number, status: string) {
  return db.update(supportChats)
    .set({ status })
    .where(eq(supportChats.id, chatId))
    .returning();
}
