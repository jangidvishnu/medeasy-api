const jwt = require('jsonwebtoken')
require('dotenv').config()
const db = require('../common/db');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');

exports.generateToken = async function (user) {
    try {
        let token = jwt.sign(user, cryptr.decrypt(process.env.ACCESS_TOKEN_SECRET));
        let insert_token = await db.query("INSERT INTO `user_log` (`user_id`,`token`) VALUES ('" + user.user_id + "','" + token + "');");
        if (insert_token.insertId) {
            return { success: true, token: token };
        } else {
            return { success: false }
        }
    } catch (err) {
        console.log('in generateToken function error');
        console.log(err);
    }
};

exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.status(401).send({ success: false, msg: 'Unauthorized', data: '', errors: '' });

        jwt.verify(token, cryptr.decrypt(process.env.ACCESS_TOKEN_SECRET), async (err, user) => {
            if (err) return res.status(403).send({ success: false, msg: 'Forbidden', data: '', errors: err });
            req.user = user;
            let check_token = await db.query("SELECT * FROM `user_log` WHERE `user_id` = '" + user.user_id + "' AND `token` LIKE '" + token + "';");
            if (check_token.length == 1) {
                next()
            } else {
                return res.status(403).send({ success: false, msg: 'Forbidden', data: '', errors: err });
            }
        })
    } catch (err) {
        console.log('in authenticateToken function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: '', errors: err });
    }
};


exports.generateAdminToken = async function (user) {
    try {
        let token = jwt.sign(user, cryptr.decrypt(process.env.ACCESS_TOKEN_SECRET));
        let insert_token = await db.query("INSERT INTO `admin_log` (`admin_id`,`token`) VALUES ('1','" + token + "');");
        if (insert_token.insertId) {
            return { success: true, token: token };
        } else {
            return { success: false }
        }
    } catch (err) {
        console.log('in generateAdminToken function error');
        console.log(err);
    }
};

exports.authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.status(401).send({ success: false, msg: 'Unauthorized', data: '', errors: '' });

        jwt.verify(token, cryptr.decrypt(process.env.ACCESS_TOKEN_SECRET), async (err, user) => {
            if (err) return res.status(403).send({ success: false, msg: 'Forbidden', data: '', errors: err });
            req.user = user;
            let check_token = await db.query("SELECT * FROM `admin_log` WHERE  `token` LIKE '" + token + "';");
            if (check_token.length == 1) {
                next()
            } else {
                return res.status(403).send({ success: false, msg: 'Forbidden', data: '', errors: err });
            }
        })
    } catch (err) {
        console.log('in authenticateAdmin function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: '', errors: err });
    }
};