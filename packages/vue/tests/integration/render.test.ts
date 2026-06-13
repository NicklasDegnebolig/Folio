// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { ContentEntry } from 'folio'
import FolioContent from '../../src/FolioContent.vue'

const BodyComponent = defineComponent({ template: '<p>rendered body</p>' })

const mockEntry: ContentEntry = {
  path: '/blog/my-post',
  locale: 'en',
  frontmatter: { title: 'My Post' },
  body: vi
    .fn<() => Promise<{ default: typeof BodyComponent }>>()
    .mockResolvedValue({
      default: BodyComponent,
    }),
}

describe('when she renders <FolioContent> with an entry', () => {
  it('she sees the rendered MDX body after loading', async () => {
    const wrapper = mount(FolioContent, { props: { entry: mockEntry } })
    await flushPromises()
    expect(wrapper.text()).toContain('rendered body')
  })

  it('she sees the loading slot while the body loads', () => {
    const loadingEntry: ContentEntry = {
      ...mockEntry,
      body: () => new Promise(() => {}),
    }
    const wrapper = mount(FolioContent, {
      props: { entry: loadingEntry },
      slots: { loading: '<span>Loading...</span>' },
    })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('she sees the error slot when body fails to load', async () => {
    const errorEntry: ContentEntry = {
      ...mockEntry,
      body: vi.fn().mockRejectedValue(new Error('load failed')),
    }
    const wrapper = mount(FolioContent, {
      props: { entry: errorEntry },
      slots: { error: '<span>Error occurred</span>' },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Error occurred')
  })

  it('she can pass custom components into the MDX body', async () => {
    const CustomButton = defineComponent({
      template: '<button>custom</button>',
    })
    const wrapper = mount(FolioContent, {
      props: { entry: mockEntry, components: { CustomButton } },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('rendered body')
  })
})
