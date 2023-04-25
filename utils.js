import User from './models/user.js';
import { v4 as uuid } from 'uuid';
import { config } from 'dotenv';
import nodemailer from 'nodemailer'
import smtpTransport from 'nodemailer-smtp-transport';

config()

function RandomString() {
    let a = uuid().toString();
    let b = uuid().toString();
    a = a.replaceAll('-', String.fromCharCode(97 + parseInt(Math.random() * 10)));
    b = b.replaceAll('-', String.fromCharCode(97 + parseInt(Math.random() * 10)));
    const c = a + b;
    return c;
}

async function SendEmail(mailTo, url, type) {
    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gamil.com',
        port: 587,
        auth: {
            user: process.env.USER,
            pass: process.env.PASS
        }
    }))
    const sub = (type) ? "Ecom Account Email Verification" : "Ecom Account Reset Password";
    const message = (type) ? `To continue creating your new Ecom account, please verify your email account below \n ${url}` : `To reset your Ecom account password, please visit below link \n ${url}`;

    const mailOptions = {
        from: process.env.USER,
        to: mailTo,
        subject: sub,
        text: message
    };

    const a = await transporter.sendMail(mailOptions);
    return (a.rejected.length === 0);// if rejected.length is zero then, this will return true meaning eamil send successfully otherwise false
}

export {
    RandomString,
    SendEmail
}