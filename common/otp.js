const db = require('./db');
const send_email = require('./email');
const sha256 = require('sha256');

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx___________________________EMAIL__________________________________xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx// 

exports.email_otp_gen = async(data) => {
    try {
        if (data != "" && data != null) {
            let user_id = '';
            let email = '';
            let tx_id = '';
            let msg = '';
            let name = '';
            let type = '';
            if (data['user_id'] != '' && data['user_id'] != null) user_id = data['user_id'];
            if (data['email'] != '' && data['email'] != null) email = data['email'];
            if (data['tx_id'] != '' && data['tx_id'] != null) tx_id = data['tx_id'];
            if (data['msg'] != '' && data['msg'] != null) msg = data['msg'];
            if (data['type'] != '' && data['type'] != null) type = data['type'];
            if (data['name'] != '' && data['name'] != null) name = data['name'];
            if (user_id != '' || email != '') {
                let otp = Math.floor(Math.random() * 8999) + 1000;
                if (user_id != '') {
                    let user = await db.query("SELECT * FROM `users` WHERE `id` = " + db.pool.escape(user_id));
                    if (user.length) {
                        if (email == '') email = user[0].email;
                        name = user[0].first_name;
                    }
                } else {
                    if (name == "") {
                        name = email;
                    }
                    user_id = 0;
                }
                await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + email + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                let insert_otp = await db.query("INSERT INTO `otp` (`user_id`, `sent_to`, `tx_id`, `otp`, `otp_status`, `msg`, `action_type`,`through`) VALUES ('" + user_id + "', '" + email + "', '" + tx_id + "', '" + sha256(otp.toString()) + "', '0', '" + msg + "', '" + type + "','email');");
                if (insert_otp.insertId) {
                    if (await send_email.otp_gen(email, otp, name, msg, tx_id)) {
                        return { success: true, msg: 'An OTP sent to you email successfully.', data: data, errors: '' };
                    } else {
                        return { success: false, msg: 'A problem occurred while sending mail.', data: data, errors: '' };
                    }
                } else {
                    return { success: false, msg: 'A problem occurred while sending mail error 1.', data: data, errors: '' };
                }
            } else {
                console.log("No user_id or email_id in data object.");
                return { success: false };
            }
        } else {
            console.log("No data recived.");
            return { success: false };
        }
    } catch (err) {
        console.log('in email_otp_gen function error');
        console.log(err);
        return { success: false, msg: 'Error', data: '', errors: err };
    }
};

exports.email_otp_verify = async(data) => {
    try {
        console.log("in 1");
        if (data != "" && data != null) {
            console.log("in 2", data);
            let user_id = '';
            let email = '';
            let tx_id = '';
            let msg = '';
            let name = '';
            let otp = '';
            otp = data['otp'];
            if (otp == '' || otp == null) {
                console.log("No OTP in data object.");
                return "otp not found";
            }
            if (data['user_id'] != '' && data['user_id'] != null) user_id = data['user_id'];
            if (data['email'] != '' && data['email'] != null) email = data['email'];
            if (data['tx_id'] != '' && data['tx_id'] != null) tx_id = data['tx_id'];
            if (data['msg'] != '' && data['msg'] != null) msg = data['msg'];
            if (user_id != '' || email != '') {
                if (user_id != '') {
                    let user = await db.query("SELECT * FROM `users` WHERE `id` = " + db.pool.escape(user_id));
                    if (user.length) {
                        if (email == '') email = user[0].email;
                        name = user[0].first_name;
                    }
                } else {
                    if (name == "") {
                        name = email;
                    }
                    user_id = 0;
                }
                let get_otp = await db.query("SELECT * FROM `otp` WHERE `user_id` = '" + user_id + "' AND `sent_to` LIKE '" + email + "' AND `tx_id` LIKE '" + tx_id + "'");
                console.log("in 3 ", get_otp);
                if (get_otp.length) {
                    if (get_otp[0].otp_status < 3) {
                        if (get_otp[0].otp == sha256(otp)) {
                            if (await send_email.otp_verifyed(email, name, msg, tx_id)) {
                                await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + email + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                                return { success: true, msg: 'OTP verifyed and verification email sent successfully.', data: get_otp[0], errors: '' };
                            } else {
                                return { success: false, msg: 'A problem occured while sending mail.', data: data, errors: '' };
                            }
                        } else {
                            await db.query("UPDATE `otp` SET `otp_status` = `otp_status` + '1' WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + email + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                            return { success: false, msg: 'Wrong OTP.', data: data, errors: '' };
                        }
                    } else {
                        await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + email + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                        return { success: false, msg: 'Too many attempts.', data: data, errors: '' };
                    }
                } else {
                    return { success: false, msg: 'No OTP record found.', data: data, errors: '' };
                }
            } else {
                console.log("No user_id or email_id in data object.");
                return { success: false };
            }
        } else {
            console.log("No data recived.");
            return { success: false };
        }
    } catch (err) {
        console.log('in email_otp_verify function error');
        console.log(err);
        return { success: false, msg: 'Error', data: '', errors: err };
    }
};

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx___________________________SMS__________________________________xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx//

exports.sms_otp_gen = async(data) => {
    try {
        if (data != "" && data != null) {
            let user_id = '';
            let mobile = '';
            let tx_id = '';
            let msg = '';
            let name = '';
            let type = '';
            if (data['user_id'] != '' && data['user_id'] != null) user_id = data['user_id'];
            if (data['mobile'] != '' && data['mobile'] != null) mobile = data['mobile'];
            if (data['tx_id'] != '' && data['tx_id'] != null) tx_id = data['tx_id'];
            if (data['msg'] != '' && data['msg'] != null) msg = data['msg'];
            if (data['type'] != '' && data['type'] != null) type = data['type'];
            if (data['name'] != '' && data['name'] != null) name = data['name'];
            if (user_id != '' || mobile != '') {
                let otp = Math.floor(Math.random() * 8999) + 1000;
                if (user_id != '') {
                    let user = await db.query("SELECT * FROM `users` WHERE `id` = " + db.pool.escape(user_id));
                    if (user.length) {
                        if (mobile == '') mobile = user[0].mobile;
                        name = user[0].first_name;
                    }
                } else {
                    if (name == "") {
                        name = mobile;
                    }
                    user_id = 0;
                }
                await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + mobile + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                let insert_otp = await db.query("INSERT INTO `otp` (`user_id`, `sent_to`, `tx_id`, `otp`, `otp_status`, `msg`, `action_type`,`through`) VALUES ('" + user_id + "', '" + mobile + "', '" + tx_id + "', '" + sha256(otp.toString()) + "', '0', '" + msg + "', '" + type + "','sms');");
                if (insert_otp.insertId) {
                    if (await send_sms.otp_gen(mobile, otp, name, msg, tx_id)) {
                        return { success: true, msg: 'An OTP sent to your Phone No. successfully.', data: data, errors: '' };
                    } else {
                        return { success: false, msg: 'A problem occured while sending sms.', data: data, errors: '' };
                    }
                } else {
                    return { success: false, msg: 'A problem occured while sending sms error 1.', data: data, errors: '' };
                }
            } else {
                console.log("No user_id or mobile no. in data object.");
                return { success: false };
            }
        } else {
            console.log("No data recived.");
            return { success: false };
        }
    } catch (err) {
        console.log('in sms_otp_gen function error');
        console.log(err);
        return ({ success: false, msg: 'Error', data: {}, errors: err });
    }
}

exports.sms_otp_verify = async(data) => {
    try {
        console.log("in 1");
        if (data != "" && data != null) {
            console.log("in 2", data);
            let user_id = '';
            let mobile = '';
            let tx_id = '';
            let msg = '';
            let name = '';
            let otp = '';
            otp = data['otp'];
            if (otp == '' || otp == null) {
                console.log("No OTP in data object.");
                return "otp not found";
            }
            if (data['user_id'] != '' && data['user_id'] != null) user_id = data['user_id'];
            if (data['mobile'] != '' && data['mobile'] != null) mobile = data['mobile'];
            if (data['tx_id'] != '' && data['tx_id'] != null) tx_id = data['tx_id'];
            if (data['msg'] != '' && data['msg'] != null) msg = data['msg'];
            if (user_id != '' || mobile != '') {
                if (user_id != '') {
                    let user = await db.query("SELECT * FROM `users` WHERE `id` = " + db.pool.escape(user_id));
                    if (user.length) {
                        if (mobile == '') mobile = user[0].mobile;
                        name = user[0].first_name;
                    }
                } else {
                    if (name == "") {
                        name = mobile;
                    }
                    user_id = 0;
                }
                let get_otp = await db.query("SELECT * FROM `otp` WHERE `user_id` = '" + user_id + "' AND `sent_to` LIKE '" + mobile + "' AND `tx_id` LIKE '" + tx_id + "'");
                console.log("in 3 ", get_otp);
                if (get_otp.length) {
                    if (get_otp[0].otp_status < 3) {
                        if (get_otp[0].otp == sha256(otp)) {
                            if (await send_sms.otp_verifyed(mobile, name, msg, tx_id)) {
                                await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + mobile + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                                return { success: true, msg: 'OTP verifyed and verification email sent successfully.', data: get_otp[0], errors: '' };
                            } else {
                                return { success: false, msg: 'A problem occured while sending mail.', data: data, errors: '' };
                            }
                        } else {
                            await db.query("UPDATE `otp` SET `otp_status` = `otp_status` + '1' WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + mobile + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                            return { success: false, msg: 'Wrong OTP.', data: data, errors: '' };
                        }
                    } else {
                        await db.query("DELETE FROM `otp` WHERE `otp`.`user_id` = '" + user_id + "' AND `otp`.`sent_to` = '" + mobile + "' AND `otp`.`tx_id` = '" + tx_id + "';");
                        return { success: false, msg: 'Too many attempts.', data: data, errors: '' };
                    }
                } else {
                    return { success: false, msg: 'No OTP record found.', data: data, errors: '' };
                }
            } else {
                console.log("No user_id or email_id in data object.");
                return { success: false };
            }
        } else {
            console.log("No data recived.");
            return { success: false };
        }
    } catch (err) {
        console.log('in sms_otp_verify function error');
        console.log(err);
        return { success: false, msg: 'Error', data: '', errors: err };
    }
};