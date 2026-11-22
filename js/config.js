/* ============================================================
   CẤU HÌNH TRANG — sửa nội dung ở đây, không cần đụng code.
   Lời chúc nằm riêng ở js/wishes.js.
   Màu sắc chỉnh ở đầu file css/style.css (mục :root).
   ============================================================ */
window.SITE = {
  // Thanh trên cùng + tiêu đề tab trình duyệt
  meta: {
    pageTitle: "Chiến Dịch 19.11 // 12A13",
    squad: "12A13",
    unit: "G.T.I.",
    status: "SECTOR 19.11 // ACTIVE",
  },

  // Nhạc nền (đặt file trong assets/audio/)
  music: {
    src: "assets/audio/thanh-xuan.m4a",
    title: "Thanh Xuân",
    artist: "Da LAB",
    volume: 0.7, // 0 → 1
    loop: true,
  },

  // Màn hình khởi động (bấm nút ở đây sẽ bật nhạc luôn)
  boot: {
    lines: [
      "Khởi động hệ thống liên lạc chiến thuật...",
      "Kết nối vệ tinh SECTOR 19.11...",
      "Đồng bộ danh sách đặc vụ 12A13...",
      "Phát hiện 1 gói dữ liệu mật chưa mở.",
    ],
    button: "TRIỂN KHAI",
    hint: "Bật loa lên để nghe nhạc nền nhé",
  },

  // Màn hình giao nhiệm vụ
  briefing: {
    tag: "MẬT LỆNH KHẨN CẤP // GỬI CÁC ĐẶC VỤ NAM 12A13",
    titleLead: "CHIẾN DỊCH 19.11:",
    titleAccent: "ĐỒNG ĐỘI",
    body:
      "Hệ thống G.T.I. vừa tiếp nhận một gói dữ liệu mật dành riêng cho các chiến binh nam lớp 12A13 nhân ngày Quốc tế Nam giới 19/11. Vượt qua trạm xác minh để mở khóa toàn bộ dữ liệu.",
    button: "XÁC NHẬN & BẮT ĐẦU",
  },

  // Câu hỏi xác minh. Có thể thêm nhiều câu; answer là vị trí đáp án đúng (bắt đầu từ 0).
  // Đặt enabled: false để bỏ qua bước này.
  quiz: {
    enabled: true,
    tag: "TRẠM XÁC MINH DANH TÍNH // CÂU HỎI BẢO MẬT",
    intro:
      "Trả lời đúng câu hỏi mật mã để chứng minh bạn là thành viên chính thức của 12A13 và mở khóa sảnh chờ.",
    questions: [
      {
        question: "LỚP 12A13 CÓ BAO NHIÊU NỮ?",
        options: ["36", "31", "32", "35"],
        answer: 1,
        correct: "✅ CHÍNH XÁC! 31 bông hoa của 12A13 đã xác nhận danh tính.",
        wrong: "❌ SAI MẬT MÃ RỒI! Sĩ số nữ lớp mình mà cũng quên hả mấy ông? Chọn lại đê!",
      },
    ],
    continueButton: "TIẾN VÀO SẢNH CHỜ",
  },

  // Kho ảnh. caption có thể để trống.
  gallery: {
    tag: "KHU VỰC 03 // BẢN ĐỒ: LAYALI GROVE",
    title: "SẢNH CHỜ ĐẶC VỤ // KHO LƯU TRỮ KÝ ỨC 12A13",
    subtitle: "Dò sóng từng tần số kỷ niệm bên dưới để xem trọn bộ khoảnh khắc thanh xuân của lớp.",
    photos: [
      { src: "assets/photos/01.jpg", caption: "" },
      { src: "assets/photos/02.jpg", caption: "" },
      { src: "assets/photos/03.jpg", caption: "" },
      { src: "assets/photos/04.jpg", caption: "" },
      { src: "assets/photos/05.jpg", caption: "" },
      { src: "assets/photos/06.jpg", caption: "" },
      { src: "assets/photos/07.jpg", caption: "" },
      { src: "assets/photos/08.jpg", caption: "" },
      { src: "assets/photos/09.jpg", caption: "" },
      { src: "assets/photos/10.jpg", caption: "" },
    ],
    noticeTitle: "THÔNG BÁO: BẠN CÓ 1 HỘP THƯ TIẾP TẾ MỚI",
    noticeBody: "Hậu phương 12A13 vừa gửi lời chúc mật dành cho các chiến binh nam.",
    button: "MỞ HỘP THƯ LỜI CHÚC",
  },

  // Hộp thư lời chúc
  mailbox: {
    tag: "NHẬT KÝ CHIẾN DỊCH 19.11",
    title: "HỘP THƯ CHÚC MỪNG CÁC CHIẾN BINH NAM 12A13",
    button: "HOÀN TẤT CHIẾN DỊCH",
  },

  // Màn hình kết thúc
  finale: {
    tag: "HUY HIỆU MVP: TOÀN BỘ CHIẾN BINH NAM 12A13",
    title: "CHIẾN DỊCH 19.11 HOÀN TẤT XUẤT SẮC",
    message: "Cảm ơn các chiến binh đã luôn là đồng đội tuyệt vời nhất của hậu phương 12A13. Chúc mừng 19/11!",
    // Các con số hiện ở màn kết thúc (để số lời chúc / ảnh tự đếm thì ghi "auto")
    stats: [
      { label: "LỜI CHÚC", value: "auto:wishes" },
      { label: "KỶ NIỆM", value: "auto:photos" },
      { label: "BÔNG HOA", value: 31 },
    ],
    ratingPrompt: "Chạm vào số sao bên dưới để đánh giá chiến dịch:",
    ratingReplies: [
      "1 sao? Đặc vụ chắc bấm nhầm rồi 😤",
      "2 sao... hậu phương sẽ rút kinh nghiệm 🥲",
      "3 sao, tạm chấp nhận. Lần sau xịn hơn!",
      "4 sao! Gần đạt cấp MVP rồi đó 🔥",
      "5 sao! Hậu phương 12A13 nhận lệnh, yêu các ông 💚",
    ],
    replay: "TRỞ VỀ ĐIỂM XUẤT PHÁT",
  },
};
