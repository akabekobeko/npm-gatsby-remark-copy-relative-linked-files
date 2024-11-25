const path = require("path")
const { createFilePath } = require("gatsby-source-filesystem")

const createBlogPages = (createPage, posts) => {
  const template = path.resolve(`src/templates/post.js`)
  const pages = posts.filter(({ node }) => !node.frontmatter.single)

  pages.forEach(({ node }, index) => {
    createPage({
      path: node.frontmatter.path,
      component: template,
      context: {
        slug: node.fields.slug,
        next: index === 0 ? null : pages[index - 1].node,
        prev: index === pages.length - 1 ? null : pages[index + 1].node,
      },
    })
  })
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  return graphql(`
    {
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
        edges {
          node {
            html
            id
            fields {
              slug
            }
            frontmatter {
              path
              title
              date
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    createBlogPages(createPage, result.data.allMarkdownRemark.edges)
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    const { createNodeField } = actions
    createNodeField({ name: `slug`, node, value })
  }
}
