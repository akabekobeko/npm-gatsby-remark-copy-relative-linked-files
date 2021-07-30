import visit from 'unist-util-visit'
import fsExtra from 'fs-extra'
import path from 'path'
import { Parser } from 'htmlparser2'

/** Parameters of the callback function `filename`. */
export type FilenameParams = {
  /** Hash. */
  hash: string
  /** Name of the file, without extension. */
  name: string
  /** Extension of the file. */
  extension: string
}

/** Options of plugin. */
export type PluginOptions = {
  /** Collection of file extensions to ignore. */
  ignoreFileExtensions?: string[]
  /** Callback function for processing the file name independently. */
  filename?: (params: FilenameParams) => string
}

/** Options of GatsbyJS remark. */
export type GatsbyRemarkOptions = {
  files: any[]
  linkPrefix: string
  markdownNode: any
  markdownAST: any
  getNode: any
}

/**
 * Checks if the specified URL is an absolute path.
 * @param url URL.
 * @returns `true` if the URL is an absolute path.
 * @see https://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
 */
export const isAbsoluteURL = (url: string): boolean => {
  return /^(?:[a-z]+:)?\/\//i.test(url)
}

/**
 * Check that the file with the specified URL is to be ignored.
 * @param url URL.
 * @param extensions File extensions.
 * @returns `true` if ignored.
 */
export const isIgnore = (url: string, extensions: string[]): boolean => {
  return extensions.some((ext) => url.endsWith(ext))
}

/**
 * Check the collection of file extensions to ignore.
 * @param extensions Collection of file extensions to ignore.
 * @returns Checked collection.
 */
const checkIgnoreFileExtensions = (extensions: string[]): string[] => {
  if (0 < extensions.length) {
    return extensions
  }

  // Default
  return ['.md']
}

export const plugin = (
  {
    files,
    linkPrefix,
    markdownNode,
    markdownAST,
    getNode,
  }: GatsbyRemarkOptions,
  { ignoreFileExtensions = ['.md'], filename = undefined }: PluginOptions
) => {
  const markdownDirectory = getNode(markdownNode.parent).dir

  // Copy a file, then return its new link URL
  const copyFile = (pathInMarkdown: string) => {
    const linkPath = path.join(markdownDirectory, pathInMarkdown)
    const linkNode = files.find((file: any) => {
      return file && file.absolutePath ? file.absolutePath === linkPath : false
    })

    if (!(linkNode && linkNode.absolutePath)) {
      return pathInMarkdown
    }

    /** Updated path, relative to `src/pages` */
    let updatedPath = linkNode.relativePath

    if (filename) {
      updatedPath = path.join(
        linkNode.relativeDirectory,
        filename({
          name: linkNode.name,
          hash: linkNode.internal.contentDigest,
          extension: linkNode.extension,
        })
      )
    }

    const publicPath = path.join(process.cwd(), 'public', updatedPath)

    if (!fsExtra.existsSync(publicPath)) {
      fsExtra.copy(linkPath, publicPath, (err) => {
        if (err) {
          console.error(`error copying file`, err)
        }
      })
    }

    return path.join(linkPrefix || '/', updatedPath)
  }

  const copyIfRelativeAndNotIgnored = (path: string) => {
    if (
      isAbsoluteURL(path) ||
      isIgnore(path, checkIgnoreFileExtensions(ignoreFileExtensions))
    ) {
      return
    }

    return copyFile(path)
  }

  // Copy linked files to the public directory and modify the AST to point to new location of the files.
  const imageAndLinkVisitor = (node: any) => {
    const newUrl = copyIfRelativeAndNotIgnored(node.url)
    if (typeof newUrl !== 'undefined') node.url = newUrl
  }

  visit(markdownAST, `image`, imageAndLinkVisitor)
  visit(markdownAST, `link`, imageAndLinkVisitor) // Copy additional files requested by a copyfiles manifest.

  // For a, img, video and audio tags in HTML and JSX nodes
  visit(markdownAST, [`html`, `jsx`], (node: any) => {
    const parser = new Parser({
      onopentag: (name, attribs) => {
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
    (node: any) => node.type === 'code' && node.lang === 'copyfiles'
  )
  if (manifestIndex != -1) {
    const filesToCopy = markdownAST.children[manifestIndex].value
      .split('\n')
      .map((s: string) => s.trim())
    filesToCopy.forEach((filename: any) => copyFile(filename))
    markdownAST.children = [].concat(
      markdownAST.children.slice(0, manifestIndex),
      markdownAST.children.slice(manifestIndex + 1)
    )
  }
}
