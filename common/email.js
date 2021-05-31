require('dotenv').config()
const nodemailer = require('nodemailer');
const request = require("request");
const db = require('../common/db');

function send_mails(to_mail, subj, htmlBody) {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'zarvis1287@gmail.com',
            pass: 'rj14bd1287'
        }
    });

    let mailOptions = {
        from: 'zarvis1287@gmail.com',
        to: to_mail,
        subject: subj,
        text: htmlBody
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
                db.query("INSERT INTO `email` (`to_mail`, `subj`, `htmlBody`, `status`) VALUES ('" + to_mail.toString() + "', '" + subj.toString() + "', '" + htmlBody.toString() + "', 'not send')");
                resolve(false);
            } else {
                db.query("INSERT INTO `email` (`to_mail`, `subj`, `htmlBody`, `status`) VALUES ('" + to_mail.toString() + "', '" + subj.toString() + "', '" + htmlBody.toString() + "', 'sent')");
                resolve(true);
            }
        });
    });
}


exports.otp_gen = async(email, otp, name, msg, tx_id) => {
    if (email != '' && otp != '') {
        let htmlContent = "<p>Dear " + name + ",</p><p>This email is sent you for the perpose to verify that this is you who doing action on our system.</p>";
        if (msg != '') htmlContent = htmlContent + "<p>" + msg + "</p>";
        if (tx_id != '') htmlContent = htmlContent + "<h3> Transaction ID : " + tx_id + "</h3>";
        htmlContent = htmlContent + "<br><p>Please contect us if not you or verify below OTP.</p><h1>" + otp + "</h1><br><p>Regards,<br>" + process.env.company_name + " Team<br>" + process.env.mail_from + "</p>";
        let send_mail_result = await send_mails(email, "One Time Password", htmlContent);
        console.log(send_mail_result);
        return send_mail_result;
    } else {
        return false;
    }
};

exports.otp_verifyed = async(email, name, msg, tx_id) => {
    if (email != '') {
        let htmlContent = "<p>Dear " + name + ",</p><p>This email is sent you for the perpose to notify you that an OTP is verifyed.</p>";
        if (msg != '') htmlContent = htmlContent + "<p>" + msg + "</p>";
        if (tx_id != '') htmlContent = htmlContent + "<h3> Transaction ID : " + tx_id + "</h3>";
        htmlContent = htmlContent + "<br><p>Please contect us if not you.</p><br><p>Regards,<br>" + process.env.company_name + " Team<br>" + process.env.mail_from + "</p>";
        return await send_mails(email, "One Time Password Verifyed", htmlContent);
    } else {
        return false;
    }
};