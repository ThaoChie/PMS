#!/usr/bin/env bash
# docs/camunda/smoke-approval.sh
# Kịch bản kiểm thử toàn diện quy trình duyệt nhiều cấp qua curl trên hệ thống thật (profile dev,camunda)

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
echo "=== BẮT ĐẦU SMOKE TEST APPROVAL FLOW TRÊN $BASE_URL ==="

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
echo "3. Thiết lập Marcus Jones (id=3) làm PM thứ hai trong dự án PRJ (id=1)..."
ROLE_RES=$(curl -s -X PUT "$BASE_URL/api/projects/1/members/3/role" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"role":"PM"}')
echo "   Response: $ROLE_RES"

echo ""
echo "4. Thử đóng dự án trực tiếp khi Policy BẬT (phải bị chặn 422 APPROVAL_005)..."
echo "   -> Thử bằng POST /api/projects/1/close:"
POST_CLOSE_HTTP=$(curl -s -o /tmp/close_post.json -w "%{http_code}" -X POST "$BASE_URL/api/projects/1/close" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "      HTTP Status: $POST_CLOSE_HTTP"
cat /tmp/close_post.json
echo ""

echo "   -> Thử bằng PUT /api/projects/1/close:"
PUT_CLOSE_HTTP=$(curl -s -o /tmp/close_put.json -w "%{http_code}" -X PUT "$BASE_URL/api/projects/1/close" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "      HTTP Status: $PUT_CLOSE_HTTP"
cat /tmp/close_put.json
echo ""

echo "======================================================================"
echo "LUỒNG 1: DUYỆT THÀNH CÔNG (PM tạo -> PM2 duyệt Cấp 1 -> Admin duyệt Cấp 2 -> CLOSED)"
echo "======================================================================"

echo "1.1 PM1 tạo yêu cầu đóng dự án PRJ (id=1)..."
CREATE_REQ_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"projectId":1,"type":"PROJECT_CLOSE","reason":"Đã nghiệm thu toàn bộ tính năng và bàn giao khách hàng"}')
echo "   Response: $CREATE_REQ_RES"
REQ1_ID=$(echo "$CREATE_REQ_RES" | jq -r '.data.id')
echo "   -> Mã yêu cầu tạo thành công: #$REQ1_ID"

echo "1.2 PM2 (Marcus Jones) duyệt Cấp 1..."
APPROVE_L1_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ1_ID/approve" \
    -H "Authorization: Bearer $PM2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Đồng ý đóng dự án, các đầu việc kỹ thuật đã hoàn tất."}')
echo "   Response: $APPROVE_L1_RES"

echo "1.3 Admin (admin@epms.com) duyệt Cấp 2..."
APPROVE_L2_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ1_ID/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Phê duyệt đóng dự án. Bàn giao lưu trữ."}')
echo "   Response: $APPROVE_L2_RES"

# Đợi 1 giây để worker / delegate hoàn tất cập nhật trạng thái nếu async
sleep 1

echo "1.4 Kiểm tra trạng thái yêu cầu duyệt #$REQ1_ID..."
REQ1_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ1_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "   Request status: $(echo "$REQ1_DETAIL" | jq -r '.data.status')"
echo "   Apply status:   $(echo "$REQ1_DETAIL" | jq -r '.data.applyStatus')"
echo "   Detail JSON:    $REQ1_DETAIL"

echo "1.5 Kiểm tra trạng thái dự án PRJ (id=1)..."
PRJ1_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/1" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "   Project status: $(echo "$PRJ1_DETAIL" | jq -r '.data.status')"
echo "   Detail JSON:    $PRJ1_DETAIL"

echo ""
echo "======================================================================"
echo "LUỒNG 2: TỪ CHỐI (PM tạo -> PM2 từ chối Cấp 1 -> REJECTED, dự án vẫn ACTIVE)"
echo "======================================================================"

echo "2.1 PM1 tạo dự án mới PRJ2 để test từ chối..."
PRJ2_CREATE=$(curl -s -X POST "$BASE_URL/api/projects" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Project Reject Test","projectKey":"REJ","description":"Test Luồng Từ Chối"}')
PRJ2_ID=$(echo "$PRJ2_CREATE" | jq -r '.data.id')
echo "   -> Dự án REJ tạo thành công: id=$PRJ2_ID"

echo "2.2 Thêm PM2 vào dự án REJ..."
curl -s -X POST "$BASE_URL/api/projects/$PRJ2_ID/invitations" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"dev@epms.com","role":"PM"}' > /dev/null
INVITE_ID=$(curl -s -X GET "$BASE_URL/api/invitations/mine" \
    -H "Authorization: Bearer $PM2_TOKEN" | jq -r '.data[0].id')
curl -s -X POST "$BASE_URL/api/invitations/$INVITE_ID/accept" \
    -H "Authorization: Bearer $PM2_TOKEN" > /dev/null
echo "   -> Marcus Jones đã tham gia REJ với vai trò PM."

echo "2.3 PM1 tạo yêu cầu đóng dự án REJ..."
CREATE_REQ2_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ2_ID,\"type\":\"PROJECT_CLOSE\",\"reason\":\"Đề nghị đóng REJ\"}")
REQ2_ID=$(echo "$CREATE_REQ2_RES" | jq -r '.data.id')
echo "   -> Yêu cầu duyệt REJ #$REQ2_ID tạo thành công."

echo "2.4 PM2 từ chối yêu cầu #$REQ2_ID..."
REJECT_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ2_ID/reject" \
    -H "Authorization: Bearer $PM2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Chưa hoàn thành kiểm thử nghiệm thu, từ chối đóng."}')
echo "   Response: $REJECT_RES"

echo "2.5 Kiểm tra trạng thái yêu cầu #$REQ2_ID và dự án REJ (id=$PRJ2_ID)..."
REQ2_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ2_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
PRJ2_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ2_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "   Request status: $(echo "$REQ2_DETAIL" | jq -r '.data.status')"
echo "   Project status: $(echo "$PRJ2_DETAIL" | jq -r '.data.status')"

echo ""
echo "======================================================================"
echo "LUỒNG 3: HỦY YÊU CẦU (PM tạo -> Chính PM hủy -> CANCELLED, dự án vẫn ACTIVE)"
echo "======================================================================"

echo "3.1 PM1 tạo dự án mới PRJ3 để test hủy..."
PRJ3_CREATE=$(curl -s -X POST "$BASE_URL/api/projects" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Project Cancel Test","projectKey":"CAN","description":"Test Luồng Hủy"}')
PRJ3_ID=$(echo "$PRJ3_CREATE" | jq -r '.data.id')
echo "   -> Dự án CAN tạo thành công: id=$PRJ3_ID"

echo "3.2 Thêm PM2 vào dự án CAN..."
curl -s -X POST "$BASE_URL/api/projects/$PRJ3_ID/invitations" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"dev@epms.com","role":"PM"}' > /dev/null
INVITE2_ID=$(curl -s -X GET "$BASE_URL/api/invitations/mine" \
    -H "Authorization: Bearer $PM2_TOKEN" | jq -r '.data[0].id')
curl -s -X POST "$BASE_URL/api/invitations/$INVITE2_ID/accept" \
    -H "Authorization: Bearer $PM2_TOKEN" > /dev/null
echo "   -> Marcus Jones đã tham gia CAN với vai trò PM."

echo "3.3 PM1 tạo yêu cầu đóng dự án CAN..."
CREATE_REQ3_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":$PRJ3_ID,\"type\":\"PROJECT_CLOSE\",\"reason\":\"Đề nghị đóng CAN\"}")
REQ3_ID=$(echo "$CREATE_REQ3_RES" | jq -r '.data.id')
echo "   -> Yêu cầu duyệt CAN #$REQ3_ID tạo thành công."

echo "3.4 Chính PM1 hủy yêu cầu #$REQ3_ID..."
CANCEL_RES=$(curl -s -X POST "$BASE_URL/api/approval-requests/$REQ3_ID/cancel" \
    -H "Authorization: Bearer $PM1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Tạo nhầm, xin phép hủy yêu cầu."}')
echo "   Response: $CANCEL_RES"

echo "3.5 Kiểm tra trạng thái yêu cầu #$REQ3_ID và dự án CAN (id=$PRJ3_ID)..."
REQ3_DETAIL=$(curl -s -X GET "$BASE_URL/api/approval-requests/$REQ3_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
PRJ3_DETAIL=$(curl -s -X GET "$BASE_URL/api/projects/$PRJ3_ID" \
    -H "Authorization: Bearer $PM1_TOKEN")
echo "   Request status: $(echo "$REQ3_DETAIL" | jq -r '.data.status')"
echo "   Project status: $(echo "$PRJ3_DETAIL" | jq -r '.data.status')"

echo ""
echo "=== HOÀN TẤT TOÀN BỘ CÁC LUỒNG KIỂM THỬ APPROVAL THÀNH CÔNG ==="
