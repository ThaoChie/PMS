import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-lg text-center">
            <div className="w-12 h-12 bg-red-100 text-[#E53E3E] rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Đã xảy ra lỗi hiển thị giao diện</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mb-4">
              Hệ thống đã ghi nhận lỗi. Bạn có thể thử tải lại trang hoặc đăng xuất để xóa phiên đệm.
            </p>
            {this.state.error?.message && (
              <div className="text-left bg-[#F1F5F9] border border-[#CBD5E1] p-3 rounded-lg mb-6 overflow-auto max-h-36">
                <p className="font-mono text-xs text-[#DC2626] font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="font-mono text-[10px] text-[#475569] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#1E293B] text-white rounded-lg text-xs font-semibold hover:bg-[#0F172A] transition-colors"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#E53E3E] text-white rounded-lg text-xs font-semibold hover:bg-[#C53030] transition-colors"
              >
                Đăng xuất &amp; Đặt lại phiên
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
