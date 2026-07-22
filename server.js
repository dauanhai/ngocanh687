require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const MetaApiService = require('./services/metaApi');
const lmsRoutes = require('./routes/lms');
const messengerRoutes = require('./routes/messenger');

const app = express();
const meta = new MetaApiService();

// Middleware
app.use(cors());
// Giữ lại rawBody để routes/messenger.js xác thực chữ ký HMAC của Meta.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.static(path.join(__dirname, 'public')));

// Học viện Tự Do Thịnh Vượng / Đậu Ánh AI (public/hoc-vien) — xác nhận đơn hàng, mở khoá khoá học
app.use('/api/lms', lmsRoutes);

// AI Agent tự trả lời & chốt khách trên Messenger
app.use('/api/messenger', messengerRoutes);

// In-memory storage: works both locally and on serverless platforms
// (e.g. Vercel) where the filesystem is read-only outside /tmp.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  }
});

// Video được upload theo từng đoạn nhỏ (không upload nguyên file 1 lần) vì
// Vercel giới hạn body request ~4.5MB — 4MB/đoạn để có biên an toàn.
const uploadVideoChunk = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

// ==================== API ROUTES ====================

// Health check & status
app.get('/api/status', async (req, res) => {
  try {
    const tokenInfo = await meta.verifyToken();
    const pageInfo = await meta.getPageInfo();
    res.json({
      status: 'connected',
      server: 'running',
      token: tokenInfo,
      page: {
        id: pageInfo.id,
        name: pageInfo.name,
        category: pageInfo.category,
        followers: pageInfo.followers_count,
        fans: pageInfo.fan_count,
        picture: pageInfo.picture?.data?.url,
        link: pageInfo.link
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get page info
app.get('/api/page-info', async (req, res) => {
  try {
    const data = await meta.getPageInfo();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get page posts
app.get('/api/posts', async (req, res) => {
  try {
    const limit = req.query.limit || 25;
    const data = await meta.getPagePosts(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Video (resumable upload — 3 pha) ====================
// Video từ máy được đẩy lên theo từng đoạn nhỏ qua 3 bước: start (khai báo
// dung lượng) -> chunk (gọi lặp lại cho tới hết file) -> finish (đăng ngay
// hoặc lên lịch). Xem services/metaApi.js để biết chi tiết vì sao không thể
// upload nguyên file một lần như ảnh (giới hạn body request của Vercel).

// Bước 1: khởi tạo phiên upload
app.post('/api/videos/start', async (req, res) => {
  try {
    const { fileSize } = req.body;
    if (!fileSize) return res.status(400).json({ error: 'Thiếu fileSize' });
    const data = await meta.startVideoUpload(fileSize);
    res.json({
      videoId: data.video_id,
      uploadSessionId: data.upload_session_id,
      startOffset: Number(data.start_offset),
      endOffset: Number(data.end_offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bước 2: gửi từng đoạn nhị phân của video — gọi lặp lại tới khi hết file
app.post('/api/videos/chunk', uploadVideoChunk.single('chunk'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Thiếu dữ liệu chunk' });
    const { uploadSessionId, startOffset } = req.body;
    if (!uploadSessionId || startOffset === undefined) {
      return res.status(400).json({ error: 'Thiếu uploadSessionId/startOffset' });
    }
    const data = await meta.transferVideoChunk(uploadSessionId, Number(startOffset), req.file.buffer, req.file.originalname);
    res.json({ startOffset: Number(data.start_offset), endOffset: Number(data.end_offset) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bước 3: hoàn tất — đăng ngay hoặc lên lịch (video hỗ trợ lên lịch, khác với ảnh)
app.post('/api/videos/finish', async (req, res) => {
  try {
    const { uploadSessionId, description, scheduledTime } = req.body;
    if (!uploadSessionId) return res.status(400).json({ error: 'Thiếu uploadSessionId' });
    await meta.finishVideoUpload(uploadSessionId, { description, scheduledTime });
    res.json({ success: true, message: scheduledTime ? 'Lên lịch đăng video thành công!' : 'Đăng video thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled posts
app.get('/api/posts/scheduled', async (req, res) => {
  try {
    const data = await meta.getScheduledPosts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { message, link } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const data = await meta.publishPost(message, link);
    res.json({ success: true, postId: data.id, message: 'Đăng bài thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish photo
app.post('/api/posts/photo', async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
    const data = await meta.publishPhoto(imageUrl, caption);
    res.json({ success: true, postId: data.id, message: 'Đăng ảnh thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish photo uploaded from local disk
app.post('/api/posts/photo/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file ảnh' });
  try {
    const data = await meta.publishPhotoFile(req.file.buffer, req.file.originalname, req.file.mimetype, req.body.caption || '');
    res.json({ success: true, postId: data.id, message: 'Đăng ảnh thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule post
app.post('/api/posts/schedule', async (req, res) => {
  try {
    const { message, scheduledTime, link } = req.body;
    if (!message || !scheduledTime) {
      return res.status(400).json({ error: 'Message and scheduledTime are required' });
    }
    const data = await meta.schedulePost(message, scheduledTime, link);
    res.json({ success: true, postId: data.id, message: 'Lên lịch đăng bài thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:postId', async (req, res) => {
  try {
    await meta.deletePost(req.params.postId);
    res.json({ success: true, message: 'Xóa bài viết thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
app.put('/api/posts/:postId', async (req, res) => {
  try {
    const { message } = req.body;
    await meta.updatePost(req.params.postId, message);
    res.json({ success: true, message: 'Cập nhật bài viết thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post insights
app.get('/api/posts/:postId/insights', async (req, res) => {
  try {
    const data = await meta.getPostInsights(req.params.postId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get page insights
app.get('/api/insights', async (req, res) => {
  try {
    const { period, since } = req.query;
    const data = await meta.getPageInsights(period || 'day', since);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.get('/api/verify-token', async (req, res) => {
  try {
    const data = await meta.verifyToken();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multer / upload error handler (must come after routes)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

// Start server (only when run directly, e.g. `node server.js` / `npm start`).
// On Vercel the module is required by the serverless runtime instead, which
// invokes the exported app per-request rather than binding a port.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Đậu Ánh Facebook Agent đang chạy tại: http://localhost:${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`📄 Page ID: ${process.env.PAGE_ID}`);
    console.log(`🔑 Token: ${process.env.PAGE_ACCESS_TOKEN ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'}\n`);
  });
}

module.exports = app;
