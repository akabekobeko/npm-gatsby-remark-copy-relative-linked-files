# gatsby-remark-copy-relative-linked-files

[![Support Node of LTS](https://img.shields.io/badge/node-LTS-brightgreen.svg)](https://nodejs.org/)
[![npm version](https://badge.fury.io/js/gatsby-remark-copy-relative-linked-files.svg)](https://badge.fury.io/js/gatsby-remark-copy-relative-linked-files)
[![Actions Status: test](https://github.com/akabekobeko/npm-gatsby-remark-copy-relative-linked-files/workflows/test/badge.svg)](https://github.com/akabekobeko/npm-gatsby-remark-copy-relative-linked-files/actions?query=CI)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Copies local files relative linked to/from markdown to your `public` folder, preserving your directory structure.

This will copy the files linked relative to all Markdown files like [gatsby-remark-copy-linked-files](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-remark-copy-linked-files) into a public directory structure like [gatsby-remark-copy-images](https://github.com/mojodna/gatsby-remark-copy-images) as it is. It can also copy additional files requested by the document.

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
      plugins: ['gatsby-remark-copy-relative-linked-files'],
    },
  },
]
```

_Note:_ When using the `copyfiles` code fence (see below), `gatsby-remark-copy-relative-linked-files` must appear before general purpose code fence processors like `gatsby-remark-prismjs`.

Then in your Markdown files, simply reference the files.

### E.g.

````markdown
---
title: My awesome blog post
---

Hey everyone, here are some sweet files with lots of interesting stuff in them:

- ![](image.gif)
- [archive.zip](archive.zip)
- [sample.pdf](sample.pdf)
- [report.html](report.html)
- [not-copy.rar](https://example.com/not-copy.rar)

```copyfiles
report.css
diagram.png
```

<img src="sales-growth.png" alt="Diagram of the sales growth" />

<audio src="sample.mp3" controls></audio>
<video src="sample.mp4" poster="thumbnail.jpg" controls></video>

<video controls>
  <source src="sample2.mp4" type="video/mp4">
</video>

<a href="sample.svg">SVG Image</a>
````

`image.gif`, `archive.zip`, `sample.pdf` and `report.html` should be in the same directory as the Markdown file. When you build your site, the files will be copied to the public folder and the markdown HTML will be modified to point to it.

Similarly, `report.css` and `diagram.png` should be in the same directory as the Markdown file. In this example, `report.html` has its own internal relative links to these files. `report.html` is not changed in any way. The relative links to the copied files work from the copied location.

The copy target is a relative link. Therefore, links starting with `XXXX://` or `//` are ignored. In this example `not-copy.rar` is not copied.

**v1.3.0**

[Pull request](https://github.com/akabekobeko/npm-gatsby-remark-copy-relative-linked-files/pull/8) by [karlhorky](https://github.com/karlhorky) also copied the `href` attribute of `<a>` tag, and `poster` attribute of `<video>` tag.

**v1.1.0**

[Pull request](https://github.com/akabekobeko/npm-gatsby-remark-copy-relative-linked-files/pull/8) by [karlhorky](https://github.com/karlhorky) also copied the `src` attribute of `<audio>`/`<video>`/`<source>` tag.

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
            //
            // These files will not be copied
            ignoreFileExtensions: ['.md', '.pdf', '.d.ts'],

            // Would generate file-1abcb33beeb811dca15f0ac3e47b88d9.pdf
            filename: ({ hash, name, extension }) =>
              `${name}-${hash}.${extension}`,
          },
        },
      ],
    },
  },
]
```

- **ignoreFileExtensions** `string[]` - Specify the file extension to be ignored from copying. This plugin is for `remark` (Markdown), so it specifies `.md` by default.
- **filename** `(hash: string, name: string, extension: string) => string` - Can control the file name as you like. See [#15](https://github.com/akabekobeko/npm-gatsby-remark-copy-relative-linked-files/issues/15) for details.

# ChangeLog

- [CHANGELOG](CHANGELOG.md)

# License

- [MIT](LICENSE.txt)
