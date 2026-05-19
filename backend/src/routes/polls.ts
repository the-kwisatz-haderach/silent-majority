import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'

const createPollSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
})

const voteSchema = z.object({
  optionId: z.string(),
})

export async function pollRoutes(server: FastifyInstance) {
  // GET /api/polls
  server.get('/', async (_request, reply) => {
    const polls = await server.prisma.poll.findMany({
      include: {
        author: { select: { id: true, name: true } },
        options: { include: { _count: { select: { votes: true } } } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(polls)
  })

  // GET /api/polls/:id
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const poll = await server.prisma.poll.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        options: { include: { _count: { select: { votes: true } } } },
        votes: { select: { userId: true, pollOptionId: true } },
      },
    })
    if (!poll) return reply.status(404).send({ error: 'Poll not found' })
    return reply.send(poll)
  })

  // POST /api/polls
  server.post('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const body = createPollSchema.parse(request.body)

    const poll = await server.prisma.poll.create({
      data: {
        question: body.question,
        authorId: userId,
        options: { create: body.options.map((text) => ({ text })) },
      },
      include: {
        author: { select: { id: true, name: true } },
        options: { include: { _count: { select: { votes: true } } } },
      },
    })
    return reply.status(201).send(poll)
  })

  // POST /api/polls/:id/vote
  server.post('/:id/vote', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    const { optionId } = voteSchema.parse(request.body)

    const option = await server.prisma.pollOption.findUnique({ where: { id: optionId } })
    if (!option || option.pollId !== id) {
      return reply.status(400).send({ error: 'Invalid option for this poll' })
    }

    // upsert allows changing a vote
    const vote = await server.prisma.vote.upsert({
      where: { userId_pollId: { userId, pollId: id } },
      update: { pollOptionId: optionId },
      create: { userId, pollId: id, pollOptionId: optionId },
    })
    return reply.send(vote)
  })

  // DELETE /api/polls/:id
  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    const poll = await server.prisma.poll.findUnique({ where: { id } })
    if (!poll) return reply.status(404).send({ error: 'Poll not found' })
    if (poll.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    await server.prisma.poll.delete({ where: { id } })
    return reply.status(204).send()
  })
}
