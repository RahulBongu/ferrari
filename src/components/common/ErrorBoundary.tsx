import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
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
    console.error("Uncaught error in Ferrari Digital Garage:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#070709] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full border border-white/10 bg-[#0f0f14]/90 backdrop-blur-xl p-8 rounded-lg shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#d40000]/10 border border-[#d40000]/30 flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-[#d40000]" />
            </div>

            <span className="font-mono-tech text-xs uppercase tracking-[0.3em] text-[#d40000] mb-2">
              DIAGNOSTIC SYSTEM ALERT
            </span>

            <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-white mb-4">
              TELEMETRY INTERRUPTED
            </h1>

            <p className="font-sans text-xs text-white/60 mb-6 leading-relaxed">
              {this.state.error?.message ||
                "An unexpected rendering event occurred. This may be caused by WebGL hardware acceleration settings."}
            </p>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#d40000] hover:bg-[#e10600] text-white font-mono-tech text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              RELOAD ARCHIVE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
