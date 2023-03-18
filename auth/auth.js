"use strict";
require('dotenv').config()
const db = require('../common/db');
const otp_fun = require('../common/otp');
const jwt = require('./jwt');
const validation = require('./validation');
const sha256 = require('sha256');

exports.signup = async (req, res) => {
    try {
        let name = req.body.name;
        let email = req.body.email;
        let role = req.body.role;
        let address = req.body.address;
        let pincode = req.body.pincode;
        let password = req.body.password;
        let re_password = req.body.re_password;

        if (password == re_password) {
            let email_check = await db.query("SELECT * FROM users WHERE email = " + db.pool.escape(email));
            if (!email_check.length) {
                let insert_user;
                let password_hash = sha256(password);
                let sql = "INSERT INTO `users`(`name`,`email`,`role`, `address`, `pincode`, `password`) VALUES (" + db.pool.escape(name) + ", " + db.pool.escape(email) + ", " + db.pool.escape(role) + ", " + db.pool.escape(address) + ", " + db.pool.escape(pincode) + ", " + db.pool.escape(password_hash) + ");";
                insert_user = await db.query(sql);
                if (insert_user.insertId) {
                    res.status(200).send({ success: true, msg: "successfully registered", data: {}, errors: "" });
                    return;
                } else {
                    res.status(200).send({ success: false, msg: "Error in registering User", data: {}, errors: "" });
                }


            } else {
                res.status(200).send({ success: false, msg: 'Email Already Registered!', data: {}, errors: '' });
            }
        } else {
            res.status(200).send({ success: false, msg: 'Password Mismatch!', data: {}, errors: '' });
        }
    } catch (err) {
        console.log('in signup function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: err });
    }
};


exports.login = async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;
        let password_hash = sha256(password);

        let userInfo = await db.query("SELECT * FROM `users` WHERE `email` = " + db.pool.escape(email) + " AND `password` = " + db.pool.escape(password_hash));
        if (userInfo.length) {
            let user_obj = { user_id: userInfo[0].id, email: userInfo[0].email };
            const accessToken = await jwt.generateToken(user_obj);
            if (accessToken.success == true) {
                let user = {
                    id: userInfo[0].id,
                    role: userInfo[0].role,
                    address: userInfo[0].address,
                    pincode: userInfo[0].pincode,
                    email: userInfo[0].email,
                    name: userInfo[0].name,
                }
                res.status(200).json({ success: true, msg: 'Successfully logged In!', data: { user: user }, accessToken: accessToken.token, errors: '' })
            } else {
                res.status(200).json({ success: false, msg: 'Error in generating access Token!', data: "", errors: '' });
            }

        } else {
            res.status(200).send({ success: false, msg: 'User Information Not Found', data: {}, errors: "" });
        }

    } catch (err) {
        console.log('in login function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: err });
    }
};



exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
        let user_id = req.user.user_id;
        let delete_token = await db.query("DELETE FROM `user_log` WHERE `user_log`.`user_id` = '" + user_id + "' AND `user_log`.`token` like '" + token + "';");
        if (delete_token.affectedRows) {
            res.status(200).send({ success: true, msg: 'Logout!', data: {}, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'Error in Logout', data: {}, errors: '' });
        }
    } catch (err) {
        console.log('in logout function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: err });
    }
};

