import { useState, useEffect } from 'react';
import { approvalService } from '../services/approvalService';
import type { ApprovalPolicy } from '../types';

export function useApprovalPolicy() {
  const [policy, setPolicy] = useState<ApprovalPolicy>({
    enabled: false,
    closeRequiresApproval: false,
    workflowChangeRequiresApproval: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    approvalService
      .getPolicy()
      .then((data) => {
        if (mounted) {
          setPolicy(data || { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false });
        }
      })
      .catch(() => {
        // Coi mọi lỗi hoặc 404 là chính sách "tắt" (camunda.enabled=false)
        if (mounted) {
          setPolicy({ enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false });
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { policy, loading };
}
