import { prisma } from "@/src/core/db/prisma";

export async function upsertResearchDocument(params: {
  userId: string;
  title: string;
  content: string;
  source?: string;
}) {
  const doc = await prisma.researchDocument.create({
    data: {
      user_id: params.userId,
      title: params.title,
      content: params.content,
      source: params.source,
    },
  });

  // naive chunking (RAG simplified). Deterministic. No embeddings.
  const chunkSize = 1200;
  const chunks: { document_id: string; idx: number; content: string }[] = [];
  for (let i = 0, idx = 0; i < params.content.length; i += chunkSize, idx++) {
    chunks.push({
      document_id: doc.id,
      idx,
      content: params.content.slice(i, i + chunkSize),
    });
  }

  await prisma.researchChunk.createMany({ data: chunks });
  return doc;
}

export async function searchResearchChunks(params: {
  userId: string;
  query: string;
  limit?: number;
}) {
  const q = params.query.trim();
  if (!q) return [];

  return prisma.researchChunk.findMany({
    where: {
      document: { user_id: params.userId },
      content: { contains: q, mode: "insensitive" },
    },
    include: { document: { select: { id: true, title: true, source: true } } },
    take: params.limit ?? 8,
  });
}
