const Visit = require('unist-util-visit')
const FsExtra = require('fs-extra')
const Path = require('path')
const { Parser } = require('htmlparser2')

/**
 * Checks if the specified URL is an absolute path.
 * @param {string} url URL.
 * @returns {boolean} `true` if the URL is an absolute path.
 * @throws `url` type is not string.
 * @see https://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
 */
const isAbsoluteURL = (url) => {
  if (typeof url !== 'string') {
    throw new Error('`url` type is not string.')
  }

  return /^(?:[a-z]+:)?\/\//i.test(url)
}

/**
 * Check that the file with the specified URL is to be ignored.
 * @param {string} url URL.
 * @param {string[]} extentions File extensions.
 * @returns {boolean} `true` if ignored
 */
const isIgnore = (url, extentions) => {
  return Array.isArray(extentions)
    ? extentions.some((ext) => url.endsWith(ext))
    : false
}

/**
 * Check the collection of file extensions to ignore.
 * @param {string[]} extensions Collection of file extensions to ignore.
 * @returns {string[]} Checked collection.
 */
const checkIgnoreFileExtensions = (extensions) => {
  if (Array.isArray(extensions) && 0 < extensions.length) {
    return extensions
  }

  // Default
  return ['.md']
}

module.exports = (
  { files, linkPrefix, markdownNode, markdownAST, getNode },
  pluginOptions = {}
) => {
  const markdownDirectory = getNode(markdownNode.parent).dir

  // Copy a file, then return its new link URL
  const copyFile = (pathInMarkdown) => {
    const linkPath = Path.join(markdownDirectory, pathInMarkdown)
    const linkNode = files.find((file) => {
      return file && file.absolutePath ? file.absolutePath === linkPath : false
    })

    if (!(linkNode && linkNode.absolutePath)) {
      return pathInMarkdown
    }

    /** Updated path, relative to `src/pages` */
    let updatedPath = linkNode.relativePath

    if (pluginOptions.filename && pluginOptions.filename instanceof Function) {
      updatedPath = Path.join(
        linkNode.relativeDirectory,
        pluginOptions.filename({
          name: linkNode.name,
          hash: linkNode.internal.contentDigest,
          extension: linkNode.extension,
        })
      )
    }

    const publicPath = Path.join(process.cwd(), 'public', updatedPath)

    if (!FsExtra.existsSync(publicPath)) {
      FsExtra.copy(linkPath, publicPath, (err) => {
        if (err) {
          console.error(`error copying file`, err)
        }
      })
    }

    return Path.join(linkPrefix || '/', updatedPath)
  }

  const copyIfRelativeAndNotIgnored = (path) => {
    if (
      isAbsoluteURL(path) ||
      isIgnore(
        path,
        checkIgnoreFileExtensions(pluginOptions.ignoreFileExtensions)
      )
    ) {
      return
    }

    return copyFile(path)
  }

  // Copy linked files to the public directory and modify the AST to point to new location of the files.
  const imageAndLinkVisitor = (node) => {
    const newUrl = copyIfRelativeAndNotIgnored(node.url)
    if (typeof newUrl !== 'undefined') node.url = newUrl
  }

  Visit(markdownAST, `image`, imageAndLinkVisitor)
  Visit(markdownAST, `link`, imageAndLinkVisitor) // Copy additional files requested by a copyfiles manifest.

  // For a, img, video and audio tags in HTML and JSX nodes
  Visit(markdownAST, [`html`, `jsx`], (node) => {
    const parser = new Parser({
      onopentag(name, attribs) {
        let attribValue

        if (/img|video|audio|source/.test(name) && `src` in attribs) {
          attribValue = attribs.src
        } else if (/video/.test(name) && `poster` in attribs) {
          attribValue = attribs.poster
        } else if (/a/.test(name) && `href` in attribs) {
          attribValue = attribs.href
        } else {
          return
        }

        const newAttribValue = copyIfRelativeAndNotIgnored(attribValue)
        if (typeof newAttribValue !== 'undefined') {
          node.value = node.value.replace(
            new RegExp(attribValue, 'g'),
            newAttribValue
          )
        }
      },
    })
    parser.write(node.value)
    parser.end()
  })

  // Copy additional files requested by a copyfiles manifest.
  const manifestIndex = markdownAST.children.findIndex(
    (node) => node.type === 'code' && node.lang === 'copyfiles'
  )
  if (manifestIndex != -1) {
    const filesToCopy = markdownAST.children[manifestIndex].value
      .split('\n')
      .map((s) => s.trim())
    filesToCopy.forEach((filename) => copyFile(filename))
    markdownAST.children = [].concat(
      markdownAST.children.slice(0, manifestIndex),
      markdownAST.children.slice(manifestIndex + 1)
    )
  }
}
