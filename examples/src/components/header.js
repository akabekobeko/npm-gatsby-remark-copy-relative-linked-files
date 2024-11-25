import React from "react"
import { Link } from "gatsby-link"

const Header = ({ siteTitle, siteSubTitle }) => (
  <header className="header">
    <h1 className="title">
      <Link to="/">{siteTitle}</Link>
    </h1>
    <h2 className="subtitle">{siteSubTitle}</h2>
  </header>
)

export default Header
