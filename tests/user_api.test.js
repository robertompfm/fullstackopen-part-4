const bcrypt = require('bcrypt')
const User = require('../models/user')
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('invalid username or password', () => {
  test('creation fails with empty username', async () => {
    const newUser = {
      username: '',
      name: 'My Name',
      password: 'password',
    }
    
    const response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)
    
    assert.strictEqual(JSON.parse(response.text).error, "username missing")
  })

  test('creation fails with invalid username', async () => {
    const newUser = {
      username: 'r',
      name: 'My Name',
      password: 'password',
    }
    
    const response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)
    
    assert.strictEqual(JSON.parse(response.text).error, "username invalid")
  })

  test('creation fails with empty password', async () => {
    const newUser = {
      username: 'rob',
      name: 'My Name',
      password: '',
    }
    
    const response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)
    
    assert.strictEqual(JSON.parse(response.text).error, "password missing")
  })

  test('creation fails with invalid password', async () => {
    const newUser = {
      username: 'rob',
      name: 'My Name',
      password: 'p',
    }
    
    const response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)
    
    assert.strictEqual(JSON.parse(response.text).error, "password invalid")
  })
})

after(async () => {
  await mongoose.connection.close()
})