import prisma from "../db";

export type CreatePostInput = {
  title: string;
  content?: string | null;
};

export type UpdatePostInput = {
  title?: string;
  content?: string | null;
};

export async function listPosts(userId: number) {
  // Access control: only authenticated users can interact with posts
  void userId;
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, username: true, email: true } } },
  });
}

export async function getPostById(userId: number, id: number) {
  void userId;
  return prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, username: true, email: true } } },
  });
}

export async function createPost(userId: number, input: CreatePostInput) {
  return prisma.post.create({
    data: { title: input.title, content: input.content ?? null, authorId: userId },
    include: { author: { select: { id: true, username: true, email: true } } },
  });
}

export async function updatePost(userId: number, id: number, input: UpdatePostInput) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (existing.authorId !== userId) return { error: "FORBIDDEN" as const };

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content ?? null } : {}),
    },
    include: { author: { select: { id: true, username: true, email: true } } },
  });
  return { post };
}

export async function deletePost(userId: number, id: number) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (existing.authorId !== userId) return { error: "FORBIDDEN" as const };

  await prisma.post.delete({ where: { id } });
  return { ok: true as const };
}

