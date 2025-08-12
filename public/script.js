 
class ClientSideApp {
    constructor() {
        this.initializeEventListeners();
        this.performanceData = [];
    }

    initializeEventListeners() {
        document.getElementById('getServerInfo').addEventListener('click', () => this.getServerInfo());
        document.getElementById('testGet').addEventListener('click', () => this.testGetRequest());
        document.getElementById('testPost').addEventListener('click', () => this.testPostRequest());
        document.getElementById('testExternal').addEventListener('click', () => this.testExternalAPI());
        document.getElementById('startMonitor').addEventListener('click', () => this.startPerformanceMonitor());
    }

    async makeRequest(url, options = {}) {
        const startTime = performance.now();
        
        try {
            const response = await fetch(url, options);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Log network performance
            this.logPerformance(url, responseTime, response.status);
            
            const data = await response.json();
            return {
                success: response.ok,
                data,
                responseTime,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.logPerformance(url, responseTime, 0, error.message);
            
            return {
                success: false,
                error: error.message,
                responseTime
            };
        }
    }

    async getServerInfo() {
        const display = document.getElementById('serverData');
        display.innerHTML = '<div class="loading"></div>';
        
        const result = await this.makeRequest('/api/server-info');
        
        if (result.success) {
            display.className = 'data-display success';
            display.innerHTML = `
📊 THÔNG TIN SERVER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕒 Timestamp: ${result.data.data.timestamp}
💻 Platform: ${result.data.data.platform}
🏗️  Architecture: ${result.data.data.arch}
🖥️  Hostname: ${result.data.data.hostname}
⏱️  Uptime: ${Math.floor(result.data.data.uptime)} seconds
🟢 Node Version: ${result.data.data.nodeVersion}
🧠 Total Memory: ${(result.data.data.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB
💾 Free Memory: ${(result.data.data.freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB
⚡ CPU Cores: ${result.data.data.cpuCount}
🚀 Response Time: ${result.responseTime.toFixed(2)}ms

📋 HEADERS NHẬN ĐƯỢC:
${JSON.stringify(result.headers, null, 2)}
            `;
        } else {
            display.className = 'data-display error';
            display.innerHTML = `❌ Lỗi: ${result.error}`;
        }
    }

    async testGetRequest() {
        const display = document.getElementById('networkResults');
        display.innerHTML = '<div class="loading"></div>';
        
        const result = await this.makeRequest('/api/server-info');
        
        display.className = result.success ? 'data-display success' : 'data-display error';
        display.innerHTML = `
🔍 GET REQUEST TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: /api/server-info
Status: ${result.status || 'Error'}
Response Time: ${result.responseTime.toFixed(2)}ms
Success: ${result.success ? '✅' : '❌'}

📦 RESPONSE DATA:
${JSON.stringify(result.data || result.error, null, 2)}
        `;
    }

    async testPostRequest() {
        const display = document.getElementById('networkResults');
        display.innerHTML = '<div class="loading"></div>';
        
        const testData = {
            message: 'Hello from client!',
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
        };
        
        const result = await this.makeRequest('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        display.className = result.success ? 'data-display success' : 'data-display error';
        display.innerHTML = `
📤 POST REQUEST TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: /api/test
Method: POST
Status: ${result.status || 'Error'}
Response Time: ${result.responseTime.toFixed(2)}ms
Success: ${result.success ? '✅' : '❌'}

📝 DATA GỬI ĐI:
${JSON.stringify(testData, null, 2)}

📦 RESPONSE NHẬN VỀ:
${JSON.stringify(result.data || result.error, null, 2)}
        `;
    }

    async testExternalAPI() {
        const display = document.getElementById('networkResults');
        display.innerHTML = '<div class="loading"></div>';
        
        // Test với GitHub API
        const result = await this.makeRequest('https://api.github.com/users/intekaih');
        
        display.className = result.success ? 'data-display success' : 'data-display error';
        display.innerHTML = `
🌐 EXTERNAL API TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: https://api.github.com/users/intekaih
Status: ${result.status || 'Error'}
Response Time: ${result.responseTime.toFixed(2)}ms
Success: ${result.success ? '✅' : '❌'}

👤 GITHUB USER INFO:
${result.success ? `
Name: ${result.data.name || 'N/A'}
Login: ${result.data.login}
Public Repos: ${result.data.public_repos}
Followers: ${result.data.followers}
Created: ${result.data.created_at}
` : result.error}
        `;
    }

    logPerformance(url, responseTime, status, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            url,
            responseTime: Math.round(responseTime),
            status,
            error
        };
        
        this.performanceData.push(logEntry);
        
        // Giữ chỉ 50 entries gần nhất
        if (this.performanceData.length > 50) {
            this.performanceData.shift();
        }
    }

    startPerformanceMonitor() {
        const display = document.getElementById('performanceData');
        
        if (this.performanceData.length === 0) {
            display.innerHTML = '⚠️ Chưa có dữ liệu. Hãy thực hiện một số requests trước!';
            return;
        }
        
        const avgResponseTime = this.performanceData.reduce((sum, entry) => 
            sum + entry.responseTime, 0) / this.performanceData.length;
        
        const successCount = this.performanceData.filter(entry => 
            entry.status >= 200 && entry.status < 300).length;
        
        const errorCount = this.performanceData.filter(entry => 
            entry.status >= 400 || entry.error).length;
        
        display.className = 'data-display';
        display.innerHTML = `
📈 PERFORMANCE MONITOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Tổng số requests: ${this.performanceData.length}
⚡ Thời gian phản hồi trung bình: ${avgResponseTime.toFixed(2)}ms
✅ Successful requests: ${successCount}
❌ Failed requests: ${errorCount}
📈 Success rate: ${((successCount / this.performanceData.length) * 100).toFixed(1)}%

🔍 RECENT REQUESTS:
${this.performanceData.slice(-10).map(entry => 
    `${entry.timestamp.split('T')[1].split('.')[0]} | ${entry.url} | ${entry.responseTime}ms | ${entry.status || 'ERROR'}`
).join('\n')}
        `;
    }
}

// Khởi tạo ứng dụng khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClientSideApp();
    console.log('🚀 Client-side application initialized!');
});