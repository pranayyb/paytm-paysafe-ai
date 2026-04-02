const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

const BACKEND_PORT = 8000;
const MOBILE_PORT = 8081;
const APP_PATH = path.join(__dirname, 'App.tsx');

// Generate unique subdomains for this session
const BE_SUBDOMAIN = `paytm-voice-api-${Math.floor(Math.random() * 90000) + 10000}`;
const MO_SUBDOMAIN = `paytm-mobile-${Math.floor(Math.random() * 90000) + 10000}`;

async function killPortSafer(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
            if (!stdout) return resolve();
            const lines = stdout.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 4) {
                    const pid = parts[parts.length - 1];
                    try {
                        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
                    } catch (e) { }
                }
            }
            resolve();
        });
    });
}

(async () => {
    console.log("\n=======================================================");
    console.log("🚀 PAYTM VOICEGUARD - UNIVERSAL NO-NGROK STARTUP ");
    console.log("=======================================================\n");

    console.log(`🧹 Cleaning up ghost processes...`);
    await killPortSafer(MOBILE_PORT);
    await killPortSafer(BACKEND_PORT);
    try { execSync('taskkill /F /IM ngrok.exe /T', { stdio: 'ignore' }); } catch (e) { }

    console.log(`📡 Provisioning Dual-Localtunnels (Global Access Enabled)...`);

    // 1. Backend Tunnel
    console.log(`⏳ Initializing Backend Tunnel...`);
    const beLt = spawn('npx', ['localtunnel', '--port', BACKEND_PORT.toString(), '--subdomain', BE_SUBDOMAIN], { shell: true });

    let beUrl = '';
    beLt.stdout.on('data', (d) => {
        const m = d.toString().match(/https:\/\/[^\s]+/);
        if (m) {
            beUrl = m[0];
            console.log(`✅ Backend API ready at: ${beUrl}`);
            syncAppAndStartExpo();
        }
    });

    let alreadyStarted = false;
    function syncAppAndStartExpo() {
        if (!beUrl || alreadyStarted) return;
        alreadyStarted = true;

        console.log(`🔧 Syncing App.tsx with Global API...`);
        let content = fs.readFileSync(APP_PATH, 'utf8');
        content = content.replace(/const BACKEND_TUNNEL = 'https:\/\/.*';/g, `const BACKEND_TUNNEL = '${beUrl}';`);
        fs.writeFileSync(APP_PATH, content);

        console.log(`📲 Provisioning Mobile Bundle Tunnel (Bypassing Ngrok Bug)...`);

        // Manual Tunnel for Metro Bundler
        const moLt = spawn('npx', ['localtunnel', '--port', MOBILE_PORT.toString(), '--subdomain', MO_SUBDOMAIN], { shell: true });

        moLt.stdout.on('data', (d) => {
            const m = d.toString().match(/https:\/\/[^\s]+/);
            if (m) {
                const moUrl = m[0];
                // LocalTunnel URLs use exp:// protocol for Expo Go
                const expoUrl = moUrl.replace('https://', 'exp://');

                console.log(`✅ Mobile Bundle ready at: ${moUrl}`);
                console.log(`\n📱 SCAN THIS QR CODE IN EXPO GO:\n`);
                qrcode.generate(expoUrl, { small: true });
                console.log(`\nURL: ${expoUrl}\n`);

                console.log(`🏗️ Starting Metro Bundler (Clearing Cache)...`);
                spawn('npx', ['expo', 'start', '--offline', '--clear'], {
                    stdio: 'inherit',
                    shell: true,
                    env: {
                        ...process.env,
                        EXPO_PACKAGER_PROXY_URL: moUrl,
                        REACT_NATIVE_PACKAGER_HOSTNAME: moUrl.replace('https://', '')
                    }
                });
            }
        });
    }

    // Safety timeout
    setTimeout(() => {
        if (!alreadyStarted) {
            console.log("⚠️ Backend tunnel is taking time... Retrying.");
        }
    }, 10000);
})();
