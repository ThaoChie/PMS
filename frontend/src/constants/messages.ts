/**
 * Centralized Vietnamese UI messages according to project_structure.md
 */
export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGIN_FAILED: 'Email và/hoặc mật khẩu chưa đúng',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',
    FORGOT_PASSWORD_SENT: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn đặt lại mật khẩu trong ít phút.',
    RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
  },
  COMMON: {
    CONFIRM_DELETE: 'Bạn có chắc chắn muốn xóa không?',
    DELETE_SUCCESS: 'Xóa thành công',
    SAVE_SUCCESS: 'Lưu thay đổi thành công',
    CREATE_SUCCESS: 'Tạo mới thành công',
    UPDATE_SUCCESS: 'Cập nhật thành công',
    ACTION_FAILED: 'Thao tác không thành công, vui lòng thử lại',
    NETWORK_ERROR: 'Lỗi kết nối máy chủ',
    LOADING: 'Đang tải dữ liệu...',
    EMPTY: 'Chưa có dữ liệu',
    RETRY: 'Thử lại',
    CANCEL: 'Hủy',
    CONFIRM: 'Xác nhận',
    CLOSE: 'Đóng',
    SEARCH_PLACEHOLDER: 'Tìm kiếm issue, dự án...',
  },
  PROJECT: {
    CREATE_TITLE: 'Tạo dự án mới',
    KEY_REQUIRED: 'Mã dự án (Key) là bắt buộc',
    KEY_INVALID: 'Mã dự án chỉ gồm 2-10 ký tự chữ in hoa và số',
    NAME_REQUIRED: 'Tên dự án là bắt buộc',
    CLOSE_CONFIRM: 'Dự án đã đóng sẽ không thể tạo mới hay cập nhật issue. Bạn có chắc muốn đóng không?',
    CLOSE_SUCCESS: 'Đã đóng dự án thành công',
  },
  ISSUE: {
    CREATE_TITLE: 'Tạo Issue',
    SUMMARY_REQUIRED: 'Tiêu đề tóm tắt là bắt buộc',
    TYPE_REQUIRED: 'Loại issue là bắt buộc',
    CONCURRENT_MODIFICATION: 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.',
    ESTIMATE_INVALID: 'Thời gian còn lại không được lớn hơn thời gian ban đầu.',
    TRANSITION_SUCCESS: 'Chuyển trạng thái thành công',
    TRANSITION_FAILED: 'Không thể chuyển trạng thái không hợp lệ',
    REJECT_REASON_REQUIRED: 'Vui lòng nhập lý do từ chối',
  },
  MEMBER: {
    LAST_PM_REMOVAL: 'Không thể xóa hoặc hạ vai trò của PM duy nhất trong dự án.',
    INVITE_SUCCESS: 'Đã gửi lời mời thành công',
  },
} as const;
