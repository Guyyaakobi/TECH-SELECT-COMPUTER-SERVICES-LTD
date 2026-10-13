import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface HoursErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  key?: React.Key;
}

export interface HoursErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class HoursErrorBoundary extends Component<HoursErrorBoundaryProps, HoursErrorBoundaryState> {
  public override state: HoursErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): HoursErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[HoursErrorBoundary] Caught render error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="my-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-right shadow-xs"
        >
          <div className="flex items-center gap-2 mb-2 font-bold text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{this.props.fallbackTitle || "אירעה שגיאה בהצגת כרטיס הדיווח"}</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed mb-3">
            {this.props.fallbackMessage ||
              "המערכת נתקלה בשגיאה בהצגת הנתונים. ניתן לרענן את הכרטיס או להמשיך להקליד כרגיל."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>נסה שוב</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
