import { Component } from "react";

// Catches a render error anywhere below it so one broken page shows a
// recoverable message instead of a blank white screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-light-grey px-4 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong.</h1>
          <p className="text-slate-500">Try refreshing the page.</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-black text-white hover:bg-charcoal transition"
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
