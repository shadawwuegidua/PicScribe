document.addEventListener('DOMContentLoaded', async () => {
    const tagFilter = document.getElementById('tagFilter');
    const imageGallery = document.getElementById('imageGallery');
    const noImages = document.getElementById('noImages');
    let images = [];
    let selectedTag = null;

    // 获取图片数据
    async function loadImages() {
        try {
            const response = await fetch('/get-images');
            images = await response.json();
            if (images.length === 0) {
                noImages.classList.remove('hidden');
                return;
            }
            renderTags();
            renderImages();
        } catch (error) {
            console.error('获取图片失败:', error);
            noImages.textContent = '加载图片失败，请稍后重试';
            noImages.classList.remove('hidden');
        }
    }

    // 渲染标签按钮
    function renderTags() {
        const allTags = new Set();
        images.forEach(image => {
            image.aiTags.forEach(tag => allTags.add(tag));
        });
        tagFilter.innerHTML = '';
        const allButton = document.createElement('button');
        allButton.textContent = '全部';
        allButton.className = 'tag';
        allButton.addEventListener('click', () => {
            selectedTag = null;
            document.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
            allButton.classList.add('active');
            renderImages();
        });
        tagFilter.appendChild(allButton);
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.textContent = tag;
            button.className = 'tag ai';
            button.addEventListener('click', () => {
                selectedTag = tag;
                document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderImages();
            });
            tagFilter.appendChild(button);
        });
    }

    // 渲染图片
    function renderImages() {
        imageGallery.innerHTML = '';
        const filteredImages = selectedTag ? images.filter(image => image.aiTags.includes(selectedTag)) : images;
        if (filteredImages.length === 0) {
            noImages.classList.remove('hidden');
            return;
        }
        noImages.classList.add('hidden');
        filteredImages.forEach(image => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-4 rounded shadow';
            card.innerHTML = `
                <img src="${image.path}" alt="${image.aiDescription}" class="w-full h-48 object-cover rounded mb-2">
                <p class="text-sm font-semibold">AI描述: ${image.aiDescription}</p>
                <p class="text-sm">AI标签: ${image.aiTags.join(', ')}</p>
                <p class="text-sm">EXIF信息:</p>
                <ul class="text-sm list-disc pl-5">
                    ${image.exifTags.map(tag => `<li>${tag.name}: ${tag.value}</li>`).join('')}
                </ul>
            `;
            imageGallery.appendChild(card);
        });
    }

    loadImages();
});