const path = require("path")

module.exports = {
  siteMetadata: {
    title: "akabeko.me",
    blogTitle: "アカベコマイリ",
    subtitle: "HEAR NOTHING SEE NOTHING SAY NOTHING",
    description: "主にプログラミング関連の話題と雑記を書きます。",
    copyright: "Copyright © 2009 - 2021 akabeko.me All Rights Reserved.",
    repositoryName: "akabeko.me",
    repositoryLink: "https://github.com/akabekobeko/akabeko.me",
    siteUrl: "https://akabeko.me",
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "src",
        path: path.join(__dirname, "src"),
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: ["gatsby-remark-copy-relative-linked-files"],
      },
    },
  ],
}
