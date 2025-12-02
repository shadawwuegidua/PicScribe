// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const aiService = require('./aiService');
const exif = require('exif-parser');
const axios = require('axios');

// 显式加载 .env 文件
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// 调试环境变量
console.log('环境变量检查:', {
    BAIDU_API_KEY: process.env.BAIDU_API_KEY,
    BAIDU_SECRET_KEY: process.env.BAIDU_SECRET_KEY
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadFolder = path.join(__dirname, 'uploads');
const metadataFile = path.join(uploadFolder, 'metadata.json');

// 初始化 metadata.json
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
    console.log('成功创建uploads文件夹');
}
if (!fs.existsSync(metadataFile)) {
    fs.writeFileSync(metadataFile, JSON.stringify({ images: [] }, null, 2));
    console.log('成功创建metadata.json');
}

// 读取和保存元数据的辅助函数
const readMetadata = () => {
    try {
        const data = fs.readFileSync(metadataFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('读取metadata.json失败:', err.message);
        return { images: [] };
    }
};

const saveMetadata = (metadata) => {
    try {
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (err) {
        console.error('保存metadata.json失败:', err.message);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('只支持 JPG、PNG 或 GIF 格式的图片'));
    }
});

// *** NEW: Serve the loading.html first ***
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loading.html'));
});

app.post('/upload', upload.array('images[]'), async (req, res) => {
    try {
        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, error: '未上传任何文件' });
        }

        const results = [];
        const metadata = readMetadata();

        for (const file of uploadedFiles) {
            const imageBuffer = fs.readFileSync(file.path);
            const base64Image = imageBuffer.toString('base64');

            // AI标签处理
            let aiResult = { tags: [], description: '' };
            try {
                const aiResponse = await aiService.analyzeImage(base64Image);
                // 转换AI标签格式
                aiResult = {
                    tags: aiResponse.tags.map(tag => tag.keyword),
                    description: aiResponse.description
                };
            } catch (e) {
                console.error(`AI分析失败（文件：${file.filename}）:`, e.message);
                aiResult = { tags: [], description: 'AI分析失败' };
            }

            // EXIF标签处理
            let exifTags = [];
            try {
                const parser = exif.create(imageBuffer);
                const exifData = parser.parse();
                if (exifData.tags) {
                    // 只保留需要的EXIF信息
                    const relevantExif = {
                        'Model': '设备型号',
                        'FNumber': '光圈',
                        'ExposureTime': '曝光时间',
                        'ISO': 'ISO感光度',
                        'FocalLength': '焦距'
                    };

                    exifTags = Object.entries(exifData.tags)
                        .filter(([key]) => relevantExif[key])
                        .map(([key, value]) => ({
                            name: relevantExif[key],
                            value: key === 'ExposureTime' ? `${value}s` :
                                  key === 'FNumber' ? `f/${value}` :
                                  key === 'FocalLength' ? `${value}mm` :
                                  value.toString()
                        }));
                }
            } catch (e) {
                console.error(`EXIF解析失败（文件：${file.filename}）:`, e.message);
                exifTags = [];
            }

            const imageData = {
                filename: file.filename,
                path: `/uploads/${file.filename}`,
                uploadDate: new Date().toISOString(),
                aiTags: aiResult.tags,
                aiDescription: aiResult.description, // 这是百度AI的描述
                ecnuDescription: '', // 新增：初始化 ECNU AI 描述为空
                exifTags: exifTags
            };

            results.push(imageData);
            metadata.images.push(imageData);
        }

        saveMetadata(metadata);
        res.json({ 
            success: true, 
            data: results
        });
    } catch (error) {
        console.error('上传处理失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/test-ai', async (req, res) => {
    try {
        const testImagePath = path.join(__dirname, 'test.jpg');
        if (!fs.existsSync(testImagePath)) {
            return res.status(400).json({ 
                success: false, 
                error: 'test.jpg 文件不存在'
            });
        }
        const testImage = fs.readFileSync(testImagePath, 'base64');
        const result = await aiService.analyzeImage(testImage);
        res.json(result);
    } catch (error) {
        console.error('测试AI分析失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/get-images', (req, res) => {
    try {
        const metadata = readMetadata();
        res.json(metadata.images);
    } catch (error) {
        console.error('获取图片列表失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 新增：用于调用ECNU大模型生成图片描述的接口
app.post('/generate-description', async (req, res) => {
    const { filename } = req.body; // 从请求体中获取文件名
    if (!filename) {
        return res.status(400).json({ success: false, error: '缺少文件名' });
    }

    const imagePath = path.join(uploadFolder, filename);

    // 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ success: false, error: '图片文件未找到' });
    }

    try {
        // 1. 读取图片文件并转换为Base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = `image/${path.extname(filename).slice(1)}`; // e.g., image/jpeg
        const imageUrl = `data:${mimeType};base64,${base64Image}`;

        // 2. 准备请求ECNU API的数据
        const ecn_api_key = process.env.ECNU_API_KEY;
        const ecn_api_url = process.env.ECNU_API_URL || 'https://chat.ecnu.edu.cn/open/api/v1/chat/completions';
        
        if (!ecn_api_key) {
            return res.status(500).json({ success: false, error: 'ECNU API Key 未配置' });
        }

        const requestData = {
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的看图描述专家，请用生动的语言描述图片内容。'
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: '请详细描述一下这张图片里的内容。'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            stream: false,
            model: 'ecnu-vl'
        };

        // 3. 发送请求到ECNU API
        const response = await axios.post(ecn_api_url, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ecn_api_key}`
            }
        });

        // 4. 提取并返回描述信息
        const description = response.data.choices[0].message.content;
        const metadata = readMetadata();
        const imageIndex = metadata.images.findIndex(img => img.filename === filename);
        if(imageIndex !== -1) {
            metadata.images[imageIndex].ecnuDescription = description.trim();
            saveMetadata(metadata);
            console.log(`图片 ${filename} 的 ECNU AI 描述已保存。`);
        }else {
            console.warn(`未找到文件名为 ${filename} 的图片元数据，无法保存描述。`);
        }
        res.json({ success: true, description: description.trim() });

    } catch (error) {
        console.error('调用ECNU大模型失败:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: 'AI描述生成失败' });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {  // 修正参数名errAt为err
    console.error('服务器错误:', err.message, err.stack);
    res.status(500).json({
        success: false,
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，端口号：${PORT}`);
});

app.delete('/clear-images', (req, res) => {
    try {
        // 清空 metadata.json 的图片数据
        const metadata = readMetadata();
        metadata.images = [];
        saveMetadata(metadata);

        // 删除 uploads 文件夹中的图片文件
        const imagesDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(imagesDir)) {
            const files = fs.readdirSync(imagesDir);
            files.forEach(file => {
                const filePath = path.join(imagesDir, file);
                if (file !== 'metadata.json') {
                    fs.unlinkSync(filePath); // 删除文件
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('清除图片失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});