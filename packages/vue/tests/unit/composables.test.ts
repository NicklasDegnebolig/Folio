// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { ContentEntry } from 'folio'
import { useContent, useContentList } from '../../src/composables.js'

const mockEntries: ContentEntry[] = [
  {
    path: '/blog/my-post',
    locale: 'en',
    frontmatter: { title: 'My Post', date: '2024-01-15' },
    body: async () => ({
      default: defineComponent({ template: '<p>body</p>' }),
    }),
  },
  {
    path: '/blog/another',
    locale: 'en',
    frontmatter: { title: 'Another Post' },
    body: async () => ({
      default: defineComponent({ template: '<p>body</p>' }),
    }),
  },
]

vi.mock('virtual:folio/query', () => ({
  listContent: vi
    .fn<() => Promise<ContentEntry[]>>()
    .mockResolvedValue(mockEntries),
  getContent: vi
    .fn<() => Promise<ContentEntry>>()
    .mockResolvedValue(mockEntries[0]!),
}))

describe('when she uses useContentList in a component', () => {
  it('she starts with loading true and entries empty', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContentList('/blog')
        },
        template: '<div>{{ loading }}</div>',
      }),
    )
    expect(wrapper.text()).toBe('true')
  })

  it('after mount she has the entries', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContentList('/blog')
        },
        template: '<div>{{ entries.length }}</div>',
      }),
    )
    await flushPromises()
    expect(wrapper.text()).toBe('2')
  })
})

describe('when she uses useContent in a component', () => {
  it('after mount she has the single entry', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContent('/blog/my-post')
        },
        template: '<div>{{ entry?.frontmatter.title }}</div>',
      }),
    )
    await flushPromises()
    expect(wrapper.text()).toBe('My Post')
  })
})
