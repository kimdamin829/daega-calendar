import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-10">
          <h1 className="mb-2 text-lg font-medium text-red-600">오류가 발생했습니다</h1>
          <pre className="overflow-x-auto rounded-lg bg-red-50 p-4 text-xs text-red-800">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gcal-blue px-4 py-2 text-sm text-white"
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
