require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const MetaApiService = require('./services/metaApi');

const app = express();
const meta = new MetaApiService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
