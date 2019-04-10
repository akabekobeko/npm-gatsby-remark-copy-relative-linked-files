const Visit = require('unist-util-visit')
const FsExtra = require('fs-extra')
const Path = require('path')

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
  // Copy linked files to the public directory and modify the AST to point to new location of the files.
  const visitor = (link) => {
    if (
      isAbsoluteURL(link.url) ||
      isIgnore(
        link.url,
        checkIgnoreFileExtensions(pluginOptions.ignoreFileExtensions)
      )
    ) {
      return
    }

    const linkPath = Path.join(getNode(markdownNode.parent).dir, link.url)
    const linkNode = files.find((file) => {
      return file && file.absolutePath ? file.absolutePath === linkPath : false
    })

    if (!(linkNode && linkNode.absolutePath)) {
      return
    }

    const newPath = Path.join(
      process.cwd(),
      'public',
      `${linkNode.relativePath}`
    )

    link.url = Path.join(linkPrefix || '/', linkNode.relativePath)
    if (FsExtra.existsSync(newPath)) {
      return
    }

    FsExtra.copy(linkPath, newPath, (err) => {
      if (err) {
        console.error(`error copying file`, err)
      }
    })
  }

  Visit(markdownAST, `image`, (image) => visitor(image))
  Visit(markdownAST, `link`, (link) => visitor(link))
}
