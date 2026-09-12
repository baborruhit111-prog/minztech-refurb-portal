import React from "react";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem("minztech_active_user");
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0f0f0f] text-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-brand-surface border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Application Notice</h2>
                <p className="text-xs text-gray-400">The portal encountered an error</p>
              </div>
            </div>

            <div className="p-3 bg-brand-dark rounded-xl border border-brand-border text-xs text-gray-300 font-mono overflow-x-auto max-h-40">
              {this.state.error?.message || "Unknown error"}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Portal</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-dark hover:bg-brand-hover text-gray-300 border border-brand-border font-semibold text-xs rounded-xl transition-all"
                title="Clear local session and restart"
              >
                <LogOut className="w-4 h-4" />
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
