# Báo Cáo Kỹ Thuật - Lab 01: Kiến Thức Cơ Bản Về Client-Server

## 1. Giới Thiệu Nhóm

* Nhóm: 11
* Thành viên:

  * Nguyễn Huỳnh Tiến Khải - Lập Trình
  * Lê Tiến Huy - Thiết Kế, làm báo cáo
  

## 2. Mục Tiêu Bài Lab

* Nắm vững kiến trúc Client-Server, giao thức HTTP.
* Phân biệt request static/dynamic.
* Thực hành viết HTTP server/client và dùng DevTools.

## 3. Kiến Trúc Hệ Thống

```mermaid
graph TD
    Client(Browser / HTTP Client) -->|HTTP| Server(Node.js + Express)
    Server -->|Static Files| HTML[HTML/CSS/JS]
    Server -->|API| API[/api/server-info]
```

## 4. Thực Hiện

### 4.1. Static Web Server

* Sử dụng **Express.js**
* Phục vụ `index.html`, `style.css`, `script.js`
* Có endpoint `/api/server-info` trả về:

  * timestamp
  * hostname
  * uptime
  * node version
  * OS info

**Ảnh minh họa UI:**

> screenshots/image.png

### 4.2. HTTP Client (Node.js)

* Tự xây dựng bằng module gốc `http`, `https`
* Hỗ trợ:

  * GET local server
  * GET GitHub API
  * POST JSONPlaceholder
  * Xử lý lỗi khi server không khả dụng

**Log mẫu:**

```bash
✅ [GET] http://localhost:3000/api/server-info
✅ [POST] https://jsonplaceholder.typicode.com/posts
```

### 4.3. Giám Sát Traffic

* Tạo lớp `NetworkMonitor`
* Thu thập:

  * Response time
  * Kích thước data
  * Memory usage

**Ảnh chụp:**

> screenshots/image-1.png

## 5. Kết Quả Phân Tích

| Endpoint                  | Tình trạng | Response Time | Size  |
| ------------------------- | ---------- | ------------- | ----- |
| localhost/api/server-info | ✅          | 21ms          | 230B  |
| GitHub API                | ✅          | 223ms         | 1.2KB |
| JSONPlaceholder           | ✅          | 155ms         | 292B  |
| Nonexistent URL           | ❌          | 0ms           | 0     |

**Success rate:** 75%
**Avg Response:** 133.09ms

## 6. Bài Học Kinh Nghiệm

* Củng cố kiến thức HTTP, status codes
* Biết dùng DevTools hiệu quả
* Biết tự viết client và server
* Nâng cao tư duy lỗi và debugging

## 7. Khó Khăn Gặp Phải

* Cấu hình HTTPS / lỗi CORS
* Test request ngoài thường lỗi nếu server chưa khởi động
* Cần đồng bộ log / hiển thị log rõ ràng

## 8. Kết Luận

* Hoàn thành đầy đủ các tính năng yêu cầu
* Đáp ứng tốt về mặt kỹ thuật và logic
* Tự tin thuyết trình và giải đáp

## 9. Tham Khảo

* [MDN HTTP Protocol](https://developer.mozilla.org/en-US/docs/Web/HTTP)
* [Express.js Docs](https://expressjs.com/)
* [Node.js HTTP](https://nodejs.org/api/http.html)
* [JSONPlaceholder](https://jsonplaceholder.typicode.com/)
* [GitHub API](https://docs.github.com/en/rest)
