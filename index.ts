import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as bcrypt from 'bcryptjs';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/*', cors());

// HTML Template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام تسجيل الدخول</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            width: 100%;
            max-width: 400px;
            position: relative;
        }
        
        .form-container {
            padding: 40px;
        }
        
        h2 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 28px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
            background: #fafafa;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
        }
        
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 10px;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .toggle-form {
            text-align: center;
            margin-top: 20px;
            color: #666;
        }
        
        .toggle-form a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
        }
        
        .message {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .welcome-container {
            text-align: center;
            padding: 40px;
        }
        
        .welcome-container h1 {
            color: #667eea;
            margin-bottom: 20px;
        }
        
        .welcome-container p {
            color: #666;
            font-size: 18px;
            margin-bottom: 30px;
        }
        
        .logout-btn {
            background: #dc3545;
            padding: 10px 30px;
            width: auto;
            display: inline-block;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="authForms">
            <!-- Login Form -->
            <div id="loginForm" class="form-container">
                <h2>تسجيل الدخول</h2>
                <div id="loginMessage"></div>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="loginEmail">البريد الإلكتروني</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">كلمة المرور</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit">دخول</button>
                    <div class="loading" id="loginLoading">جاري تسجيل الدخول...</div>
                </form>
                <div class="toggle-form">
                    ليس لديك حساب؟ <a onclick="toggleForms()">سجل الآن</a>
                </div>
            </div>
            
            <!-- Signup Form -->
            <div id="signupForm" class="form-container" style="display: none;">
                <h2>إنشاء حساب جديد</h2>
                <div id="signupMessage"></div>
                <form onsubmit="handleSignup(event)">
                    <div class="form-group">
                        <label for="signupEmail">البريد الإلكتروني</label>
                        <input type="email" id="signupEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">كلمة المرور</label>
                        <input type="password" id="signupPassword" required minlength="6">
                    </div>
                    <button type="submit">تسجيل</button>
                    <div class="loading" id="signupLoading">جاري إنشاء الحساب...</div>
                </form>
                <div class="toggle-form">
                    لديك حساب بالفعل؟ <a onclick="toggleForms()">سجل دخول</a>
                </div>
            </div>
        </div>
        
        <!-- Welcome Screen -->
        <div id="welcomeScreen" class="welcome-container" style="display: none;">
            <h1>مرحباً بك!</h1>
            <p id="userEmail"></p>
            <button class="logout-btn" onclick="logout()">تسجيل خروج</button>
        </div>
    </div>
    
    <script>
        // Check if user is logged in
        const currentUser = localStorage.getItem('userEmail');
        if (currentUser) {
            showWelcomeScreen(currentUser);
        }
        
        function toggleForms() {
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            
            if (loginForm.style.display === 'none') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            }
        }
        
        async function handleLogin(event) {
            event.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const messageDiv = document.getElementById('loginMessage');
            const loadingDiv = document.getElementById('loginLoading');
            
            loadingDiv.style.display = 'block';
            messageDiv.innerHTML = '';
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                loadingDiv.style.display = 'none';
                
                if (data.success) {
                    messageDiv.innerHTML = '<div class="message success">تم تسجيل الدخول بنجاح!</div>';
                    localStorage.setItem('userEmail', email);
                    setTimeout(() => showWelcomeScreen(email), 1000);
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + data.message + '</div>';
                }
            } catch (error) {
                loadingDiv.style.display = 'none';
                messageDiv.innerHTML = '<div class="message error">حدث خطأ في الاتصال بالخادم</div>';
            }
        }
        
        async function handleSignup(event) {
            event.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const messageDiv = document.getElementById('signupMessage');
            const loadingDiv = document.getElementById('signupLoading');
            
            loadingDiv.style.display = 'block';
            messageDiv.innerHTML = '';
            
            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                loadingDiv.style.display = 'none';
                
                if (data.success) {
                    messageDiv.innerHTML = '<div class="message success">تم إنشاء الحساب بنجاح!</div>';
                    localStorage.setItem('userEmail', email);
                    setTimeout(() => showWelcomeScreen(email), 1000);
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + data.message + '</div>';
                }
            } catch (error) {
                loadingDiv.style.display = 'none';
                messageDiv.innerHTML = '<div class="message error">حدث خطأ في الاتصال بالخادم</div>';
            }
        }
        
        function showWelcomeScreen(email) {
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('welcomeScreen').style.display = 'block';
            document.getElementById('userEmail').textContent = email;
        }
        
        function logout() {
            localStorage.removeItem('userEmail');
            document.getElementById('authForms').style.display = 'block';
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('signupForm').style.display = 'none';
            
            // Clear form fields
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            
            // Clear messages
            document.getElementById('loginMessage').innerHTML = '';
            document.getElementById('signupMessage').innerHTML = '';
        }
    </script>
</body>
</html>
`;

// Initialize database
async function initDB(db: D1Database) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes
app.get('/', (c) => {
  return c.html(htmlTemplate);
});

app.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Validate input
    if (!email || !password) {
      return c.json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }
    
    if (password.length < 6) {
      return c.json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }
    
    // Initialize DB
    await initDB(c.env.DB);
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    await c.env.DB.prepare(
      'INSERT INTO users (email, password) VALUES (?, ?)'
    ).bind(email, hashedPassword).run();
    
    return c.json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ success: false, message: 'حدث خطأ في إنشاء الحساب' });
  }
});

app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Validate input
    if (!email || !password) {
      return c.json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }
    
    // Initialize DB
    await initDB(c.env.DB);
    
    // Get user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password as string);
    
    if (!isValid) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    
    return c.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'حدث خطأ في تسجيل الدخول' });
  }
});

app.get('/users', async (c) => {
  try {
    // Initialize DB
    await initDB(c.env.DB);
    
    // Get all users (excluding passwords)
    const users = await c.env.DB.prepare(
      'SELECT id, email, created_at FROM users'
    ).all();
    
    return c.json({ success: true, users: users.results });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ success: false, message: 'حدث خطأ في جلب المستخدمين' });
  }
});

export default app;