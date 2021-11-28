import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { graphql } from "gatsby"
import Header from "../components/header.js"

const Template = ({ data, pageContext }) => {
  // Work around the problem that markdownRemark is `null` in HRM.
  if (!data.markdownRemark) {
    return <div />
  }

  const meta = data.markdownRemark.frontmatter
  return (
    <div className="page">
      <div className="container">
        <Helmet title={`${meta.title} - ${data.site.siteMetadata.blogTitle}`} />
        <Header
          siteTitle={data.site.siteMetadata.blogTitle}
          siteSubTitle={data.site.siteMetadata.subtitle}
        />
        <div className="content">
          <article>
            <h1>{meta.title}</h1>
            <div
              dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }}
            />
          </article>
        </div>
      </div>
    </div>
  )
}

Template.propTypes = {
  data: PropTypes.object,
  pageContext: PropTypes.object,
}

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    site {
      siteMetadata {
        blogTitle
        subtitle
        copyright
        repositoryName
        repositoryLink
      }
    }
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        path
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`

export default Template
