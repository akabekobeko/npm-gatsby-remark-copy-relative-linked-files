import * as React from "react"
import { Link } from "gatsby"
import Layout from "../components/layout"

const IndexPage = () => (
  <Layout>
    <h1>Sample Site</h1>
    <p>Welcome to sample site.</p>
    <ul>
      <li>
        <Link to="/blog/">Blog</Link>
      </li>
    </ul>
  </Layout>
)

export default IndexPage
