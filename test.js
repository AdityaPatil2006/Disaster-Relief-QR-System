const http = require('http');

function makeRequest(options, payload) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

(async () => {
    try {
        const loginOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        const loginRes = await makeRequest(loginOptions, JSON.stringify({ username: 'admin', password: 'admin123' }));
        const loginData = JSON.parse(loginRes.data);
        console.log("Logged in:", !!loginData.token);

        const analyticsOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/audit/analytics',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + loginData.token }
        };
        const analyticsRes = await makeRequest(analyticsOptions);
        console.log("Analytics HTTP Status:", analyticsRes.status);
        console.log("Analytics Response:", analyticsRes.data);
    } catch (e) {
        console.error("Test Error:", e);
    }
})();
