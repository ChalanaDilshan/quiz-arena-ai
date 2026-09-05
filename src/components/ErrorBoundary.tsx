import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Quiz Arena ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleReturnHome = (): void => {
    try {
      sessionStorage.removeItem('quizarena_host_session');
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="min-h-screen bg-canvas flex items-center justify-center p-4 text-alabaster"
        >
          <div className="card w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-rim shadow-2xl animate-fade-in">
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-xl bg-sienna/15 border border-sienna/30 flex items-center justify-center mb-5 text-sienna mx-auto sm:mx-0">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Error Message */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-alabaster text-center sm:text-left mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-smoke text-center sm:text-left mb-6 leading-relaxed">
              Quiz Arena encountered an unexpected interface issue. Your connection state is protected and you can recover without losing your session.
            </p>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              <button
                onClick={this.handleTryAgain}
                className="btn-primary flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="card flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border border-rim hover:border-sienna transition-colors text-alabaster"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reload
              </button>

              <button
                onClick={this.handleReturnHome}
                className="card flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border border-rim hover:border-sienna transition-colors text-smoke hover:text-alabaster"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
            </div>

            {/* Collapsible Technical Details */}
            <div className="border-t border-rim pt-4">
              <button
                onClick={this.toggleDetails}
                aria-expanded={this.state.showDetails}
                className="w-full flex items-center justify-between text-xs text-smoke hover:text-alabaster transition-colors py-1 focus:outline-none"
              >
                <span className="flex items-center gap-2 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-sienna" />
                  Technical Details
                </span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-smoke" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-smoke" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3.5 rounded-xl bg-canvas border border-rim text-[11px] font-mono text-smoke overflow-x-auto max-h-48 scrollbar-thin">
                  <p className="text-sienna font-semibold mb-1">{errorMessage}</p>
                  {componentStack && (
                    <pre className="whitespace-pre-wrap text-[10px] opacity-80 mt-2">
                      {componentStack.trim()}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
