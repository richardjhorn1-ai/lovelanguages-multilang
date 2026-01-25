import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for graceful error handling
 * Displays a friendly message when something goes wrong
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border-color)] p-8 max-w-md w-full text-center">
            {/* Heart with crack animation */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="text-6xl animate-pulse">💔</div>
            </div>
            
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-[var(--text-secondary)] mb-6">
              Don't worry, love can fix anything! Let's try that again.
            </p>
            
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-scale-label text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-[var(--bg-primary)] rounded-xl text-[10px] text-red-500 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleTryAgain}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-colors shadow-lg"
              >
                Refresh Page
              </button>
            </div>
            
            <p className="mt-6 text-scale-caption text-[var(--text-secondary)]">
              If this keeps happening, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
