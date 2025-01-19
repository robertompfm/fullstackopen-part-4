const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const api = supertest(app)

describe('when there are some blogs saved initially', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  describe('blog list tests', () => {
    test('step 1 - get right amount of blog posts', async () => {
      const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
      
      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })
    
    test('step 2 - unique identifier id', async () => {
      const response = await api.get('/api/blogs')
      
      const ids = response.body.map(e => e.id)
      assert(ids.every(id => !!id))
    })
    
    test('step 3 - add a new blog post', async () => {
      await api
      .post('/api/blogs')
      .send(helper.newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
      
      
      const blogsAdded = await helper.blogsInDb()
      
      assert.strictEqual(blogsAdded.length, helper.initialBlogs.length + 1)
      
      const titles = blogsAdded.map(r => r.title)
      
      assert(titles.includes(helper.newBlog.title))
    })
    
    test('step 4 - missing like property is set to 0', async () => {
      await api
      .post('/api/blogs')
      .send(helper.newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
      
      const blogsAdded = await helper.blogsInDb()
      
      const addedBlog = blogsAdded.find(blog => blog.title === helper.newBlog.title)
      
      assert.strictEqual(addedBlog.likes, 0)
    })
    
    test('step 5 - missing title or url will return bad request', async () => {
      await api
      .post('/api/blogs')
      .send({
        likes: 2
      })
      .expect(400)
      .expect('Content-Type', /application\/json/)
      
      const blogsAdded = await helper.blogsInDb()
      
      assert.strictEqual(blogsAdded.length, helper.initialBlogs.length)
    })
  })

  describe('blog list expansions', () => {
    test('step 1 - test delete functionality', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]
      
      await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
      
      const blogsAtEnd = await helper.blogsInDb()
      
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length -1)
      
      const titles = blogsAtEnd.map(b => b.title)
      assert(!titles.includes(blogToDelete.title))
    })
    
    test('step 2 - test update functionality', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]
      
      await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({
        author: blogToUpdate.author,
        title: blogToUpdate.title,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes + 1
      })
      .expect(204)
      
      const blogsAtEnd = await helper.blogsInDb()
      
      const updatedBlog = blogsAtEnd.find(blog => blog.id === blogToUpdate.id)
      
      assert.strictEqual(updatedBlog.likes, blogToUpdate.likes + 1)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})