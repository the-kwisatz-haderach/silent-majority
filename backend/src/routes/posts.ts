import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

const updatePostSchema = createPostSchema.partial()

export async function postRoutes(server: FastifyInstance) {
  // GET /api/posts
  server.get('/', async (_request, reply) => {
    const posts = await server.prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(posts)
  })

  // GET /api/posts/:id
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const post = await server.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!post) return reply.status(404).send({ error: 'Post not found' })
    return reply.send(post)
  })

  // POST /api/posts
  server.post('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const body = createPostSchema.parse(request.body)

    const post = await server.prisma.post.create({
      data: { ...body, authorId: userId },
      include: { author: { select: { id: true, name: true } } },
    })
    return reply.status(201).send(post)
  })

  // PATCH /api/posts/:id
  server.patch('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    const body = updatePostSchema.parse(request.body)

    const post = await server.prisma.post.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post not found' })
    if (post.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await server.prisma.post.update({
      where: { id },
      data: body,
      include: { author: { select: { id: true, name: true } } },
    })
    return reply.send(updated)
  })

  // DELETE /api/posts/:id
  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    const post = await server.prisma.post.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post not found' })
    if (post.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    await server.prisma.post.delete({ where: { id } })
    return reply.status(204).send()
  })
}
