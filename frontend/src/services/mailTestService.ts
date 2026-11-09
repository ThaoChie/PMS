import { axiosClient } from '../api/axiosClient';

export interface MailTestResult {
  success: boolean;
  message?: string;
  testedRecipient?: string;
  config?: {
    host?: string;
    port?: number;
    username?: string;
    appMailFrom?: string;
    passwordLength?: number;
    passwordPreview?: string;
    hasBrevoApiKey?: boolean;
    hasResendApiKey?: boolean;
  };
  errorClass?: string;
  errorMessage?: string;
  rootCause?: string;
  diagnosticHint?: string;
}

export const mailTestService = {
  testMail: async (to?: string): Promise<MailTestResult> => {
    try {
      const res = await axiosClient.get<MailTestResult>('/test/mail', {
        params: to ? { to } : undefined,
      });
      return res.data;
    } catch (err: any) {
      if (err?.response?.data) {
        return err.response.data as MailTestResult;
      }
      return {
        success: false,
        errorMessage: err?.message || 'Không thể kết nối đến máy chủ backend',
        diagnosticHint: 'Hãy chắc chắn rằng backend trên Render đang ở trạng thái Live và sẵn sàng nhận kết nối.',
      };
    }
  },
};
