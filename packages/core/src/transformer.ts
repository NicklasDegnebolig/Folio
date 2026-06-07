import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'

export interface TransformResult {
  code: string
  map: null
}

export async function transformContent(
  code: string,
  id: string,
  jsxImportSource: string,
): Promise<TransformResult> {
  const compiled = await compile(code, {
    jsxImportSource,
    remarkPlugins: [remarkFrontmatter],
    providerImportSource: null,
  })

  return {
    code: String(compiled),
    map: null,
  }
}
