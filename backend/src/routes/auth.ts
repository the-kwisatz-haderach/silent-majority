import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(server: FastifyInstance) {
  server.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existing = await server.prisma.user.findUnique({
      where: { email: body.email },
    })
    if (existing) {
      return reply.status(409).send({ error: 'Email already in use' })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)
    const user = await server.prisma.user.create({
      data: { email: body.email, name: body.name, password: hashedPassword },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    const token = server.jwt.sign({ userId: user.id })
    return reply.status(201).send({ token, user })
  })

  server.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await server.prisma.user.findUnique({
      where: { email: body.email },
    })
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = server.jwt.sign({ userId: user.id })
    return reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    })
  })

  server.get('/me', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const user = await server.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send(user)
  })
}
