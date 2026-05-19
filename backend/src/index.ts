import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { prismaPlugin } from './plugins/db'
import { authRoutes } from './routes/auth'
import { postRoutes } from './routes/posts'
import { commentRoutes } from './routes/comments'
import { pollRoutes } from './routes/polls'

const server = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
})

async function main() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await server.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  })

  await server.register(cookie)
  await server.register(prismaPlugin)

  // Error handler for Zod validation errors
  server.setErrorHandler((error, _request, reply) => {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Validation error', details: error.message })
    }
    server.log.error(error)
    reply.status(error.statusCode ?? 500).send({ error: error.message })
  })

  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(postRoutes, { prefix: '/api/posts' })
  await server.register(commentRoutes, { prefix: '/api/comments' })
  await server.register(pollRoutes, { prefix: '/api/polls' })

  server.get('/health', async () => ({ status: 'ok' }))

  const port = Number(process.env.PORT ?? 4000)
  await server.listen({ port, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
