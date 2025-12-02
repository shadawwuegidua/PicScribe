require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const axios = require('axios');

class AIService {
    constructor() {
        this.accessToken = null;
        this.tokenExpireTime = 0;
    }

    async getAccessToken() {
        const apiKey = process.env.BAIDU_API_KEY;
        const secretKey = process.env.BAIDU_SECRET_KEY;

        // 检查环境变量
        if (!apiKey || !secretKey) {
            console.error('环境变量未正确配置：');
            console.error('BAIDU_API_KEY:', apiKey);
            console.error('BAIDU_SECRET_KEY:', secretKey);
            throw new Error('BAIDU_API_KEY 或 BAIDU_SECRET_KEY 未在 .env 文件中配置');
        }

        console.log('使用的API密钥:', { apiKey, secretKey }); // 调试用

        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

        try {
            const response = await axios.get(url);
            console.log('Token响应:', response.data);
            this.accessToken = response.data.access_token;
            this.tokenExpireTime = Date.now() + 29 * 24 * 60 * 60 * 1000;
            return this.accessToken;
        } catch (error) {
            console.error('获取access token失败:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new Error(`获取access token失败: ${error.message}`);
        }
    }

    async analyzeImage(base64Image) {
        try {
            const token = await this.getAccessToken();

            // 获取标签
            const tagResponse = await axios.post(
                'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general',
                `image=${encodeURIComponent(base64Image)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    params: {
                        access_token: token
                    }
                }
            );

            // 处理并格式化返回结果
            const tags = tagResponse.data.result || [];
            const mainTag = tags[0] || { keyword: '未知', score: 0 };

            // 生成智能描述
            const description = `这可能是${mainTag.keyword}（置信度：${Math.round(mainTag.score * 100)}%）`;

            // 按置信度排序标签
            const sortedTags = tags.sort((a, b) => b.score - a.score);

            return {
                tags: sortedTags,
                description: description,
                mainTag: mainTag,
                confidence: Math.round(mainTag.score * 100)
            };
        } catch (error) {
            console.error('AI分析失败:', error.response?.data || error.message);
            throw new Error(`AI分析失败: ${error.message}`);
        }
    }
}

module.exports = new AIService();