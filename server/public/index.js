// 创建星星
function createStars() {
    const stars = document.getElementById('stars');
    stars.innerHTML = '';
    const numStars = 200; // 现有星星数量
    const numShootingStars = 5; // 新增流星数量
    
    // 生成常规星星
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 随机位置
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // 随机大小
        const size = Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // 随机闪烁动画持续时间
        star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
        
        stars.appendChild(star);
    }

    // 生成流星
    for (let i = 0; i < numShootingStars; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        // 随机位置，确保流星从屏幕外进入
        shootingStar.style.left = `${Math.random() * 100 + 50}%`; // 从右侧偏外开始
        shootingStar.style.top = `${Math.random() * 50}%`; // 从顶部随机位置开始
        shootingStar.style.setProperty('--duration', `${Math.random() * 2 + 1}s`); // 流星动画持续时间
        shootingStar.style.animationDelay = `${Math.random() * 10}s`; // 随机延迟，错开出现
        stars.appendChild(shootingStar);
    }
}

// 主题切换逻辑
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.textContent = isDark ? '白昼模式' : '黑夜模式';
    
    if (!isDark) {
        createStars();
    } else {
        const starsContainer = document.getElementById('stars');
        starsContainer.innerHTML = ''; // 清除星星背景
    }
});

// 文件上传相关逻辑
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const progressBar = document.querySelector('#progressBar .progress');
const selectButton = document.getElementById('selectButton');

// 拖拽上传处理
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// 文件选择处理
selectButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// 文件处理函数
function handleFiles(files) {
    if (files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            formData.append('images', file);
        }
    });

    // 显示选中的文件数量
    const fileCount = formData.getAll('images').length;
    document.querySelector('.upload-info').textContent = 
        `已选择 ${fileCount} 个文件，点击上传开始处理`;
}

// 上传处理
uploadButton.addEventListener('click', async () => {
    const formData = new FormData();
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请先选择要上传的图片');
        return;
    }

    Array.from(files).forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // 上传成功后跳转到相册页面
                window.location.href = 'gallery.html';
            } else {
                alert('上传失败: ' + result.message);
            }
        } else {
            throw new Error('上传失败');
        }
    } catch (error) {
        console.error('上传出错:', error);
        alert('上传过程中出现错误,请重试');
    }
});

// 进度条更新函数
function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

// 上传进度处理
async function uploadWithProgress(formData) {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            updateProgress(percent);
        }
    });

    return new Promise((resolve, reject) => {
        xhr.open('POST', '/upload');
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.response));
            } else {
                reject(new Error('Upload failed'));
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
}

// 初始化
updateProgress(0);

// 初始化星星
if (document.documentElement.getAttribute('data-theme') === 'dark') {
    createStars();
}

// 获取 "查看相册" 按钮
const goToGalleryButton = document.getElementById('goToGalleryButton');

// 添加点击事件监听器
goToGalleryButton.addEventListener('click', () => {
    window.location.href = 'gallery.html';
});
