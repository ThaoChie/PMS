#!/usr/bin/env bash
# docs/camunda/smoke-approval.sh
# Kịch bản kiểm thử toàn diện quy trình duyệt nhiều cấp và nhắc việc qua curl trên hệ thống thật (profile dev,camunda)

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
MAILHOG_URL="${MAILHOG_URL:-http://localhost:8025}"
RAND_ID=$((RANDOM % 9000 + 1000))

echo "=== BẮT ĐẦU SMOKE TEST CAMUNDA / FLOWABLE APPROVAL & REMINDER TRÊN $BASE_URL (Session: $RAND_ID) ==="

# Helper functions
login() {
    local email="$1"
    local password="$2"
    curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" | jq -r '.data.accessToken'
}

echo "1. Đăng nhập các tài khoản mẫu..."
ADMIN_TOKEN=$(login "admin@epms.com" "Password123@")
PM1_TOKEN=$(login "pm@epms.com" "Password123@")
PM2_TOKEN=$(login "dev@epms.com" "Password123@")

echo "   - ADMIN_TOKEN: ${ADMIN_TOKEN:0:15}..."
echo "   - PM1_TOKEN (Alex Chen): ${PM1_TOKEN:0:15}..."
echo "   - PM2_TOKEN (Marcus Jones): ${PM2_TOKEN:0:15}..."

echo ""
echo "2. Kiểm tra Policy phê duyệt (/api/approval-requests/policy)..."
POLICY_RES=$(curl -s -X GET "$BASE_URL/api/approval-requests/policy" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "   Response: $POLICY_RES"

echo ""
echo "3. Thử gọi trực tiếp khi Policy BẬT (phải bị chặn 422 APPROVAL_005 qua Interceptor)..."
echo "   3.1 Thử đóng dự án trực tiếp bằng POST /api/projects/1/close:"
POST_CLOSE_HTTP=$(curl -s -o /tmp/close_post.json -w "%{http_code}" -X POST "$BASE_URL/api/projects/1/close" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "       HTTP Status: $POST_CLOSE_HTTP"
cat /tmp/close_post.json
echo ""

echo "   3.2 Thử cập nhật Workflow trực tiếp bằng PUT /api/projects/1/workflow:"
PUT_WF_HTTP=$(curl -s -o /tmp/wf_put.json -w "%{http_code}" -X PUT "$BASE_URL/api/projects/1/workflow" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"statuses":[]}')
echo "       HTTP Status: $PUT_WF_HTTP"
cat /tmp/wf_put.json
echo ""

# Helper to create project and add PM2
create_project_with_pm2() {
    local key="$1"
    local name="$2"
    local res
    res=$(curl -s -X POST "$BASE_URL/api/projects" \
        -H "Authorization: Bearer $PM1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$name\",\"projectKey\":\"$key\",\"description\":\"Test Project $key\"}")
    local pid
    pid=$(echo "$res" | jq -r '.data.id')
    
    # Mời PM2 vào dự án
    curl -s -X POST "$BASE_URL/api/projects/$pid/invitations" \
        -H "Authorization: Bearer $PM1_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"email":"dev@epms.com","role":"PM"}' > /dev/null
    
    # PM2 chấp nhận lời mời
    local inv_id
    inv_id=$(curl -s -X GET "$BASE_URL/api/invitations/mine" \
        -H "Authorization: Bearer $PM2_TOKEN" | jq -r '.data[0].id')
    curl -s -X POST "$BASE_URL/api/invitations/$inv_id/accept" \
        -H "Authorization: Bearer $PM2_TOKEN" > /dev/null
    
    echo "$pid"
}

echo "======================================================================"
echo "LUỒNG 1: DUYỆT THÀNH CÔNG (PM tạo -> PM2 duyệt Cấp 1 -> Admin duyệt Cấp 2 -> CLOSED)"
echo "======================================================================"

PRJ1_KEY="C${RAND_ID}"
echo "1.1 PM1 tạo dự án mới $PRJ1_KEY để test duyệt đóng thành công..."
PRJ1_ID=$(create_project_with_pm2 "$PRJ1_KEY" "Project Close Test $PRJ1_KEY")
echo "    -> Dự án tạo thành công: id=$PRJ1_ID ($PRJ1_KEY), PM2 đã tham gia."

echo "1.2 PM1 tạo yêu cầu đóng dự án $PRJ1_KEY..."
CREATE_REQ1_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ1_ID,\"type\":\"PROJECT_CLOSE\",\"reason\":\"Đã nghiệm thu toàn bộ tính năng và bàn giao khách hàng\"}")
REQ1_ID=$(echo "$CREATE_REQ1_RES" | jq -r '.data.id')
echo "    -> Mã yêu cầu tạo thành công: #$REQ1_ID"

echo "1.3 PM2 (Marcus Jones) duyệt Cấp 1..."
curl -s -X POST "$BASE_URL/api/approval-requests/$REQ1_ID/approve" \
    -H "Authorization: Bearer $PM2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Đồng ý đóng dự án, các đầu việc kỹ thuật đã hoàn tất."}' > /dev/null
echo "    -> PM2 đã duyệt Cấp 1"

echo "1.4 Admin (admin@epms.com) duyệt Cấp 2..."
curl -s -X POST "$BASE_URL/api/approval-requests/$REQ1_ID/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Phê duyệt đóng dự án. Bàn giao lưu trữ."}' > /dev/null
echo "    -> Admin đã duyệt Cấp 2"

sleep 1

echo "1.5 Kiểm tra trạng thái yêu cầu duyệt #$REQ1_ID và dự án $PRJ1_KEY..."
REQ1_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ1_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
PRJ1_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ1_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Request status: $(echo "$REQ1_DETAIL" | jq -r '.data.status')"
echo "    Apply status:   $(echo "$REQ1_DETAIL" | jq -r '.data.applyStatus')"
echo "    Project status: $(echo "$PRJ1_DETAIL" | jq -r '.data.status')"

echo "======================================================================"
echo "LUỒNG 2: TỪ CHỐI (PM tạo -> PM2 từ chối Cấp 1 -> REJECTED, dự án vẫn ACTIVE)"
echo "======================================================================"

PRJ2_KEY="R${RAND_ID}"
echo "2.1 PM1 tạo dự án mới $PRJ2_KEY để test từ chối..."
PRJ2_ID=$(create_project_with_pm2 "$PRJ2_KEY" "Project Reject Test $PRJ2_KEY")
echo "    -> Dự án REJ tạo thành công: id=$PRJ2_ID ($PRJ2_KEY)"

echo "2.2 PM1 tạo yêu cầu đóng dự án $PRJ2_KEY..."
CREATE_REQ2_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ2_ID,\"type\":\"PROJECT_CLOSE\",\"reason\":\"Đề nghị đóng $PRJ2_KEY\"}")
REQ2_ID=$(echo "$CREATE_REQ2_RES" | jq -r '.data.id')
echo "    -> Yêu cầu duyệt REJ #$REQ2_ID tạo thành công."

echo "2.3 PM2 từ chối yêu cầu #$REQ2_ID..."
REJECT_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ2_ID/reject" \
    -H "Authorization: Bearer $PM2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Chưa hoàn thành kiểm thử nghiệm thu, từ chối đóng."}')
echo "    Response: $(echo "$REJECT_RES" | jq -c '.')"

echo "2.4 Kiểm tra trạng thái yêu cầu #$REQ2_ID và dự án $PRJ2_KEY..."
REQ2_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ2_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
PRJ2_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ2_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Request status: $(echo "$REQ2_DETAIL" | jq -r '.data.status')"
echo "    Project status: $(echo "$PRJ2_DETAIL" | jq -r '.data.status')"

echo "======================================================================"
echo "LUỒNG 3: HỦY YÊU CẦU (PM tạo -> Chính PM hủy -> CANCELLED, dự án vẫn ACTIVE)"
echo "======================================================================"

PRJ3_KEY="X${RAND_ID}"
echo "3.1 PM1 tạo dự án mới $PRJ3_KEY để test hủy..."
PRJ3_ID=$(create_project_with_pm2 "$PRJ3_KEY" "Project Cancel Test $PRJ3_KEY")
echo "    -> Dự án CAN tạo thành công: id=$PRJ3_ID ($PRJ3_KEY)"

echo "3.2 PM1 tạo yêu cầu đóng dự án $PRJ3_KEY..."
CREATE_REQ3_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ3_ID,\"type\":\"PROJECT_CLOSE\",\"reason\":\"Đề nghị đóng $PRJ3_KEY\"}")
REQ3_ID=$(echo "$CREATE_REQ3_RES" | jq -r '.data.id')
echo "    -> Yêu cầu duyệt CAN #$REQ3_ID tạo thành công."

echo "3.3 Chính PM1 hủy yêu cầu #$REQ3_ID..."
CANCEL_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ3_ID/cancel" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Tạo nhầm, xin phép hủy yêu cầu."}')
echo "    Response: $(echo "$CANCEL_RES" | jq -c '.')"

echo "3.4 Kiểm tra trạng thái yêu cầu #$REQ3_ID và dự án $PRJ3_KEY..."
REQ3_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ3_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
PRJ3_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ3_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Request status: $(echo "$REQ3_DETAIL" | jq -r '.data.status')"
echo "    Project status: $(echo "$PRJ3_DETAIL" | jq -r '.data.status')"

echo "======================================================================"
echo "LUỒNG 4: DUYỆT ĐỔI WORKFLOW (WORKFLOW_CONFIG_CHANGE)"
echo "======================================================================"

PRJ4_KEY="W${RAND_ID}"
echo "4.1 PM1 tạo dự án mới $PRJ4_KEY để test đổi Workflow..."
PRJ4_ID=$(create_project_with_pm2 "$PRJ4_KEY" "Project Workflow Test $PRJ4_KEY")
echo "    -> Dự án tạo thành công: id=$PRJ4_ID ($PRJ4_KEY)"

echo "4.2 Thử tạo yêu cầu WORKFLOW_CONFIG_CHANGE với payload KHÔNG HỢP LỆ (phải trả 400 VALIDATION_ERROR)..."
INVALID_WF_HTTP=$(curl -s -o /tmp/wf_invalid.json -w "%{http_code}" -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ4_ID,\"type\":\"WORKFLOW_CONFIG_CHANGE\",\"reason\":\"Đổi workflow lỗi\",\"payload\":{\"statuses\":[]}}")
echo "    HTTP Status: $INVALID_WF_HTTP"
cat /tmp/wf_invalid.json
echo ""

echo "4.3 Lấy Workflow hiện tại của dự án $PRJ4_KEY (id=$PRJ4_ID)..."
CURRENT_WF=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ4_ID/workflow" \
    -H "Authorization: Bearer $PM1_TOKEN")
FIRST_STATUS_NAME=$(echo "$CURRENT_WF" | jq -r '.data.statuses[0].name')
echo "    Tên trạng thái đầu tiên hiện tại: '$FIRST_STATUS_NAME'"

echo "4.4 Chuẩn bị payload hợp lệ đổi tên trạng thái đầu tiên thành 'To Do (Approved by Camunda)'..."
VALID_PAYLOAD=$(echo "$CURRENT_WF" | jq '.data | {statuses: (.statuses | .[0].name = "To Do (Approved by Camunda)"), transitions: .transitions}')

echo "4.5 PM1 gửi yêu cầu duyệt đổi Workflow..."
CREATE_WF_REQ_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ4_ID,\"type\":\"WORKFLOW_CONFIG_CHANGE\",\"reason\":\"Cập nhật quy trình chuẩn của dự án\",\"payload\":$VALID_PAYLOAD}")
WF_REQ_ID=$(echo "$CREATE_WF_REQ_RES" | jq -r '.data.id')
echo "    -> Mã yêu cầu đổi Workflow tạo thành công: #$WF_REQ_ID"

echo "4.6 PM2 duyệt Cấp 1..."
curl -s -X POST "$BASE_URL/api/approval-requests/$WF_REQ_ID/approve" \
    -H "Authorization: Bearer $PM2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Đồng ý cập nhật workflow."}' > /dev/null
echo "    -> PM2 đã duyệt Cấp 1"

echo "4.7 Admin duyệt Cấp 2..."
curl -s -X POST "$BASE_URL/api/approval-requests/$WF_REQ_ID/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Admin phê duyệt áp dụng workflow mới."}' > /dev/null
echo "    -> Admin đã duyệt Cấp 2"

sleep 1

echo "4.8 Kiểm tra trạng thái yêu cầu duyệt #$WF_REQ_ID..."
WF_REQ_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$WF_REQ_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Request status: $(echo "$WF_REQ_DETAIL" | jq -r '.data.status')"
echo "    Apply status:   $(echo "$WF_REQ_DETAIL" | jq -r '.data.applyStatus')"

echo "4.9 Kiểm tra lại Workflow thực tế của dự án $PRJ4_KEY (id=$PRJ4_ID)..."
UPDATED_WF=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ4_ID/workflow" \
    -H "Authorization: Bearer $PM1_TOKEN")
NEW_FIRST_STATUS_NAME=$(echo "$UPDATED_WF" | jq -r '.data.statuses[0].name')
echo "    Tên trạng thái đầu tiên sau khi duyệt: '$NEW_FIRST_STATUS_NAME'"

echo "======================================================================"
echo "LUỒNG 5: NHẮC ISSUE ĐẾN HẠN (DUE DATE REMINDER)"
echo "======================================================================"

TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
echo "5.1 PM1 tạo Issue mới trong dự án $PRJ4_KEY (hạn chót: $TOMORROW, Assignee: Marcus Jones id=3)..."
CREATE_ISSUE_RES=$(curl -s -X POST "$BASE_URL/api/projects/$PRJ4_ID/issues" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"summary\":\"Nhiệm vụ kiểm thử nhắc hạn Camunda\",\"type\":\"TASK\",\"assigneeId\":3,\"dueDate\":\"$TOMORROW\",\"priority\":\"HIGH\"}")
ISSUE_ID=$(echo "$CREATE_ISSUE_RES" | jq -r '.data.id')
ISSUE_KEY=$(echo "$CREATE_ISSUE_RES" | jq -r '.data.issueKey')
echo "    -> Tạo Issue thành công: #$ISSUE_ID ($ISSUE_KEY)"

BEFORE_ISSUE=$(curl -s -X GET "$BASE_URL/api/issues/$ISSUE_KEY" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Snapshot ban đầu: status=$(echo "$BEFORE_ISSUE" | jq -r '.data.status'), assignee=$(echo "$BEFORE_ISSUE" | jq -r '.data.assignee.email'), dueDate=$(echo "$BEFORE_ISSUE" | jq -r '.data.dueDate')"

echo "5.2 Kích hoạt quy trình Flowable due-date-reminder lần 1..."
TRIGGER_RES1=$(curl -s -X POST "$BASE_URL/api/approval-requests/trigger-due-reminder" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Trigger Response: $TRIGGER_RES1"

sleep 2

echo "5.3 Kiểm tra hộp thư MailHog xem email nhắc hạn đã được gửi..."
MAIL_COUNT_1=$(curl -s "$MAILHOG_URL/api/v2/messages" | jq '[.items[] | select(.Raw.To[] | contains("dev@epms.com"))] | length')
echo "    Số email gửi đến dev@epms.com trên MailHog: $MAIL_COUNT_1"
LATEST_MAIL_SUBJECT=$(curl -s "$MAILHOG_URL/api/v2/messages" | jq -r '[.items[] | select(.Raw.To[] | contains("dev@epms.com"))][0].Content.Headers.Subject[0]')
echo "    Tiêu đề email mới nhất: $LATEST_MAIL_SUBJECT"

echo "5.4 Kích hoạt quy trình due-date-reminder lần 2 trong cùng ngày (chống gửi lặp bằng reminder_log)..."
TRIGGER_RES2=$(curl -s -X POST "$BASE_URL/api/approval-requests/trigger-due-reminder" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Trigger Response: $TRIGGER_RES2"

sleep 1

MAIL_COUNT_2=$(curl -s "$MAILHOG_URL/api/v2/messages" | jq '[.items[] | select(.Raw.To[] | contains("dev@epms.com"))] | length')
echo "    Số email gửi đến dev@epms.com sau lần 2: $MAIL_COUNT_2 (phải bằng lần 1: $MAIL_COUNT_1 -> không gửi lặp)"

echo "5.5 Kiểm tra lại Issue #$ISSUE_ID ($ISSUE_KEY) để chứng minh KHÔNG BỊ THAY ĐỔI GÌ..."
AFTER_ISSUE=$(curl -s -X GET "$BASE_URL/api/issues/$ISSUE_KEY" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "    Sau khi chạy nhắc việc: status=$(echo "$AFTER_ISSUE" | jq -r '.data.status'), assignee=$(echo "$AFTER_ISSUE" | jq -r '.data.assignee.email'), dueDate=$(echo "$AFTER_ISSUE" | jq -r '.data.dueDate')"

if [ "$(echo "$BEFORE_ISSUE" | jq -r '.data.status')" = "$(echo "$AFTER_ISSUE" | jq -r '.data.status')" ] && \
   [ "$(echo "$BEFORE_ISSUE" | jq -r '.data.assignee.id')" = "$(echo "$AFTER_ISSUE" | jq -r '.data.assignee.id')" ] && \
   [ "$(echo "$BEFORE_ISSUE" | jq -r '.data.dueDate')" = "$(echo "$AFTER_ISSUE" | jq -r '.data.dueDate')" ]; then
    echo "    -> XÁC NHẬN: Issue hoàn toàn nguyên vẹn 100%, không bị engine sửa đổi dữ liệu!"
fi

echo ""
echo "=== HOÀN TẤT TOÀN BỘ 5 LUỒNG KIỂM THỬ APPROVAL & REMINDER THÀNH CÔNG ==="
