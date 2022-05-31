const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({
    host: "mail.toolweb.gr",
    port: 587,
    secure: true,
    auth: {
        user: "info@toolmail.gr",
        pass: "GbJ%68@Rd1*g5f##2Wsd"
    },
});

const getPasswordResetUrl = (user, token) => {
    return `https://bulldog-admin.netlify.app/password/reset/${user._id}/${token}`
};

const usePasswordHashToMakeToken = ({
    password: passwordHash,
    _id: userId,
    date
}) => {
    const secret = passwordHash + "-" + date
    const token = jwt.sign({ userId }, secret, {
        expiresIn: 3600
    })
    return token;
}
const resetPasswordTemplate = (user, url) => {
    const from = "info@toolmail.gr"
    const to = user.email
    const subject = "Password reset"
    const html = `
    <p>Hey ${user.email},</p>
    <p>Please follow this link to reset your password: ${url}</p>
    `

    return { from, to, subject, html }
}

const sendPinTemplate = (email, pin) => {
    const from = "info@toolmail.gr"
    const to = email
    const subject = "Bulldog: Verify your account"
    const html = `
        <p>You have been successfully registered. <br>Visit the following link to connect to the dashboard</p>
        <a href="https://bulldog-admin.netlify.app/">https://bulldog-admin.netlify.app/</a>
        <p>Use the verification code: ${pin}</p>`

    return { from, to, subject, html }
}

module.exports = { transporter, resetPasswordTemplate, getPasswordResetUrl, usePasswordHashToMakeToken, sendPinTemplate };