const express = require('express');
const session = require('express-session');
const multer = require('multer');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات البوت والتليكرام (قم بتعديلها حسب المعطيات)
const BOT_TOKEN = '8220450522:AAGNeQfR955h8sxBeBPKouiqL3AEU5zyUtc'; // الرمز الصحيح بعد تصحيح التكرار
const CHAT_ID = '8262565082';

// إعداد الجلسات لتخزين الملفات لكل مستخدم
app.use(session({
    secret: 'secret-key-for-session',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // اضبط true إذا كنت تستخدم HTTPS
}));

// إعداد multer لاستقبال الملفات (تخزين في الذاكرة)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// خدمة الملفات الثابتة
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// الصفحة الرئيسية (واجهة الكتابة)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الرئيسية - أرسل نصك</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            direction: rtl;
        }
        .container {
            background: rgba(255,255,255,0.95);
            border-radius: 32px;
            padding: 40px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 25px 45px rgba(0,0,0,0.2);
            backdrop-filter: blur(5px);
            text-align: center;
        }
        h1 {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 2rem;
        }
        textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            font-size: 1rem;
            font-family: inherit;
            resize: vertical;
            margin-bottom: 20px;
            transition: 0.3s;
        }
        textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
        }
        button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 40px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            font-weight: bold;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .footer {
            margin-top: 20px;
            color: #718096;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ أرسل رسالتك ✨</h1>
        <textarea id="message" rows="5" placeholder="اكتب أي شيء هنا..."></textarea>
        <button id="submitBtn">🚀 Submit</button>
        <div class="footer">سيتم إرسال النص إلى بوت التليكرام وتحويلك إلى صفحة رفع الملفات</div>
    </div>
    <script>
        document.getElementById('submitBtn').addEventListener('click', async () => {
            const message = document.getElementById('message').value;
            if(!message.trim()) {
                alert('الرجاء كتابة نص أولاً');
                return;
            }
            const btn = document.getElementById('submitBtn');
            btn.textContent = 'جاري الإرسال...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message })
                });
                if(response.ok) {
                    window.location.href = '/home';
                } else {
                    alert('حدث خطأ، حاول مرة أخرى');
                    btn.textContent = '🚀 Submit';
                    btn.disabled = false;
                }
            } catch(err) {
                alert('خطأ في الاتصال');
                btn.textContent = '🚀 Submit';
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
    `);
});

// معالجة إرسال النص إلى التليكرام
app.post('/submit', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).send('لا يوجد نص');
    
    // إرسال النص إلى البوت
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        });
        console.log('تم إرسال النص إلى التليكرام بنجاح');
    } catch (error) {
        console.error('فشل إرسال النص إلى التليكرام:', error.message);
        // لا نوقف التنفيذ، فقط نسجل الخطأ
    }
    
    // حفظ النص في الجلسة اختيارياً (ليس ضرورياً للملفات)
    req.session.lastText = text;
    res.status(200).send('OK');
});

// صفحة رفع الملفات (Home)
app.get('/home', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رفع الملف - هوم</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            direction: rtl;
        }
        .card {
            background: white;
            border-radius: 40px;
            padding: 40px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 20px 35px rgba(0,0,0,0.2);
            text-align: center;
        }
        h2 {
            color: #2d3748;
            margin-bottom: 20px;
        }
        .file-area {
            background: #f7fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 28px;
            padding: 30px;
            margin-bottom: 20px;
            cursor: pointer;
            transition: 0.3s;
        }
        .file-area:hover {
            border-color: #f5576c;
            background: #fff5f7;
        }
        input[type="file"] {
            display: none;
        }
        .custom-file-btn {
            background: #4a5568;
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            cursor: pointer;
            display: inline-block;
            font-size: 0.9rem;
            transition: 0.2s;
        }
        .custom-file-btn:hover {
            background: #2d3748;
        }
        .notification {
            margin-top: 20px;
            padding: 12px;
            border-radius: 50px;
            background: #c6f6d5;
            color: #22543d;
            display: none;
        }
        .reupload-btn {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 40px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 20px;
            display: none;
            font-weight: bold;
        }
        .progress-container {
            margin-top: 20px;
            display: none;
            background: #e2e8f0;
            border-radius: 30px;
            overflow: hidden;
        }
        .progress-bar {
            width: 0%;
            height: 30px;
            background: linear-gradient(90deg, #48bb78, #38a169);
            text-align: center;
            line-height: 30px;
            color: white;
            font-weight: bold;
            transition: width 0.3s;
        }
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            visibility: hidden;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 32px;
            text-align: center;
            max-width: 400px;
            width: 80%;
        }
        .download-btn {
            background: #3182ce;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 30px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 1rem;
        }
        .file-name {
            font-weight: bold;
            margin: 15px 0;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>📁 رفع الملف 📁</h2>
        <div class="file-area" id="fileArea">
            <label for="fileInput" class="custom-file-btn">📂 Select File</label>
            <input type="file" id="fileInput">
            <p style="margin-top: 10px; color:#718096;">اختر ملفاً من جهازك</p>
        </div>
        <div id="notification" class="notification">✅ The file was successfully placed</div>
        <button id="reuploadBtn" class="reupload-btn">🔄 Reupload All</button>
        <div id="progressContainer" class="progress-container">
            <div id="progressBar" class="progress-bar">0%</div>
        </div>
    </div>

    <div id="fileModal" class="modal">
        <div class="modal-content">
            <h3>الملف المرفوع</h3>
            <div id="modalFileName" class="file-name"></div>
            <button id="downloadModalBtn" class="download-btn">⬇️ تحميل الملف</button>
            <button id="closeModalBtn" style="margin-top:10px; background:#ccc;">إغلاق</button>
        </div>
    </div>

    <script>
        const fileInput = document.getElementById('fileInput');
        const notification = document.getElementById('notification');
        const reuploadBtn = document.getElementById('reuploadBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const modal = document.getElementById('fileModal');
        const modalFileName = document.getElementById('modalFileName');
        const downloadModalBtn = document.getElementById('downloadModalBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        
        let currentFileBlob = null; // لحفظ الملف محلياً بعد الرفع
        let currentFileName = '';

        // عند اختيار ملف - رفع تلقائي
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if(!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                if(response.ok) {
                    // إظهار الإشعار
                    notification.style.display = 'block';
                    reuploadBtn.style.display = 'inline-block';
                    // تخزين الملف محلياً لاستخدامه لاحقاً (النسخة الأصلية)
                    currentFileBlob = file;
                    currentFileName = file.name;
                    
                    // اختفاء الإشعار بعد 3 ثواني
                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => notification.style.display = 'none', 500);
                    }, 3000);
                } else {
                    alert('فشل رفع الملف');
                }
            } catch(err) {
                alert('خطأ في الرفع');
            }
        });
        
        // زر Reupload All
        reuploadBtn.addEventListener('click', () => {
            if(!currentFileBlob) {
                alert('لا يوجد ملف مرفوع مسبقاً');
                return;
            }
            // إظهار شريط التقدم وإخفاء الزر مؤقتاً
            reuploadBtn.disabled = true;
            progressContainer.style.display = 'block';
            let percent = 0;
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            
            const interval = setInterval(() => {
                percent += 1;
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
                if(percent >= 100) {
                    clearInterval(interval);
                    // إنهاء التحميل، إظهار النافذة مع الملف
                    progressContainer.style.display = 'none';
                    reuploadBtn.disabled = false;
                    // عرض النافذة مع الملف
                    modalFileName.textContent = currentFileName;
                    modal.style.visibility = 'visible';
                }
            }, 3000); // كل 3 ثواني يزيد 1%
        });
        
        // تحميل الملف من النافذة
        downloadModalBtn.addEventListener('click', () => {
            if(currentFileBlob) {
                const url = URL.createObjectURL(currentFileBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
        
        closeModalBtn.addEventListener('click', () => {
            modal.style.visibility = 'hidden';
        });
        
        // إعادة تعيين الإشعار عند محاولة رفع ملف آخر
        fileInput.addEventListener('click', () => {
            notification.style.display = 'none';
            reuploadBtn.style.display = 'none';
        });
    </script>
</body>
</html>
    `);
});

// استقبال رفع الملف وحفظه في الجلسة
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('لم يتم إرسال ملف');
    }
    // حفظ بيانات الملف في الجلسة
    req.session.fileData = {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype
    };
    res.status(200).send('تم رفع الملف');
});

// نقطة نهاية لاسترجاع الملف (إذا احتجنا لاحقاً)
app.get('/get-file', (req, res) => {
    if (!req.session.fileData) {
        return res.status(404).send('لا يوجد ملف');
    }
    const file = req.session.fileData;
    res.set('Content-Type', file.mimetype);
    res.set('Content-Disposition', `attachment; filename="${file.originalname}"`);
    res.send(file.buffer);
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`الموقع يعمل على http://localhost:${PORT}`);
});
ملف .gitignore (اختياري)
text
node_modules/
.env
كيفية التشغيل
تثبيت العقدات
تأكد من تثبيت Node.js على جهازك، ثم افتح الطرفية (Terminal) داخل مجلد المشروع ونفّذ:

bash
npm install
تشغيل الموقع محلياً

bash
npm start




