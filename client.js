const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

class HTTPClient {
    constructor() {
        this.defaultTimeout = 5000;
        this.userAgent = 'Lab01-HTTPClient/1.0';
    }

    /**
     * Thực hiện HTTP request
     * @param {string} requestUrl - URL để request
     * @param {Object} options - Các tùy chọn request
     * @returns {Promise} Promise resolve với response data
     */
    async request(requestUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            // Parse URL
            const parsedUrl = url.parse(requestUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;
            
            // Chuẩn bị options cho request
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.path,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json, text/plain, */*',
                    ...options.headers
                },
                timeout: options.timeout || this.defaultTimeout
            };

            // Nếu có data để gửi
            if (options.data) {
                const postData = typeof options.data === 'string' 
                    ? options.data 
                    : JSON.stringify(options.data);
                
                requestOptions.headers['Content-Type'] = 
                    requestOptions.headers['Content-Type'] || 'application/json';
                requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            console.log(`🚀 [${requestOptions.method}] ${requestUrl}`);
            console.log(`📋 Headers:`, requestOptions.headers);

            // Tạo request
            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                console.log(`📡 Status: ${res.statusCode} ${res.statusMessage}`);
                console.log(`📋 Response Headers:`, res.headers);

                // Collect data
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // Request hoàn thành
                res.on('end', () => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    let parsedData;
                    try {
                        parsedData = JSON.parse(data);
                    } catch (e) {
                        parsedData = data;
                    }

                    const response = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: parsedData,
                        responseTime,
                        rawData: data
                    };

                    console.log(`⏱️  Response time: ${responseTime}ms`);
                    console.log(`📦 Response size: ${data.length} bytes`);
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            // Xử lý lỗi request
            req.on('error', (error) => {
                console.error(`❌ Request error:`, error.message);
                reject(error);
            });

            // Xử lý timeout
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${requestOptions.timeout}ms`));
            });

            // Gửi data nếu có
            if (options.data) {
                const postData = typeof options.data === 'string' 
                    ? options.data 
                    : JSON.stringify(options.data);
                req.write(postData);
            }

            // Kết thúc request
            req.end();
        });
    }

    /**
     * GET request
     */
    async get(url, headers = {}) {
        return this.request(url, { method: 'GET', headers });
    }

    /**
     * POST request
     */
    async post(url, data, headers = {}) {
        return this.request(url, { method: 'POST', data, headers });
    }

    /**
     * PUT request
     */
    async put(url, data, headers = {}) {
        return this.request(url, { method: 'PUT', data, headers });
    }

    /**
     * DELETE request
     */
    async delete(url, headers = {}) {
        return this.request(url, { method: 'DELETE', headers });
    }
}

// Test functions
async function runClientTests() {
    const client = new HTTPClient();
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 BẮT ĐẦU TEST HTTP CLIENT');
    console.log('='.repeat(60));

    // Test 1: GET request to local server
    try {
        console.log('\n📍 TEST 1: GET request tới server cục bộ');
        console.log('-'.repeat(40));
        
        const localResponse = await client.get('http://localhost:3000/api/server-info');
        console.log('✅ Local server test thành công!');
        console.log('📊 Server uptime:', localResponse.data.data.uptime + 's');
        
    } catch (error) {
        console.log('❌ Local server test thất bại:', error.message);
        console.log('💡 Hãy đảm bảo server đang chạy trên port 3000');
    }

    // Test 2: GET request to external API (GitHub)
    try {
        console.log('\n📍 TEST 2: GET request tới GitHub API');
        console.log('-'.repeat(40));
        
        const githubResponse = await client.get('https://api.github.com/users/intekaih');
        console.log('✅ GitHub API test thành công!');
        console.log('👤 User:', githubResponse.data.login);
        console.log('📊 Public repos:', githubResponse.data.public_repos);
        console.log('👥 Followers:', githubResponse.data.followers);
        
    } catch (error) {
        console.log('❌ GitHub API test thất bại:', error.message);
    }

    // Test 3: POST request to JSONPlaceholder
    try {
        console.log('\n📍 TEST 3: POST request tới JSONPlaceholder');
        console.log('-'.repeat(40));
        
        const postData = {
            title: 'Lab 01 Test Post',
            body: 'Đây là bài test từ HTTP Client của Lab 01',
            userId: 1,
            timestamp: new Date().toISOString()
        };
        
        const postResponse = await client.post(
            'https://jsonplaceholder.typicode.com/posts', 
            postData
        );
        
        console.log('✅ POST test thành công!');
        console.log('📝 Created post ID:', postResponse.data.id);
        console.log('📋 Title:', postResponse.data.title);
        
    } catch (error) {
        console.log('❌ POST test thất bại:', error.message);
    }

    // Test 4: POST request to local server
    try {
        console.log('\n📍 TEST 4: POST request tới server cục bộ');
        console.log('-'.repeat(40));
        
        const localPostData = {
            message: 'Hello from HTTP Client!',
            clientInfo: {
                timestamp: new Date().toISOString(),
                testType: 'HTTP Client Test',
                nodeVersion: process.version
            }
        };
        
        const localPostResponse = await client.post(
            'http://localhost:3000/api/test',
            localPostData
        );
        
        console.log('✅ Local POST test thành công!');
        console.log('📨 Server response:', localPostResponse.data.message);
        
    } catch (error) {
        console.log('❌ Local POST test thất bại:', error.message);
        console.log('💡 Hãy đảm bảo server đang chạy trên port 3000');
    }

    // Test 5: Xử lý lỗi - server không khả dụng
    try {
        console.log('\n📍 TEST 5: Test xử lý lỗi (server không tồn tại)');
        console.log('-'.repeat(40));
        
        await client.get('http://localhost:9999/nonexistent');
        
    } catch (error) {
        console.log('✅ Error handling test thành công!');
        console.log('❌ Lỗi như mong đợi:', error.message);
    }

    // Test 6: Test timeout
    try {
        console.log('\n📍 TEST 6: Test timeout');
        console.log('-'.repeat(40));
        
        const timeoutClient = new HTTPClient();
        timeoutClient.defaultTimeout = 1; // 1ms - rất ngắn để test timeout
        
        await timeoutClient.get('https://httpbin.org/delay/5');
        
    } catch (error) {
        console.log('✅ Timeout test thành công!');
        console.log('⏰ Timeout error như mong đợi:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 HOÀN THÀNH TẤT CẢ TESTS');
    console.log('='.repeat(60));
}

// Export class và chạy tests
module.exports = HTTPClient;

// Chạy tests nếu file được execute trực tiếp
if (require.main === module) {
    runClientTests().catch(console.error);
}