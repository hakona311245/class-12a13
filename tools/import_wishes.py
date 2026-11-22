"""
Chuyển file Excel lời chúc (xuất từ Google Sheet) thành js/wishes.js.

Cách dùng (chạy ở thư mục gốc của repo):
    pip install openpyxl
    python tools/import_wishes.py "duong/dan/file.xlsx"

Sheet cần có dòng tiêu đề với 2 cột: "Người gửi" và "Lời chúc".
Các cột khác (ảnh, nhạc) được bỏ qua — ảnh/nhạc khai báo trong js/config.js.
"""
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Thiếu thư viện: chạy  pip install openpyxl  rồi thử lại.")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "js" / "wishes.js"


def find_col(header, *names):
    for i, cell in enumerate(header):
        if cell and str(cell).strip().lower() in names:
            return i
    return None


def main():
    # Windows console mặc định không in được tiếng Việt
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    c_from = find_col(header, "người gửi", "nguoi gui", "from")
    c_msg = find_col(header, "lời chúc", "loi chuc", "message")
    if c_from is None or c_msg is None:
        sys.exit("Không tìm thấy cột 'Người gửi' / 'Lời chúc' ở dòng đầu tiên.")

    wishes = []
    for r in rows[1:]:
        sender = (r[c_from] or "").strip() if c_from < len(r) else ""
        msg = (r[c_msg] or "").strip() if c_msg < len(r) else ""
        if sender or msg:
            wishes.append({"from": sender or "Ẩn danh", "message": msg})

    body = json.dumps(wishes, ensure_ascii=False, indent=2)
    OUT.write_text(
        "// File này được tạo bởi tools/import_wishes.py — có thể sửa tay trực tiếp.\n"
        "// Mỗi lời chúc: { from: \"Tên người gửi\", message: \"Nội dung\" }\n"
        f"window.WISHES = {body};\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {len(wishes)} lời chúc vào {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
