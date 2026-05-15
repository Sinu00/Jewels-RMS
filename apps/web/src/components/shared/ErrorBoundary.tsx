'use client'

import React from 'react'

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
          <p className="font-semibold text-ink">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-muted underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
