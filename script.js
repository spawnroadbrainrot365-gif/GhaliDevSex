async function hostBot() {
    const btn = document.getElementById('hostBtn');
    const statusDiv = document.getElementById('status');
    const jsCode = document.getElementById('jsCode').value.trim();
    const packageJson = document.getElementById('packageJson').value.trim();
    
    if (!jsCode || !packageJson) {
        statusDiv.textContent = 'يرجى ملء جميع الحقول';
        statusDiv.className = 'status-error';
        return;
    }
    
    try {
        JSON.parse(packageJson);
    } catch (e) {
        statusDiv.textContent = 'صيغة package.json غير صحيحة';
        statusDiv.className = 'status-error';
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = 'جاري الاستضافة...';
    statusDiv.textContent = 'جاري تجهيز البوت وتشغيله...';
    statusDiv.className = 'status-loading';
    
    try {
        const response = await fetch('/api/host', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: jsCode, package: packageJson })
        });
        const data = await response.json();
        
        if (data.success) {
            statusDiv.textContent = '✅ تم تشغيل البوت بنجاح!';
            statusDiv.className = 'status-success';
        } else {
            statusDiv.textContent = '❌ فشل: ' + data.error;
            statusDiv.className = 'status-error';
        }
    } catch (err) {
        statusDiv.textContent = '❌ خطأ في الاتصال';
        statusDiv.className = 'status-error';
    }
    
    btn.disabled = false;
    btn.innerHTML = '⚡ Host Bot';
}
