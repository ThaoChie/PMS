import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  onTokenReceived?: (idToken: string) => void;
  onError?: (msg: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function GoogleLoginButton({
  onTokenReceived,
  onError,
  loading = false,
  disabled = false,
  className = '',
}: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isClientIdConfigured = clientId && !clientId.includes('your-google-client-id');
  const [gisLoaded, setGisLoaded] = React.useState(
    typeof window !== 'undefined' && !!window.google?.accounts?.id
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isClientIdConfigured || !gisLoaded || !window.google?.accounts?.id || !containerRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential && onTokenReceived) {
            onTokenReceived(response.credential);
          } else if (onError) {
            onError('Không nhận được mã xác thực (ID Token) từ Google.');
          }
        },
      });

      // Render Google official Sign-in button with native popup account picker
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 380,
        locale: 'vi',
      });
    } catch (err: any) {
      console.warn('Google Identity initialization error:', err);
    }
  }, [clientId, isClientIdConfigured, gisLoaded, onTokenReceived, onError]);

  function handleFallbackClick() {
    if (!isClientIdConfigured) {
      if (onError) {
        onError(
          'Chưa cấu hình Google Client ID thật trong file .env (VITE_GOOGLE_CLIENT_ID). Vui lòng cung cấp Client ID từ Google Cloud Console để mở bảng chọn tài khoản Google thật.'
        );
      }
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }

  // If real Google client is configured and rendered by GIS, show containerRef
  if (isClientIdConfigured && gisLoaded) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div ref={containerRef} className="w-full flex justify-center" />
      </div>
    );
  }

  // Standard official Google branded button (triggers GIS or alerts if unconfigured)
  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleFallbackClick}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] transition-all duration-150 shadow-xs disabled:opacity-60 bg-white cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#C5221F]" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{loading ? 'Đang kết nối Google…' : 'Đăng nhập với Google'}</span>
      </button>
    </div>
  );
}
