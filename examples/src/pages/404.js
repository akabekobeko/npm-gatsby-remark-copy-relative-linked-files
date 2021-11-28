import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import Header from "../components/header.js"

const NotFoundPage = ({ data }) => (
  <div className="page">
    <div className="container">
      <Header
        siteTitle={data.site.siteMetadata.title}
        siteSubTitle={data.site.siteMetadata.subtitle}
      />
      <div className="content">
        <h1>NOT FOUND</h1>
        <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
      </div>
    </div>
  </div>
)

NotFoundPage.propTypes = {
  data: PropTypes.object,
}

export default NotFoundPage

export const query = graphql`
  query NotFoundPageQuery {
    site {
      siteMetadata {
        title
        subtitle
      }
    }
  }
`
