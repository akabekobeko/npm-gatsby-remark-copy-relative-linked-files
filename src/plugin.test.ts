import path from 'path'
import fsExtra from 'fs-extra'
import markdownParser from 'remark'
import { plugin, isAbsoluteURL, isIgnore } from './plugin'

jest.mock(`fs-extra`, () => {
  return {
    existsSync: () => false,
    copy: jest.fn(),
    ensureDir: jest.fn(),
  }
})

const mockedCopy = fsExtra.copy as jest.MockedFunction<typeof fsExtra.copy>

describe('Plugin', () => {
  const remark = markdownParser().data('settings', {
    commonmark: true,
    footnotes: true,
    pedantic: true,
  })

  const markdownNode = {
    parent: {},
  }
  const getNode = () => {
    return {
      dir: ``,
      internal: {
        type: `File`,
      },
    }
  }
  const getFiles = (filePath: string) => [
    {
      absolutePath: path.posix.normalize(filePath),
      relativePath: filePath,
      name: path.parse(filePath).name,
      relativeDirectory: path.dirname(filePath),
      internal: { contentDigest: 'a1b2c3' },
      extension: path.parse(filePath).ext.replace('.', ''),
    },
  ]

  afterEach(() => {
    mockedCopy.mockReset()
  })

  describe('link', () => {
    test('Copy', async () => {
      const path = 'sample.zip'
      const markdownAST = remark.parse(`[File](${path})`) as any

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(markdownAST.children[0].children[0].url).toBe(`/${path}`)
    })

    test('Copy with linkPrefix', async () => {
      const path = 'sample.zip'
      const markdownAST = remark.parse(`[File](${path})`) as any
      const linkPrefix = 'page/blog/2019/04/10/'

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix,
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(markdownAST.children[0].children[0].url).toBe(
        `${linkPrefix}${path}`
      )
    })

    test('Not copy (Absolute URL)', async () => {
      const path = 'https://exapmle.com/sample.zip'
      const markdownAST = remark.parse(`[File](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })

    test('Ignore: *.md (Default)', async () => {
      const path = 'sample.md'
      const markdownAST = remark.parse(`[File](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })

    test('Ignore: *.zip', async () => {
      const path = 'sample.zip'
      const markdownAST = remark.parse(`[File](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {
          ignoreFileExtensions: ['.zip'],
        }
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })

    test('Ignore: *.d.ts', async () => {
      const path = 'sample..d.ts'
      const markdownAST = remark.parse(`[File](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {
          ignoreFileExtensions: ['.d.ts'],
        }
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })
  })

  describe('image', () => {
    test('Copy', async () => {
      const path = 'sample.jpg'
      const markdownAST = remark.parse(`![Image](${path})`) as any

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(markdownAST.children[0].children[0].url).toBe(`/${path}`)
    })

    test('Copy with linkPrefix', async () => {
      const path = 'sample.jpg'
      const markdownAST = remark.parse(`![Image](${path})`) as any
      const linkPrefix = 'page/blog/2019/04/10/'

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix,
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(markdownAST.children[0].children[0].url).toBe(
        `${linkPrefix}${path}`
      )
    })

    test('Copy with filename function', async () => {
      const path = 'sample.jpg'
      const markdownAST = remark.parse(`![Image](${path})`) as any

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {
          filename: ({ name, hash, extension }) =>
            `${name}-${hash}.${extension}`,
        }
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(markdownAST.children[0].children[0].url).toBe(`/sample-a1b2c3.jpg`)
    })

    test('Not copy (Absolute URL)', async () => {
      const path = 'https://exapmle.com/sample.jpg'
      const markdownAST = remark.parse(`![Image](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })

    test('Ignore: *.jpg', async () => {
      const path = 'sample.jpg'
      const markdownAST = remark.parse(`![Image](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {
          ignoreFileExtensions: ['.jpg'],
        }
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })

    test('Ignore: *.thumb.jpg', async () => {
      const path = 'sample.thumb.jpg'
      const markdownAST = remark.parse(`![Image](${path})`)

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {
          ignoreFileExtensions: ['.thumb.jpg'],
        }
      )

      expect(mockedCopy).not.toHaveBeenCalled()
    })
  })

  describe('HTML', () => {
    test('<a>', async () => {
      const file = 'sample.svg'
      const markdownAST = remark.parse(`<a href="${file}">SVG</a>`)
      await plugin(
        {
          files: getFiles(file),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
    })

    test('<img>', async () => {
      const file = 'sample.jpg'
      const markdownAST = remark.parse(`<img src="${file}" />`)
      await plugin(
        {
          files: getFiles(file),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
    })

    test('<video>', async () => {
      const file = 'sample.mp4'
      const markdownAST = remark.parse(`<video src="${file}"></video>`)
      await plugin(
        {
          files: getFiles(file),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
    })

    test('<source>', async () => {
      const file = 'sample.mp4'
      const markdownAST = remark.parse(
        `<video><source src='sample.mp4' type="video/mp4"></video>`
      )
      await plugin(
        {
          files: getFiles(file),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
    })

    test('<audio>', async () => {
      const file = 'sample.mp3'
      const markdownAST = remark.parse(`<audio src="${file}"></audio>`)
      await plugin(
        {
          files: getFiles(file),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
    })
  })

  describe('manifest', () => {
    test('One file', async () => {
      const path = 'sample.thumb.jpg'
      const markdownAST = remark.parse(
        `\`\`\`copyfiles\n${path}\n\`\`\``
      ) as any

      await plugin(
        {
          files: getFiles(path),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenCalled()
      expect(
        markdownAST.children.findIndex(
          (node: any) => node.type === 'code' && node.lang === 'copyfiles'
        )
      ).toEqual(-1)
    })

    test('Two files', async () => {
      const path1 = 'report.css'
      const path2 = 'diagram.png'
      const markdownAST = remark.parse(
        `\`\`\`copyfiles\n${path1}\n${path2}\n\`\`\``
      )

      await plugin(
        {
          files: getFiles(path1).concat(getFiles(path2)),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenNthCalledWith(
        1,
        path1,
        expect.anything(),
        expect.anything()
      )
      expect(mockedCopy).toHaveBeenNthCalledWith(
        2,
        path2,
        expect.anything(),
        expect.anything()
      )
    })

    test('Tolerates whitespace', async () => {
      const path1 = 'report.css'
      const path2 = 'diagram.png'
      const markdownAST = remark.parse(
        `\`\`\`copyfiles\n   ${path1}\n${path2}   \n\`\`\``
      )

      await plugin(
        {
          files: getFiles(path1).concat(getFiles(path2)),
          markdownAST,
          markdownNode,
          getNode,
          linkPrefix: '',
        },
        {}
      )

      expect(mockedCopy).toHaveBeenNthCalledWith(
        1,
        path1,
        expect.anything(),
        expect.anything()
      )
      expect(mockedCopy).toHaveBeenNthCalledWith(
        2,
        path2,
        expect.anything(),
        expect.anything()
      )
    })
  })
})

describe('isAbsoluteURL', () => {
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

describe('isIgnore', () => {
  test('Not ignore', () => {
    expect(isIgnore('sample.pdf', [])).toBeFalsy()
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
