import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Select } from '@/shared/components/ui/Select'

const options = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
  { value: '3', label: 'Three' },
]

function mockViewport(rectBottom: number, rectTop: number, innerHeight = 800) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: rectBottom,
    top: rectTop,
    left: 0,
    right: 100,
    width: 100,
    height: 40,
    x: 0,
    y: rectTop,
    toJSON: () => ({}),
  } as DOMRect)
  vi.stubGlobal('innerHeight', innerHeight)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function open() {
  render(<Select value="" onChange={() => {}} options={options} aria-label="Pick" />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick' }))
  return screen.getByTestId('select-panel')
}

describe('Select drop direction', () => {
  it('drops down when there is room below', () => {
    mockViewport(100, 60)
    expect(open().getAttribute('data-drop')).toBe('down')
  })

  it('flips up when cramped below with room above (fixed-footer case)', () => {
    mockViewport(760, 720)
    const panel = open()
    expect(panel.getAttribute('data-drop')).toBe('up')
    expect(panel.className).toMatch(/bottom-full/)
  })

  it('honours explicit dropDirection override', () => {
    mockViewport(100, 60)
    render(
      <Select value="" onChange={() => {}} options={options} aria-label="Up" dropDirection="up" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Up' }))
    expect(screen.getByTestId('select-panel').getAttribute('data-drop')).toBe('up')
  })
})
