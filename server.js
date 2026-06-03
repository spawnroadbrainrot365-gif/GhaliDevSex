const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let botProcess = null;

app.post('/api/host', async (req, res) => {
    const { code, package } = req.body;
    if (!code || !package) return res.json({ success: false, error: 'الكود أو package.json مفقود' });
    try {
        if (botProcess) { botProcess.kill(); botProcess = null; }
        const botDir = path.join(__dirname, 'temp_bot');
        if (!fs.existsSync(botDir)) fs.mkdirSync(botDir);
        fs.writeFileSync(path.join(botDir, 'index.js'), code);
        fs.writeFileSync(path.join(botDir, 'package.json'), package);
        const installProcess = spawn('npm', ['install'], { cwd: botDir });
        installProcess.on('close', (installCode) => {
            if (installCode !== 0) return res.json({ success: false, error: 'فشل تثبيت الباكدجات' });
            botProcess = spawn('node', ['index.js'], { cwd: botDir });
            botProcess.stdout.on('data', (data) => console.log('Bot:', data.toString()));
            botProcess.stderr.on('data', (data) => console.error('Bot Error:', data.toString()));
            res.json({ success: true });
        });
    } catch (err) { res.json({ success: false, error: err.message }); }
});

app.listen(3000, () => console.log('Server running on port 3000'));
