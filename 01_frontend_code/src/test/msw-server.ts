/** MSW node server for Vitest integration tests (real-mode HTTP coverage). */
import { setupServer } from 'msw/node'
import { handlers } from './msw-handlers'

export const server = setupServer(...handlers)
