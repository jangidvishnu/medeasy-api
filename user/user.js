"use strict";
require('dotenv').config();
const db = require('../common/db');
const multiparty = require('multiparty');
const fs = require('fs');

exports.getUserDetails = async (req, res) => {
    try {
        let user_id = req.user.user_id;
        let user = await db.query("SELECT `id`,`name`, `email`, `role`, `address`,  `pincode`,`join_time`, `update_time` FROM `users` WHERE `id` = " + user_id);
        if (user.length) {
            res.status(200).send({ success: true, msg: '', data: { user: user[0] }, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'User Not Found...', data: {} });
        }
    } catch (err) {
        console.log('in getUserDetails function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        let user_id = req.user.user_id;
        let requests = await db.query("SELECT * FROM `request` WHERE `user_id` = " + db.pool.escape(user_id) + " ORDER BY id DESC ;");
        if (requests.length) {
            res.status(200).send({ success: true, msg: '', data: { requests: requests }, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'Requests  Not Found...', data: {} });
        }
    } catch (err) {
        console.log('in getRequests function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.getStoreRequests = async (req, res) => {
    try {
        let user_id = req.user.user_id;
        let user = await db.query("SELECT * FROM `users` WHERE `role` = 'Chemist' AND `id` = " + db.pool.escape(user_id));
        if(user.length){
            let requests = await db.query("SELECT * FROM `request` WHERE `pincode` = '" +user[0].pincode + "' AND `id` NOT IN (SELECT `request_id` FROM `request_replied` WHERE `store_user_id` = "+ user_id +" ) ORDER BY request.id DESC ;");
            if (requests.length) {
                res.status(200).send({ success: true, msg: '', data: { requests: requests }, errors: '' });
            } else {
                res.status(200).send({ success: false, msg: 'Requests  Not Found...', data: {} });
            }
        }
        else{
            res.status(200).send({ success: false, msg: 'User Info not found  Not Found...', data: {} });
        }
        
    } catch (err) {
        console.log('in getRequests function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.getRepliesOfRequest = async (req, res) => {
    try {
        let request_id = req.query.request_id;
        let replies = await db.query("SELECT `remarks`,`status`,users.name AS store_name, users.address AS store_address  FROM `request_replied`,`users`  WHERE `request_id` = "+ request_id +" AND `store_user_id` = users.id ;");
        if (replies.length) {
            res.status(200).send({ success: true, msg: '', data: { replies: replies }, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'Replies  Not Found...', data: {} });
        }
    } catch (err) {
        console.log('in getRepliesOfRequest function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.replyRequest = async (req, res) => {
    try {
        let user_id = req.user.user_id;
        let request_id = req.body.request_id;
        let remarks = req.body.remarks;
        let status = req.body.status;
        if (request_id && remarks && status) {
            let reply = await db.query("INSERT INTO `request_replied` (`request_id`,`store_user_id`,`remarks`,`status`) VALUES ('" + request_id + "','" + user_id + "','" + remarks + "','" + status + "')  ");
            let changeStatus = await db.query("UPDATE `request` SET `status` = 'replied' WHERE `id` = " + request_id);
            res.status(200).send({ success: true, msg: '', data: {}, errors: '' });
        }    
        else {
            res.status(200).send({ success: false, msg: 'Parameters missing...', data: {} });
        }
    } catch (err) {
        console.log('in replyRequest function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
}

exports.getSingleRequest = async (req, res) => {
    try {
        let req_id = req.query.id;
        let requests = await db.query("SELECT request.id AS 'request_id',members.id,request.members_field,request.members_files,members.first_name,members.last_name,members.aadhar_number,members.dob,members.mobile,members.email FROM `request` JOIN `members` ON request.members=members.id WHERE request.status = 'pending' AND request.id = " + req_id);

        if (requests.length) {
            res.status(200).send({ success: true, msg: '', data: { request: requests[0] }, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'Requests  Not Found...', data: {} });
        }
    } catch (err) {
        console.log('in getRequests function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        let req_id = req.body.req_id;
        let user_id = req.body.user_id;
        let field_name = req.body.field_name;
        let field_value = req.body.field_value;

        let requests = await db.query("UPDATE `members`,`request` SET `" + (field_name) + "` = " + db.pool.escape(field_value) + " , `status`='done' WHERE members.id = " + user_id + " AND request.id = " + req_id);

        if (requests.affectedRows) {
            res.status(200).send({ success: true, msg: '', data: {}, errors: '' });
        } else {
            res.status(200).send({ success: false, msg: 'Requests  Not Found...', data: {} });
        }
    } catch (err) {
        console.log('in getRequests function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

exports.sendRequest = async (req, res) => {
    try {
        let form = new multiparty.Form();
        let user_id = req.user.user_id;
        form.parse(req, function (err, fields, files) {
            let description = fields.description;
            let pincode = fields.pincode;
            if(!pincode){
                let user = db.query("SELECT * FROM `users` WHERE `id` = " + user_id);
                pincode = user[0].pincode;
            }
            if (!description) {
                description = "No Description";
            }
            let timestamp = Date.now();

            if (files.request_file) {
                let request_file_oldpath = files.request_file[0].path;
                let newpath1 = '..\\..\\Frontend\\medeasy\\src\\assets\\img\\docs\\' + timestamp + files.request_file[0].originalFilename;
                let request_file = timestamp + files.request_file[0].originalFilename;
                // let newpath = '../../../var/www/html/coinscrow/assets/product_img/' + timestamp + files.product_images[0].originalFilename;;
                fs.rename(request_file_oldpath, newpath1, function (err) {
                    if (err) throw err;
                });
                let query = " INSERT INTO `REQUEST` (`description`,`file`,`user_id`,`status`,`pincode`) VALUES ( '" + description + "' , '" + request_file + "','" + user_id + "','pending','" + pincode + "') ";
                console.log(query);
                db.query(query);
            }
            else {
                let query = " INSERT INTO `REQUEST` (`description`,`user_id`,`status`,`pincode`) VALUES ( '" + description + "' , '" + user_id + "','pending','" + pincode + "') ";
                db.query(query);
            }
            res.status(200).send({ success: true, msg: "Request Sent Successfully", data: {}, errors: "" });
        });

    } catch (err) {
        console.log('in requestEdit function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: {}, errors: '' });
    }
};

