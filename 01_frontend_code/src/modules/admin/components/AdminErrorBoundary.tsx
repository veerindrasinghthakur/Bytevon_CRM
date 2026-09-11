import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/shared/components/feedback/ErrorState'

type Props = {
  children: ReactNode
  /** Optional label for the surface (e.g. page name) */
  label?: string
}

type State = {
  error: Error | null
}

/**
 * Class boundary so uncaught render errors in admin routes show ErrorState
 * instead of a blank React error overlay-only experience.
 */
export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep console signal for developers; do not swallow
    console.error('[AdminErrorBoundary]', error, info.componentStack)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <ErrorState
            title={this.props.label ? `${this.props.label} crashed` : 'Something went wrong'}
            description={this.state.error.message || 'An unexpected UI error occurred.'}
            onRetry={this.retry}
            showBack
          />
        </div>
      )
    }
    return this.props.children
  }
}
