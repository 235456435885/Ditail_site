// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer'); // Импорт multer
const path = require('path');   // Импорт path для работы с путями
const fs = require('fs');       // Импорт fs для работы с файловой системой
const { sql, poolPromise } = require('./db');
const { sendVerificationEmail } = require('./mailer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- НОВОЕ: Настройка для отдачи статических файлов (аватарок) ---
// Делаем папку 'uploads' публичной по адресу '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- НОВОЕ: Настройка Multer для сохранения файлов ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // Создаем папку, если ее нет
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Папка для сохранения
    },
    filename: function (req, file, cb) {
        // Создаем уникальное имя файла, чтобы избежать конфликтов
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ИЗМЕНЯЕМ ПУТЬ: добавляем :email в конец
app.post('/api/avatar/upload/:email', upload.single('avatar'), async (req, res) => {
    // ИЗМЕНЯЕМ СПОСОБ ПОЛУЧЕНИЯ: берем из req.params
    const { email } = req.params; 
    
    if (!req.file || !email) {
        return res.status(400).json({ message: 'Файл или email не предоставлены.' });
    }
    
    try {
        const filePath = `uploads/${req.file.filename}`;

        const pool = await poolPromise;
        await pool.request()
            .input('AvatarURL', sql.NVarChar, filePath)
            .input('Email', sql.NVarChar, email)
            .query('UPDATE Users SET AvatarURL = @AvatarURL WHERE Email = @Email');
            
        res.status(200).json({ 
            message: 'Аватар успешно загружен!',
            filePath: filePath
        });
    } catch (err) {
        console.error('Ошибка загрузки аватара:', err);
        res.status(500).json({ message: 'Ошибка сервера при загрузке аватара.' });
    }
});


// --- API для Аутентификации ---

// POST /api/register (без изменений)
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны для заполнения.' });
    }
    try {
        const pool = await poolPromise;
        const existingUser = await pool.request().input('Email', sql.NVarChar, email).query('SELECT * FROM Users WHERE Email = @Email');
        if (existingUser.recordset.length > 0) {
            return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000);
        await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.NVarChar, passwordHash)
            .input('VerificationToken', sql.NVarChar, verificationToken)
            .input('TokenExpiry', sql.DateTime, tokenExpiry)
            .query('INSERT INTO Users (Username, Email, PasswordHash, VerificationToken, TokenExpiry) VALUES (@Username, @Email, @PasswordHash, @VerificationToken, @TokenExpiry)');
        await sendVerificationEmail(email, verificationToken);
        res.status(201).json({ message: 'Регистрация прошла успешно! Пожалуйста, проверьте вашу почту для подтверждения аккаунта.' });
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

// POST /api/login - ИЗМЕНЕНО: теперь возвращает и AvatarURL
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email и пароль обязательны.' });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('Email', sql.NVarChar, email).query('SELECT * FROM Users WHERE Email = @Email');
        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные.' });
        }
        if (!user.IsEmailVerified) {
            return res.status(403).json({ message: 'Пожалуйста, подтвердите ваш email перед входом.' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Неверные учетные данные.' });
        }
        res.status(200).json({
            userId: user.UserID,
            username: user.Username,
            email: user.Email,
            avatarUrl: user.AvatarURL // Возвращаем путь к аватару
        });
    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

// GET /api/verify-email (без изменений)
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('<h1>Ошибка верификации</h1><p>Токен не предоставлен.</p>');
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('VerificationToken', sql.NVarChar, token).query('SELECT * FROM Users WHERE VerificationToken = @VerificationToken AND TokenExpiry > GETUTCDATE()');
        const user = result.recordset[0];
        if (!user) {
            return res.status(400).send('<h1>Ошибка верификации</h1><p>Неверный или просроченный токен.</p>');
        }
        await pool.request().input('UserID', sql.Int, user.UserID).query('UPDATE Users SET IsEmailVerified = 1, VerificationToken = NULL, TokenExpiry = NULL WHERE UserID = @UserID');
        res.send('<h1>Email успешно подтвержден!</h1><p>Теперь вы можете закрыть эту вкладку и войти в свой аккаунт на сайте.</p>');
    } catch (err) {
        console.error('Ошибка верификации:', err);
        res.status(500).send('<h1>Ошибка сервера</h1><p>Не удалось завершить верификацию. Попробуйте позже.</p>');
    }
});

// ... (весь ваш код для /api/orders/... без изменений) ...
app.get('/api/orders', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    o.OrderID as id, 
                    o.OrderDate as date, 
                    o.Status as status,
                    o.Total as total,
                    (
                        SELECT 
                            oi.ProductName as name,
                            oi.Quantity as quantity,
                            oi.Price as price,
                            oi.ImageURL as img
                        FROM OrderItems oi
                        WHERE oi.OrderID = o.OrderID
                        FOR JSON PATH
                    ) as items
                FROM Orders o
                WHERE o.IsHidden = 0
                ORDER BY
                    CASE o.Status
                        WHEN 'processing' THEN 1
                        WHEN 'shipped'    THEN 2
                        WHEN 'delivered'  THEN 3
                        WHEN 'cancelled'  THEN 4
                        ELSE 5
                    END ASC,
                    o.OrderDate DESC
                FOR JSON PATH, ROOT('orders')
            `);
        
        const record = result.recordset[0] ? result.recordset[0][Object.keys(result.recordset[0])[0]] : null;
        const orders = record ? JSON.parse(record).orders : [];
        res.json(orders || []);

    } catch (err) {
        console.error("Ошибка в /api/orders:", err);
        res.status(500).send(err.message);
    }
});
app.post('/api/orders/:id/repeat', async (req, res) => {
    try {
        const pool = await poolPromise;
        const originalOrderId = req.params.id;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const originalOrderRequest = new sql.Request(transaction);
        const originalOrder = await originalOrderRequest
            .input('OrderID', sql.Int, originalOrderId)
            .query('SELECT * FROM Orders WHERE OrderID = @OrderID');

        if (originalOrder.recordset.length === 0) {
             await transaction.rollback();
             return res.status(404).send('Original order not found');
        }
        
        const newOrderRequest = new sql.Request(transaction);
        const newOrderResult = await newOrderRequest
            .input('Total', sql.Decimal(10, 2), originalOrder.recordset[0].Total)
            .query('INSERT INTO Orders (UserID, Status, Total) OUTPUT INSERTED.OrderID VALUES (1, \'processing\', @Total)');
        const newOrderId = newOrderResult.recordset[0].OrderID;
        const itemsRequest = new sql.Request(transaction);
        await itemsRequest
            .input('NewOrderID', sql.Int, newOrderId)
            .input('OldOrderID', sql.Int, originalOrderId)
            .query('INSERT INTO OrderItems (OrderID, ProductName, Quantity, Price, ImageURL) SELECT @NewOrderID, ProductName, Quantity, Price, ImageURL FROM OrderItems WHERE OrderID = @OldOrderID');
        
        await transaction.commit();
        res.status(201).json({ message: 'Order repeated successfully', newOrderId: newOrderId });

    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('OrderID', sql.Int, req.params.id)
            .query('UPDATE Orders SET Status = \'cancelled\' WHERE OrderID = @OrderID');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Order not found');
        }
        res.status(200).send('Order cancelled');
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.put('/api/orders/:id/hide', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('OrderID', sql.Int, req.params.id)
            .query('UPDATE Orders SET IsHidden = 1 WHERE OrderID = @OrderID');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Order not found');
        }
        res.status(200).send('Order hidden successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});