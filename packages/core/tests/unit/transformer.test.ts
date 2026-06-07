import { describe, it, expect } from 'vitest'
import { transformContent } from '../../src/transformer.js'

describe('when she provides plain markdown content', () => {
  it('she gets back valid JavaScript with a default export', async () => {
    const code = '# Hello world\n\nThis is a paragraph.'
    const result = await transformContent(code, 'test.md', 'vue')
    expect(result.code).toContain('export default')
    expect(result.map).toBeNull()
  })

  it('the output imports from the vue jsx runtime', async () => {
    const code = '# Hello'
    const result = await transformContent(code, 'test.md', 'vue')
    expect(result.code).toContain('vue/jsx-runtime')
  })
})

describe('when she writes MDX with a component', () => {
  it('the component name is preserved in the output', async () => {
    const code = '# Hello\n\n<MyButton label="Click" />'
    const result = await transformContent(code, 'test.mdx', 'vue')
    expect(result.code).toContain('MyButton')
  })
})

describe('when her file has frontmatter', () => {
  it('the frontmatter is stripped from the rendered body', async () => {
    const code = '---\ntitle: My Post\n---\n\n# Body only'
    const result = await transformContent(code, 'test.mdx', 'vue')
    expect(result.code).not.toContain('title: My Post')
    expect(result.code).toContain('export default')
  })
})
