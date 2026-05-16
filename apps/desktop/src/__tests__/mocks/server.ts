import { setupServer } from 'msw/node'
import type { RestHandler } from 'msw'

let currentHandlers: RestHandler[] = []

export const server = setupServer()

export function setHandlers(...handlers: RestHandler[]) {
  currentHandlers = handlers
  server.use(...handlers)
}

export function resetHandlers() {
  server.resetHandlers()
  currentHandlers = []
}

export function getHandlers() {
  return currentHandlers
}

export {
  createMockAuthState,
  createAuthHandlers,
  createMockAssistantState,
  createAssistantHandlers,
  createMockWorldState,
  createWorldHandlers,
  createMockOAuthState,
  createOAuthHandlers,
  createAllHandlers,
} from './handlers'
