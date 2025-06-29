// backend/mailer.js - УПРОЩЕННАЯ И СТАБИЛЬНАЯ ВЕРСИЯ

const nodemailer = require('nodemailer');

// 1. ЗАПУСТИТЕ СЕРВЕР ОДИН РАЗ С ПУСТЫМИ user И pass.
// 2. СКОПИРУЙТЕ ДАННЫЕ ИЗ КОНСОЛИ И ВСТАВЬТЕ ИХ СЮДА.
// 3. ПЕРЕЗАПУСТИТЕ СЕРВЕР.

let transporter;

async function initializeMailer() {
    // Данные для входа в тестовый почтовый ящик Ethereal
    // Оставьте их пустыми, чтобы сгенерировать новые при первом запуске.
    let authData = {
        user: 'awgq2d3jhxsvikdo@ethereal.email', // Вставьте сюда User из консоли
        pass: 'YV6trmbBKUece1kHb1',            // Вставьте сюда Pass из консоли
    };

    // Если данные не вставлены, создаем новый тестовый аккаунт
    if (!authData.user || !authData.pass) {
        console.log('Данные для Ethereal не найдены, создаем новый тестовый аккаунт...');
        const testAccount = await nodemailer.createTestAccount();
        authData = {
            user: testAccount.user,
            pass: testAccount.pass,
        };
        console.log('--- Ethereal.email Credentials (вставьте их в mailer.js) ---');
        console.log('User:', authData.user);
        console.log('Pass:', authData.pass);
        console.log('-----------------------------------------------------------');
    }

    // Настраиваем "транспорт" - способ отправки письма
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: authData,
    });

    console.log('Mailer инициализирован с пользователем:', authData.user);
}

// Вызываем инициализацию один раз при старте
initializeMailer().catch(console.error);


// Функция для отправки письма верификации
async function sendVerificationEmail(to, token) {
    if (!transporter) {
        throw new Error('Mailer не инициализирован. Проверьте консоль сервера на ошибки.');
    }
    
    const verificationLink = `http://localhost:3000/api/verify-email?token=${token}`;

    const info = await transporter.sendMail({
        from: '"Lime Details" <noreply@limedetails.com>',
        to: to,
        subject: "Подтверждение регистрации на Lime Details",
        html: `
            <h1>Добро пожаловать в Lime Details!</h1>
            <p>Спасибо за регистрацию. Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
            <a href="${verificationLink}" style="padding: 10px 20px; background-color: #4fa690; color: white; text-decoration: none; border-radius: 5px;">
                Подтвердить Email
            </a>
            <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
        `,
    });

    console.log("Сообщение отправлено: %s", info.messageId);
    // Ссылку для просмотра письма в браузере вы увидите в консоли
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

module.exports = { sendVerificationEmail };