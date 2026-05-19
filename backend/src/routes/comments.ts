import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  postId: z.string(),
})

export async function commentRoutes(server: FastifyInstance) {
  // POST /api/comments
  server.post('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const body = createCommentSchema.parse(request.body)

    const post = await server.prisma.post.findUnique({ where: { id: body.postId } })
    if (!post) return reply.status(404).send({ error: 'Post not found' })

    const comment = await server.prisma.comment.create({
      data: { content: body.content, postId: body.postId, authorId: userId },
      include: { author: { select: { id: true, name: true } } },
    })
    return reply.status(201).send(comment)
  })

  // DELETE /api/comments/:id
  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    const comment = await server.prisma.comment.findUnique({ where: { id } })
    if (!comment) return reply.status(404).send({ error: 'Comment not found' })
    if (comment.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    await server.prisma.comment.delete({ where: { id } })
    return reply.status(204).send()
  })
}
