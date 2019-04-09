# gatsby-remark-copy-relative-linked-files

[![Support Node of LTS](https://img.shields.io/badge/node-LTS-brightgreen.svg)](https://nodejs.org/)
[![npm version](https://badge.fury.io/js/gatsby-remark-copy-relative-linked-files.svg)](https://badge.fury.io/js/gatsby-remark-copy-relative-linked-files)
[![Build Status](https://travis-ci.org/akabekobeko/npm-gatsby-remark-copy-relative-linked-files.svg?branch=master)](https://travis-ci.org/akabekobeko/npm-gatsby-remark-copy-relative-linked-files)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Copies local files relative linked to/from markdown to your `public` folder with preserve directory structure.

This will copy the files linked relative to all Markdowns like [gatsby-remark-copy-linked-files](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-remark-copy-linked-files) into a public directory structure like [gatsby-remark-copy-images](https://github.com/mojodna/gatsby-remark-copy-images) as it is.

## Install

```
$ npm install gatsby-remark-copy-relative-linked-files
```

## How to use

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-transformer-remark',
    options: {
      plugins: ['gatsby-remark-copy-relative-linked-files']
    }
  }
]
```

Then in your Markdown files, simply reference the files.

### E.g.

```markdown
---
title: My awesome blog post
---

Hey everyone, I just made a sweet files with lots of interesting stuff in
it.

- ![](image.gif)
- [archive.zip](archive.zip)
- [sample.pdf](sample.pdf)
- [not-copy.rar](https://example.com/not-copy.rar)
```

`image.gif`, `archive.zip` and `sample.pdf` should be in the same directory as the markdown file. When you build your site, the file will be copied to the public folder and the markdown HTML will be modified to point to it.

The copy target is a relative link. Therefore, links starting with `XXXX://` or `//` are ignore. In this example `not-copy.rar` is not copied.

## Options

```js
// In your `gatsby-config.js`
plugins: [
  {
    resolve: 'gatsby-transformer-remark',
    options: {
      plugins: [
        {
          resolve: 'gatsby-remark-copy-relative-linked-files',
          options: {
            // By default, `.md` is specified
            // ignoreFileExtensions: ['.md']

            // These files will not be copied
            ignoreFileExtensions: ['.md', '.pdf', '.d.ts']
          }
        }
      ]
    }
  }
]
```

- **ignoreFileExtensions** `string[]` - Specify the file extension to be ignored from copying. This plugin is for `remark` (Markdown), so it specifies `.md` by default.

# ChangeLog

- [CHANGELOG](CHANGELOG.md)

# License

- [MIT](LICENSE.txt)
