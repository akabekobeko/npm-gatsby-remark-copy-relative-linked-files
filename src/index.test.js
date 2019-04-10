jest.mock(`fs-extra`, () => {
  return {
    existsSync: () => false,
    copy: jest.fn(),
    ensureDir: jest.fn()
  }
})

const Path = require('path')
const FsExtra = require('fs-extra')
const Rewire = require('rewire')
const Remark = require('remark')
const Plugin = require('./index.js')

describe('gatsby-remark-copy-relative-linked-files', () => {
  describe('Plugin', () => {
    const remark = Remark().data('settings', {
      commonmark: true,
      footnotes: true,
      pedantic: true
    })

    const markdownNode = {
      parent: {}
    }
    const getNode = () => {
      return {
        dir: ``,
        internal: {
          type: `File`
        }
      }
    }
    const getFiles = (filePath) => [
      {
        absolutePath: Path.posix.normalize(filePath),
        relativePath: filePath,
        internal: {},
        extension: filePath
          .split(`.`)
          .pop()
          .trim()
      }
    ]

    afterEach(() => {
      FsExtra.copy.mockReset()
    })

    describe('link', () => {
      test('Copy', async () => {
        const path = 'sample.zip'
        const markdownAST = remark.parse(`[File](${path})`)

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode
        })

        expect(FsExtra.copy).toHaveBeenCalled()
        expect(markdownAST.children[0].children[0].url).toBe(`/${path}`)
      })

      test('Copy with linkPrefix', async () => {
        const path = 'sample.zip'
        const markdownAST = remark.parse(`[File](${path})`)
        const linkPrefix = 'page/blog/2019/04/10/'

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix
        })

        expect(FsExtra.copy).toHaveBeenCalled()
        expect(markdownAST.children[0].children[0].url).toBe(
          `${linkPrefix}${path}`
        )
      })

      test('Not copy (Absolute URL)', async () => {
        const path = 'https://exapmle.com/sample.zip'
        const markdownAST = remark.parse(`[File](${path})`)

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode
        })

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })

      test('Ignore: *.md (Default)', async () => {
        const path = 'sample.md'
        const markdownAST = remark.parse(`[File](${path})`)

        await Plugin(
          {
            files: getFiles(path),
            markdownAST,
            markdownNode,
            getNode
          },
          // Default value of GatsbyJS
          { plugins: [] }
        )

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })

      test('Ignore: *.zip', async () => {
        const path = 'sample.zip'
        const markdownAST = remark.parse(`[File](${path})`)

        await Plugin(
          {
            files: getFiles(path),
            markdownAST,
            markdownNode,
            getNode
          },
          {
            ignoreFileExtensions: ['.zip']
          }
        )

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })

      test('Ignore: *.d.ts', async () => {
        const path = 'sample..d.ts'
        const markdownAST = remark.parse(`[File](${path})`)

        await Plugin(
          {
            files: getFiles(path),
            markdownAST,
            markdownNode,
            getNode
          },
          {
            ignoreFileExtensions: ['.d.ts']
          }
        )

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })
    })

    describe('image', () => {
      test('Copy', async () => {
        const path = 'sample.jpg'
        const markdownAST = remark.parse(`![Image](${path})`)

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode
        })

        expect(FsExtra.copy).toHaveBeenCalled()
        expect(markdownAST.children[0].children[0].url).toBe(`/${path}`)
      })

      test('Copy with linkPrefix', async () => {
        const path = 'sample.jpg'
        const markdownAST = remark.parse(`![Image](${path})`)
        const linkPrefix = 'page/blog/2019/04/10/'

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix
        })

        expect(FsExtra.copy).toHaveBeenCalled()
        expect(markdownAST.children[0].children[0].url).toBe(
          `${linkPrefix}${path}`
        )
      })

      test('Not copy (Absolute URL)', async () => {
        const path = 'https://exapmle.com/sample.jpg'
        const markdownAST = remark.parse(`![Image](${path})`)

        await Plugin({
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode
        })

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })

      test('Ignore: *.jpg', async () => {
        const path = 'sample.jpg'
        const markdownAST = remark.parse(`![Image](${path})`)

        await Plugin(
          {
            files: getFiles(path),
            markdownAST,
            markdownNode,
            getNode
          },
          {
            ignoreFileExtensions: ['.jpg']
          }
        )

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })

      test('Ignore: *.thumb.jpg', async () => {
        const path = 'sample.thumb.jpg'
        const markdownAST = remark.parse(`![Image](${path})`)

        await Plugin(
          {
            files: getFiles(path),
            markdownAST,
            markdownNode,
            getNode
          },
          {
            ignoreFileExtensions: ['.thumb.jpg']
          }
        )

        expect(FsExtra.copy).not.toHaveBeenCalled()
      })
    })
  })

  // For private API
  const Module = Rewire('./index.js')

  describe('private: isAbsoluteURL', () => {
    const isAbsoluteURL = Module.__get__('isAbsoluteURL')

    test('https://', () => {
      expect(isAbsoluteURL('https://examples.com')).toBeTruthy()
    })

    test('//', () => {
      expect(isAbsoluteURL('//examples.com')).toBeTruthy()
    })

    test('index.html', () => {
      expect(isAbsoluteURL('index.html')).toBeFalsy()
    })
  })

  describe('private: isIgnore', () => {
    const isIgnore = Module.__get__('isIgnore')

    test('Not igonre', () => {
      const extensions = ['.pdf']
      expect(isIgnore('sample.pdf')).toBeFalsy()
    })

    test('*.pdf', () => {
      const extensions = ['.pdf']
      expect(isIgnore('sample.pdf', extensions)).toBeTruthy()
    })

    test('*.d.ts', () => {
      const extensions = ['.d.ts']
      expect(isIgnore('sample.d.ts', extensions)).toBeTruthy()
    })
  })
})
