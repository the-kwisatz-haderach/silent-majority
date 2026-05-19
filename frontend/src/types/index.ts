export interface User {
  id: string
  email: string
  name: string
  createdAt?: string
}

export interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  author: Pick<User, 'id' | 'name'>
  _count?: { comments: number }
  comments?: Comment[]
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  postId: string
  author: Pick<User, 'id' | 'name'>
}

export interface PollOption {
  id: string
  text: string
  pollId: string
  _count: { votes: number }
}

export interface Poll {
  id: string
  question: string
  createdAt: string
  author: Pick<User, 'id' | 'name'>
  options: PollOption[]
  votes?: { userId: string; pollOptionId: string }[]
  _count?: { votes: number }
}

export interface AuthResponse {
  token: string
  user: User
}
