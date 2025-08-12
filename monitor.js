const HTTPClient = require('./client.js');
const fs = require('fs').promises;
const path = require('path');

class NetworkMonitor {
    constructor() {
        this.client = new HTTPClient();
        this.monitorData = [];
        this.isMonitoring = false;
        this.monitorInterval = null;
    }

    /**
     * Thực hiện request và thu thập metrics
     */
    async performRequest(url, options = {}) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        try {
            const response = await this.client.request(url, options);
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const metrics = {
                timestamp: new Date().toISOString(),
                url,
                method: options.method || 'GET',
                statusCode: response.statusCode,
                responseTime: Number(endTime - startTime) / 1000000, // Convert to ms
                contentLength: response.rawData ? response.rawData.length : 0,
                memoryUsage: {
                    before: startMemory,
                    after: endMemory,
                    difference: {
                        rss: endMemory.rss - startMemory.rss,
                        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                        external: endMemory.external - startMemory.external
                    }
                },
                headers: response.headers,
                success: true
            };
            
            this.monitorData.push(metrics);
            this.logMetrics(metrics);
            
            return response;
            
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const metrics = {
                timestamp: new Date().toISOString(),
                url,
                method: options.method || 'GET',
                statusCode: 0,
                responseTime: Number(endTime - startTime) / 1000000,
                contentLength: 0,
                memoryUsage: {
                    before: startMemory,
                    after: endMemory,
                    difference: {
                        rss: endMemory.rss - startMemory.rss,
                        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                        external: endMemory.external - startMemory.external
                    }
                },
                error: error.message,
                success: false
            };
            
            this.monitorData.push(metrics);
            this.logMetrics(metrics);
            
            throw error;
        }
    }

    /**
     * Log metrics to console
     */
    logMetrics(metrics) {
        const icon = metrics.success ? '✅' : '❌';
        const status = metrics.success ? metrics.statusCode : 'ERROR';
        
        console.log(`${icon} [${metrics.method}] ${metrics.url}`);
        console.log(`   Status: ${status} | Time: ${metrics.responseTime.toFixed(2)}ms | Size: ${metrics.contentLength} bytes`);
        
        if (metrics.error) {
            console.log(`   Error: ${metrics.error}`);
        }
        
        // Memory usage (chỉ log nếu có thay đổi đáng kể)
        if (Math.abs(metrics.memoryUsage.difference.heapUsed) > 1024 * 1024) { // > 1MB
            console.log(`   Memory: ${(metrics.memoryUsage.difference.heapUsed / 1024 / 1024).toFixed(2)}MB heap change`);
        }
    }

    /**
     * Bắt đầu monitoring tự động
     */
    startMonitoring(urls = [], interval = 10000) {
        if (this.isMonitoring) {
            console.log('⚠️  Monitor đã đang chạy!');
            return;
        }
        
        const defaultUrls = [
            'http://localhost:3000/api/server-info',
            'https://api.github.com/users/intekaih',
            'https://httpbin.org/get'
        ];
        
        const targetUrls = urls.length > 0 ? urls : defaultUrls;
        
        console.log('🔍 Bắt đầu monitoring...');
        console.log('📋 URLs:', targetUrls);
        console.log('⏱️  Interval:', interval + 'ms');
        
        this.isMonitoring = true;
        let urlIndex = 0;
        
        this.monitorInterval = setInterval(async () => {
            const url = targetUrls[urlIndex % targetUrls.length];
            
            try {
                await this.performRequest(url);
            } catch (error) {
                // Error đã được log trong performRequest
            }
            
            urlIndex++;
        }, interval);
    }

    /**
     * Dừng monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️  Monitor không đang chạy!');
            return;
        }
        
        clearInterval(this.monitorInterval);
        this.isMonitoring = false;
        console.log('🛑 Đã dừng monitoring');
    }

    /**
     * Phân tích dữ liệu đã thu thập
     */
    analyzeData() {
        if (this.monitorData.length === 0) {
            console.log('⚠️  Không có dữ liệu để phân tích!');
            return null;
        }
        
        const successfulRequests = this.monitorData.filter(d => d.success);
        const failedRequests = this.monitorData.filter(d => !d.success);
        
        const analysis = {
            summary: {
                totalRequests: this.monitorData.length,
                successfulRequests: successfulRequests.length,
                failedRequests: failedRequests.length,
                successRate: (successfulRequests.length / this.monitorData.length * 100).toFixed(2)
            },
            performance: {
                avgResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                medianResponseTime: 0
            },
            traffic: {
                totalDataTransferred: 0,
                avgRequestSize: 0
            },
            endpoints: {}
        };
        
        if (successfulRequests.length > 0) {
            const responseTimes = successfulRequests.map(r => r.responseTime);
            responseTimes.sort((a, b) => a - b);
            
            analysis.performance.avgResponseTime = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);
            analysis.performance.minResponseTime = responseTimes[0].toFixed(2);
            analysis.performance.maxResponseTime = responseTimes[responseTimes.length - 1].toFixed(2);
            analysis.performance.medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)].toFixed(2);
            
            analysis.traffic.totalDataTransferred = successfulRequests.reduce((sum, r) => sum + r.contentLength, 0);
            analysis.traffic.avgRequestSize = (analysis.traffic.totalDataTransferred / successfulRequests.length).toFixed(2);
        }
        
        // Phân tích theo endpoint
        this.monitorData.forEach(request => {
            const endpoint = request.url;
            if (!analysis.endpoints[endpoint]) {
                analysis.endpoints[endpoint] = {
                    requests: 0,
                    successful: 0,
                    failed: 0,
                    avgResponseTime: 0,
                    totalData: 0
                };
            }
            
            analysis.endpoints[endpoint].requests++;
            if (request.success) {
                analysis.endpoints[endpoint].successful++;
                analysis.endpoints[endpoint].totalData += request.contentLength;
            } else {
                analysis.endpoints[endpoint].failed++;
            }
        });
        
        // Tính toán avg response time cho mỗi endpoint
        Object.keys(analysis.endpoints).forEach(endpoint => {
            const endpointRequests = this.monitorData.filter(r => r.url === endpoint && r.success);
            if (endpointRequests.length > 0) {
                analysis.endpoints[endpoint].avgResponseTime = 
                    (endpointRequests.reduce((sum, r) => sum + r.responseTime, 0) / endpointRequests.length).toFixed(2);
            }
        });
        
        return analysis;
    }

    /**
     * In báo cáo phân tích
     */
    printAnalysisReport() {
        const analysis = this.analyzeData();
        if (!analysis) return;
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 BÁO CÁO PHÂN TÍCH NETWORK TRAFFIC');
        console.log('='.repeat(80));
        
        console.log('\n📋 TỔNG QUAN:');
        console.log(`   • Tổng số requests: ${analysis.summary.totalRequests}`);
        console.log(`   • Thành công: ${analysis.summary.successfulRequests} requests`);
        console.log(`   • Thất bại: ${analysis.summary.failedRequests} requests`);
        console.log(`   • Tỷ lệ thành công: ${analysis.summary.successRate}%`);
        
        console.log('\n⚡ HIỆU SUẤT:');
        console.log(`   • Thời gian phản hồi trung bình: ${analysis.performance.avgResponseTime}ms`);
        console.log(`   • Thời gian phản hồi nhanh nhất: ${analysis.performance.minResponseTime}ms`);
        console.log(`   • Thời gian phản hồi chậm nhất: ${analysis.performance.maxResponseTime}ms`);
        console.log(`   • Thời gian phản hồi median: ${analysis.performance.medianResponseTime}ms`);
        
        console.log('\n📈 TRAFFIC:');
        console.log(`   • Tổng dữ liệu tải về: ${(analysis.traffic.totalDataTransferred / 1024).toFixed(2)} KB`);
        console.log(`   • Kích thước request trung bình: ${analysis.traffic.avgRequestSize} bytes`);
        
        console.log('\n🔗 PHÂN TÍCH THEO ENDPOINT:');
        Object.entries(analysis.endpoints).forEach(([endpoint, stats]) => {
            console.log(`   📍 ${endpoint}:`);
            console.log(`      • Requests: ${stats.requests} (✅${stats.successful} / ❌${stats.failed})`);
            console.log(`      • Avg response time: ${stats.avgResponseTime}ms`);
            console.log(`      • Total data: ${(stats.totalData / 1024).toFixed(2)} KB`);
        });
        
        console.log('\n' + '='.repeat(80));
    }

    /**
     * Xuất dữ liệu ra file JSON
     */
    async exportData(filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `network-monitor-${timestamp}.json`;
        const exportFilename = filename || defaultFilename;
        
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalRequests: this.monitorData.length,
                monitoringDuration: this.monitorData.length > 0 ? 
                    new Date(this.monitorData[this.monitorData.length - 1].timestamp) - 
                    new Date(this.monitorData[0].timestamp) : 0
            },
            analysis: this.analyzeData(),
            rawData: this.monitorData
        };
        
        try {
            await fs.writeFile(exportFilename, JSON.stringify(exportData, null, 2));
            console.log(`📁 Đã xuất dữ liệu ra file: ${exportFilename}`);
        } catch (error) {
            console.error('❌ Lỗi khi xuất file:', error.message);
        }
    }
}

// Demo monitoring
async function runMonitorDemo() {
    const monitor = new NetworkMonitor();
    
    console.log('🚀 Demo Network Monitor');
    console.log('='.repeat(50));
    
    // Test một số requests
    console.log('\n1️⃣ Thực hiện một số test requests...');
    
    const testUrls = [
        'http://localhost:3000/api/server-info',
        'https://api.github.com/users/intekaih',
        'https://jsonplaceholder.typicode.com/posts/1',
        'http://localhost:9999/nonexistent' // URL lỗi
    ];
    
    for (const url of testUrls) {
        try {
            await monitor.performRequest(url);
        } catch (error) {
            // Errors are already logged
        }
        
        // Chờ một chút giữa các requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n2️⃣ Phân tích dữ liệu...');
    monitor.printAnalysisReport();
    
    console.log('\n3️⃣ Xuất dữ liệu...');
    await monitor.exportData();
    
    console.log('\n4️⃣ Demo monitoring tự động (10 giây)...');
    monitor.startMonitoring(['http://localhost:3000/api/server-info'], 2000);
    
    // Chạy monitoring trong 10 giây
    setTimeout(() => {
        monitor.stopMonitoring();
        console.log('\n5️⃣ Báo cáo cuối cùng:');
        monitor.printAnalysisReport();
    }, 10000);
}

module.exports = NetworkMonitor;

// Chạy demo nếu file được execute trực tiếp
if (require.main === module) {
    runMonitorDemo().catch(console.error);
}