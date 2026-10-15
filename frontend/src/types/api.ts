export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageWrapper<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  timestamp: string;
}
