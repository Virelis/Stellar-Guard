"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleCopy = () => {
    if (this.state.error) {
      navigator.clipboard.writeText(
        `Error: ${this.state.error.message}\nStack: ${this.state.error.stack}`
      );
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-6 text-slate-200 shadow-xl max-w-lg mx-auto my-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-xl text-rose-400">
            ⚠️
          </div>

          <h3 className="text-base font-bold text-white mt-3">
            {this.props.fallbackTitle || "Component Failed to Load"}
          </h3>
          <p className="text-xs text-rose-300/80 mt-1">
            An unexpected error occurred while rendering this interface module.
          </p>

          {this.state.error && (
            <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-rose-400 text-left overflow-x-auto max-h-24">
              {this.state.error.message}
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={this.handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            >
              Copy Diagnostics
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

