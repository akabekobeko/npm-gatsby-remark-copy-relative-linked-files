import React from "react"
import PropTypes from "prop-types"
import Link from "gatsby-link"

const Header = ({ siteTitle, siteSubTitle }) => (
  <header className="header">
    <h1 className="title">
      <Link to="/">{siteTitle}</Link>
    </h1>
    <h2 className="subtitle">{siteSubTitle}</h2>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
  siteSubTitle: PropTypes.string,
}

export default Header
