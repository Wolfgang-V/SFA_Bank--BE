const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');

// Lazy-load transporter to ensure env vars are loaded
const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODE_MAIL,
            pass: process.env.NODE_PASSWORD
        }
    });
};

// Helper function to render email templates
const renderEmailTemplate = async (templateName, data) => {
    const templatePath = path.join(__dirname, '../views', `${templateName}.ejs`);
    return await ejs.renderFile(templatePath, data);
};

// Main mail sender function
const mailSender = async (email, subject, templateName, data) => {
    try {
        // Check if environment variables are set
        if (!process.env.NODE_MAIL || !process.env.NODE_PASSWORD) {
            console.error("Email configuration missing: NODE_MAIL or NODE_PASSWORD not set in .env");
            return { success: false, message: "Email configuration error" };
        }

        const transporter = getTransporter();
        const htmlContent = await renderEmailTemplate(templateName, data);

        const mailOptions = {
            from: process.env.NODE_MAIL,
            to: email,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, message: 'Email sent successfully', info };
    } catch (error) {
        console.error('Email error:', error.message);
        return { success: false, message: 'Failed to send email', error: error.message };
    }
};

// Export both the transporter and mailSender
module.exports = { getTransporter, mailSender, renderEmailTemplate };
