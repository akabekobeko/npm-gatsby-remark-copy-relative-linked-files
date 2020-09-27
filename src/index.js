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

  // Copy a file, then return its new link URL
  const copyFile = (relativePath) => {
    const linkPath = Path.join(getNode(markdownNode.parent).dir, relativePath)
    const linkNode = files.find((file) => {
      return file && file.absolutePath ? file.absolutePath === linkPath : false
    })

    if (!(linkNode && linkNode.absolutePath)) {
      return relativePath
    }

    const newPath = Path.join(
      process.cwd(),
      'public',
      `${linkNode.relativePath}`
    )

    const newLinkUrl = Path.join(linkPrefix || '/', linkNode.relativePath)
    if (!FsExtra.existsSync(newPath)) {
      FsExtra.copy(linkPath, newPath, (err) => {
        if (err) {
          console.error(`error copying file`, err)
        }
      })
    }

    return newLinkUrl
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

  // For video and audio in HTML or JSX nodes
  Visit(markdownAST, [`html`, `jsx`], (node) => {
    const parser = new Parser({
      onopentag(name, attribs) {
        if (/video|audio|source/.test(name) && `src` in attribs) {
          const newSrc = copyIfRelativeAndNotIgnored(attribs.src)
          if (typeof newSrc !== 'undefined')
            node.value.replace(new RegExp(attribs.src, 'g'), newSrc)
        }
      },
    })
    parser.write(node.value)
    parser.end()
  })

  // Copy additional files requested by a copyfiles manifest.
  const manifestIndex = markdownAST.children.findIndex(
    node => node.type === "code" && node.lang === "copyfiles"
  );
  if (manifestIndex != -1) {
    const filesToCopy = markdownAST.children[manifestIndex].value.split('\n').map(s => s.trim());
    filesToCopy.forEach(filename => copyFile(filename))
    markdownAST.children = [].concat(
      markdownAST.children.slice(0, manifestIndex),
      markdownAST.children.slice(manifestIndex + 1))
  }
}
