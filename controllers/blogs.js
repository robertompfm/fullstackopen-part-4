const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1})

  response.json(blogs)
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const user = request.user
  const body = request.body

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id
  })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)

  if (!blog) {
    return response.status(400).json({ error: 'bad request' })
  }

  const userId = user._id.toString()

  if (blog.user.toString() !== userId) {
    return response.status(401).json({ error: 'unauthorized user' })
  }

  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const { title, author, likes, url } = request.body
  await Blog.findByIdAndUpdate(
    request.params.id,
    { title, author, likes, url },
    { new: true, runValidators: true, context: 'query' }
  )
  response.status(204).end()
})

module.exports = blogsRouter
