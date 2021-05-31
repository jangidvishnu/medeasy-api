require('dotenv').config()
const mysql = require('mysql');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');

const db_config = {
    connectionLimit: 10,
    host: cryptr.decrypt(process.env.db_host),
    user: cryptr.decrypt(process.env.db_user),
    password: cryptr.decrypt(process.env.db_pass),
    database: cryptr.decrypt(process.env.db_name),
};

const pool = mysql.createPool(db_config);
exports.pool = pool;
exports.query = function(query) {
    try {
        return new Promise((resolve, reject) => {
            pool.query(query, function(err, result, fields) {
                if (err) reject(err);
                resolve(result);
            });
        })
    } catch (err) {
        console.log('in db_sql function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: '', errors: err });
    }
}