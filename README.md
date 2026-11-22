# Chiến Dịch 19.11 — 12A13

Trang web chúc mừng 19/11 (Quốc tế Nam giới) mà các bạn nữ 12A13 gửi tới các bạn nam, giao diện theo phong cách game bắn súng chiến thuật.

Trang là HTML/CSS/JS thuần, không cần cài đặt hay build gì cả.

## Luồng trang

1. **Khởi động**: bấm "Triển khai" để vào trang, nhạc nền bật luôn từ lúc này.
2. **Giao nhiệm vụ**: giới thiệu chiến dịch.
3. **Trạm xác minh**: câu hỏi mật mã (có thể thêm nhiều câu hoặc tắt hẳn).
4. **Kho ký ức**: xem ảnh lớp, dùng nút, phím ← → hoặc vuốt trên điện thoại.
5. **Hộp thư**: toàn bộ lời chúc.
6. **Hoàn tất**: huy hiệu, thống kê, chấm sao.

## Chỉnh nội dung

| Muốn sửa | Mở file |
|---|---|
| Chữ, câu hỏi, danh sách ảnh, nhạc | `js/config.js` |
| Lời chúc | `js/wishes.js` |
| Màu sắc, font | `css/style.css` (phần `:root` ở đầu file) |
| Ảnh | thư mục `assets/photos/` |
| Nhạc | thư mục `assets/audio/` |

### Cập nhật lời chúc từ Google Sheet

Tải sheet về dạng `.xlsx` (Tệp → Tải xuống → Microsoft Excel), rồi chạy:

```bash
pip install openpyxl
python tools/import_wishes.py "duong/dan/file.xlsx"
```

Script đọc 2 cột **Người gửi** và **Lời chúc**, rồi ghi đè `js/wishes.js`.

### Thêm / đổi ảnh

Chép ảnh vào `assets/photos/`, rồi thêm một dòng vào `gallery.photos` trong `js/config.js`:

```js
{ src: "assets/photos/11.jpg", caption: "Chuyến đi Cần Giờ" },
```

Nên để ảnh rộng khoảng 1800px và dưới 600KB cho trang tải nhanh.

## Chạy thử trên máy

Mở thẳng `index.html` bằng trình duyệt là được. Muốn giống bản online hơn thì chạy:

```bash
python -m http.server 8000
```

rồi mở http://localhost:8000

## Đưa lên mạng (GitHub Pages)

Vào repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, thư mục `/ (root)` → **Save**. Khoảng 1 phút sau trang sẽ có ở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.
