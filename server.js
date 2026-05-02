const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const session = require('express-session');

// Load configuration
let config = { port: 3000, password: 'admin888' };
try {
  const cfgPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(cfgPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) };
  }
} catch (e) {
  console.log('Using default config');
}

const app = express();
const PORT = config.port;
const ADMIN_PASSWORD = config.password;

const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ADMIN_DIR = path.join(__dirname, 'admin');
const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure directories exist
[DATA_DIR, IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize content.json if not exists
if (!fs.existsSync(CONTENT_FILE)) {
  const defaultContent = loadDefaultContent();
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2));
}

// ========== Middleware ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'caixin-cms-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Serve static files
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve admin static files
app.use('/admin', express.static(ADMIN_DIR));

// ========== Image Upload ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substr(2, 6) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ========== Auth Middleware ==========
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  // Also check x-admin-token header
  if (req.headers['x-admin-token'] === 'caixin-admin-token') return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ========== Content Helpers ==========
function loadDefaultContent() {
  return {
    // 全局设置
    settings: {
      company_name: '佛山彩信装饰材料厂',
      company_name_en: 'Foshan Caixin Decorative Materials Factory',
      phone: '+86 123 4567 8900',
      email: 'info@caixin-paper.com',
      address: '广东省佛山市',
      worktime: '周一至周六 8:00 - 18:00',
      worktime_en: 'Monday - Saturday 8:00 - 18:00',
      icp: '粤ICP备XXXXXXXX号',
      logo_text: '彩',
      logo_image: ''
    },

    // 产品图片
    products: {
      door_image: '',
      aluminum_image: '',
      custom_image: ''
    },

    // 产品图册
    gallery: {
      images: []
    },

    // 首页
    home: {
      hero_badge: '佛山彩信 · 专业木纹转印纸厂家',
      hero_badge_en: 'Caixin · Professional Wood Grain Transfer Paper Manufacturer',
      hero_title: '专业生产高品质<br><span>木纹转印纸</span>',
      hero_title_en: 'Professional Production of<br><span>Wood Grain Transfer Paper</span>',
      hero_desc: '佛山彩信装饰材料厂，专注木纹转印纸生产与定制服务。产品广泛应用于室内房间门、铝型材喷涂等领域。3000㎡现代化工厂，为客户提供优质的转印解决方案。',
      hero_desc_en: 'Foshan Caixin Decorative Materials Factory specializes in the production and customization of wood grain transfer paper. With a 3000㎡ modern factory, we provide premium transfer solutions.',
      hero_image: '',
      about_title: '关于彩信',
      about_title_en: 'About Caixin',
      about_desc: '佛山彩信装饰材料厂成立于2015年，是一家专业从事木纹转印纸研发、生产和销售的企业。工厂位于佛山市，拥有3000多平方米的现代化生产基地。',
      about_desc_en: 'Founded in 2015, Foshan Caixin Decorative Materials Factory is a professional enterprise in R&D, production and sales of wood grain transfer paper.',
      about_desc2: '我们拥有先进的凹版印刷机1台、高速数码打印机10台，年产量达数百万平方米。产品广泛应用于室内门、铝型材等领域，畅销国内外市场。',
      about_desc2_en: 'We own 1 advanced gravure printing machine and 10 high-speed digital printers with an annual output of millions of square meters.',
      about_image: '',
      cta_title: '需要定制木纹转印纸？',
      cta_title_en: 'Need Custom Wood Grain Transfer Paper?',
      cta_desc: '无论您需要标准产品还是个性化定制，我们都为您提供专业解决方案',
      cta_desc_en: 'Whether you need standard products or custom solutions, we provide professional solutions for you.'
    },

    // 关于我们
    about: {
      intro_title: '公司简介',
      intro_title_en: 'Company Introduction',
      intro_p1: '佛山彩信装饰材料厂成立于2015年，是一家专业从事木纹转印纸研发、生产和销售的高新技术企业。公司位于广东省佛山市，依托粤港澳大湾区优越的地理位置和产业配套优势，致力于为客户提供高品质的木纹转印产品和解决方案。',
      intro_p1_en: 'Foshan Caixin Decorative Materials Factory, founded in 2015, is a high-tech enterprise specializing in R&D, production and sales of wood grain transfer paper. Located in Foshan City, Guangdong Province.',
      intro_p2: '经过多年的发展，公司已拥有3000多平方米的现代化标准厂房，配备先进的凹版印刷设备和数码打印生产线。产品广泛应用于室内房间门、铝型材喷涂等领域，以稳定的品质和优质的服务赢得了广大客户的信赖。',
      intro_p2_en: 'After years of development, the company has over 3,000 square meters of modern standard factory buildings, equipped with advanced gravure printing equipment and digital printing production lines.',
      equipment_title: '生产设备',
      equipment_title_en: 'Production Equipment',
      gravure_desc: '1台高性能凹版印刷机，用于大批量标准产品的规模化生产，印刷精度高、色彩饱满',
      gravure_desc_en: '1 high-performance gravure printing machine for large-scale production with high printing precision and vibrant colors',
      digital_desc: '10台高速数码打印机，支持小批量多品种定制生产，灵活高效，满足个性化需求',
      digital_desc_en: '10 high-speed digital printers supporting small-batch, multi-variety customized production',
      laminate_desc: '配套覆膜设备，确保转印纸表面保护层均匀一致，提升产品耐用性',
      laminate_desc_en: 'Supporting lamination equipment for uniform surface protection layer',
      testing_desc: '完善的品质检测设备，严格把控每一批次产品的质量指标',
      testing_desc_en: 'Comprehensive quality testing equipment for every batch'
    },

    // 页面横幅
    banners: {
      about: '关于我们',
      about_en: 'About Us',
      products: '产品中心',
      products_en: 'Products',
      production: '生产能力',
      production_en: 'Production Capabilities',
      faq: '常见问题',
      faq_en: 'FAQ',
      contact: '联系我们',
      contact_en: 'Contact Us'
    },

    // 页脚
    footer: {
      desc: '佛山彩信装饰材料厂 — 专业木纹转印纸生产厂家，致力于为客户提供高品质的转印产品和定制服务。',
      desc_en: 'Foshan Caixin Decorative Materials Factory — Professional manufacturer of wood grain transfer paper.'
    }
  };
}

function loadContent() {
  try {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
  } catch {
    const def = loadDefaultContent();
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(def, null, 2));
    return def;
  }
}

function saveContent(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
}

// ========== API Routes ==========

// Auth
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true, token: 'caixin-admin-token' });
  } else {
    res.status(401).json({ error: '密码错误 / Incorrect password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// Content CRUD
app.get('/api/content', (req, res) => {
  const content = loadContent();
  res.json(content);
});

app.put('/api/content', requireAuth, (req, res) => {
  const { section, key, value, lang } = req.body;
  const content = loadContent();

  if (!content[section]) content[section] = {};
  const targetKey = lang === 'en' && !key.endsWith('_en') ? key + '_en' : key;
  content[section][targetKey] = value;

  saveContent(content);
  res.json({ success: true });
});

app.put('/api/content/section', requireAuth, (req, res) => {
  const { section, data } = req.body;
  const content = loadContent();
  content[section] = { ...content[section], ...data };
  saveContent(content);
  res.json({ success: true });
});

app.put('/api/content/settings', requireAuth, (req, res) => {
  const { data } = req.body;
  const content = loadContent();
  content.settings = { ...content.settings, ...data };
  saveContent(content);
  res.json({ success: true });
});

// Gallery API
app.get('/api/gallery', (req, res) => {
  const content = loadContent();
  res.json(content.gallery || { images: [] });
});

app.post('/api/gallery/image', requireAuth, (req, res) => {
  const { src, title, title_en, category } = req.body;
  const content = loadContent();
  if (!content.gallery) content.gallery = { images: [] };
  content.gallery.images.push({
    src,
    title: title || '',
    title_en: title_en || '',
    category: category || 'uncategorized'
  });
  saveContent(content);
  res.json({ success: true, count: content.gallery.images.length });
});

app.put('/api/gallery/image/:index', requireAuth, (req, res) => {
  const index = parseInt(req.params.index);
  const content = loadContent();
  if (!content.gallery || !content.gallery.images[index]) {
    return res.status(404).json({ error: 'Image not found' });
  }
  const { title, title_en, category } = req.body;
  if (title !== undefined) content.gallery.images[index].title = title;
  if (title_en !== undefined) content.gallery.images[index].title_en = title_en;
  if (category !== undefined) content.gallery.images[index].category = category;
  saveContent(content);
  res.json({ success: true });
});

app.delete('/api/gallery/image/:index', requireAuth, (req, res) => {
  const index = parseInt(req.params.index);
  const content = loadContent();
  if (!content.gallery || !content.gallery.images[index]) {
    return res.status(404).json({ error: 'Image not found' });
  }
  content.gallery.images.splice(index, 1);
  saveContent(content);
  res.json({ success: true });
});

// Image upload
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    success: true,
    filename: req.file.filename,
    url: '/images/' + req.file.filename
  });
});

// List images
app.get('/api/images', requireAuth, (req, res) => {
  fs.readdir(IMAGES_DIR, (err, files) => {
    if (err) return res.json([]);
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f))
      .map(f => ({
        name: f,
        url: '/images/' + f,
        size: fs.statSync(path.join(IMAGES_DIR, f)).size
      }))
      .sort((a, b) => b.size - a.size);
    res.json(images);
  });
});

// Delete image
app.delete('/api/images/:name', requireAuth, (req, res) => {
  const filePath = path.join(IMAGES_DIR, req.params.name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// CMS Content endpoint for frontend
app.get('/api/cms-data', (req, res) => {
  const content = loadContent();
  res.json(content);
});

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log('\n=======================================');
  console.log('  佛山彩信装饰材料厂 - CMS 后台系统');
  console.log('=======================================');
  console.log(`  网站地址:  http://localhost:${PORT}`);
  console.log(`  管理后台:  http://localhost:${PORT}/admin/`);
  console.log(`  默认密码:  ${ADMIN_PASSWORD}`);
  console.log('=======================================\n');
});
