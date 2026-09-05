import { useEffect } from 'react'

type EventTargetLike = EventTarget | Window | Document | Element | null

interface UseEventListenerOptions {
  passive?: boolean
  capture?: boolean
  once?: boolean
}

/**
 * Custom hook to attach an event listener to a target.
 * Handles cleanup automatically and supports standard addEventListener options.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  target: EventTargetLike,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => void,
  options?: UseEventListenerOptions
): void
export function useEventListener<K extends keyof DocumentEventMap>(
  target: EventTargetLike,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => void,
  options?: UseEventListenerOptions
): void
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: EventTargetLike,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: UseEventListenerOptions
): void
export function useEventListener(
  target: EventTargetLike,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: UseEventListenerOptions
): void
export function useEventListener(
  target: EventTargetLike,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: UseEventListenerOptions
): void {
  useEffect(() => {
    if (!target) return

    const { passive = false, capture = false, once = false } = options ?? {}

    target.addEventListener(type, listener, { passive, capture, once })

    return () => {
      target.removeEventListener(type, listener, { capture })
    }
  }, [target, type, listener, options?.passive, options?.capture, options?.once])
}