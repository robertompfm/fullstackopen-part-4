const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const api = supertest(app)

describe('when there are some blogs saved initially', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const userObject = new User(helper.initialUser)

    await userObject.save()
    await Blog.insertMany(helper.initialBlogs)
  })

  describe('blog list tests', () => {
    test('get right amount of blog posts', async () => {
      const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
      
      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })
    
    test('unique identifier id', async () => {
      const response = await api.get('/api/blogs')
      
      const ids = response.body.map(e => e.id)
      assert(ids.every(id => !!id))
    })
    
    test('add a new blog post', async () => {
      const token = helper.getToken()

      await api
      .post('/api/blogs')
      .send(helper.newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)
      
      
      const blogsAdded = await helper.blogsInDb()
      
      assert.strictEqual(blogsAdded.length, helper.initialBlogs.length + 1)
      
      const titles = blogsAdded.map(r => r.title)
      
      assert(titles.includes(helper.newBlog.title))
    })
    
    test('missing like property is set to 0', async () => {
      const token = helper.getToken()

      await api
      .post('/api/blogs')
      .send(helper.newBlog)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)
      
      const blogsAdded = await helper.blogsInDb()
      
      const addedBlog = blogsAdded.find(blog => blog.title === helper.newBlog.title)
      
      assert.strictEqual(addedBlog.likes, 0)
    })
    
    test('missing title or url will return bad request', async () => {
      const token = helper.getToken()

      await api
      .post('/api/blogs')
      .send({
        likes: 2,
        userId: helper.initialUser._id
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /application\/json/)
      
      const blogsAdded = await helper.blogsInDb()
      
      assert.strictEqual(blogsAdded.length, helper.initialBlogs.length)
    })
  })

  describe('blog list expansions', () => {
    test('test delete functionality', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]
      const token = helper.getToken()
      
      await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
      
      const blogsAtEnd = await helper.blogsInDb()
      
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length -1)
      
      const titles = blogsAtEnd.map(b => b.title)
      assert(!titles.includes(blogToDelete.title))
    })
    
    test('test update functionality', async () => {
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

    test('add blog without token should fail', async () => {
      await api
      .post('/api/blogs')
      .send(helper.newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)
      
      
      const blogsAdded = await helper.blogsInDb()
      
      assert.strictEqual(blogsAdded.length, helper.initialBlogs.length)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})