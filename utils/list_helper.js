const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (fav, blog) => {
    return fav.likes >= blog.likes ? fav : blog
  }

  const mapper = (blog) => {
    return {
      title: blog.title,
      author: blog.author,
      likes: blog.likes
    }
  }

  const favorite = blogs.map(mapper).reduce(reducer, {})

  return favorite
}

const mostBlogs = (blogsArr) => {
  if (blogsArr.length === 0) {
    return {}
  }

  const authors = _.map(blogsArr, 'author')
  const [author, blogs] = _.chain(authors).countBy().entries().maxBy(_.last).value()
  const mostCommon = {
    author, 
    blogs
  }

  return mostCommon
}

const mostLikes = (blogsArr) => {
  if (blogsArr.length === 0) {
    return {}
  }

  const reducer = (sum, blog) =>  sum + blog.likes

  const mapper = ([author, blogs]) => {
    return {
      author,
      likes: blogs.reduce(reducer, 0)
    }
  }
  
  const authors = _
    .chain(blogsArr)
    .groupBy('author')
    .entries()
    .map(mapper)
    .maxBy('likes')
    .value()

  return authors
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
