import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="py-12 text-center space-y-4 font-sans text-xs bg-white border border-red-100 rounded-2xl p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-red-600">Failed to render module</h3>
          <p className="text-gray-500 font-light">An unexpected error occurred while loading this administrative view.</p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 text-[10px] font-semibold tracking-wider text-white uppercase bg-[#111111] hover:bg-[#B08D57] rounded-full transition-colors"
          >
            Retry Render
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
