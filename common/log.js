const db = require('./db');

exports.sys_log = async(req, res, next) => {
    try {
        const sys_id = req.headers['sys_id']
        const sys_info = req.headers['sys_info']
        if (sys_id != '' && sys_id != null) {
            let use_sys = await db.query("UPDATE `client_sys` SET `last_use` = NOW() WHERE `client_sys`.`id` = '" + sys_id + "';");
            if (use_sys.affectedRows != 1) {
                let reg_sys = await db.query("INSERT INTO `client_sys` (`info`) VALUES ('" + sys_info + "');");
                if (reg_sys.insertId) {
                    res.set('sys_id', reg_sys.insertId);
                }
            }
        } else {
            let reg_sys = await db.query("INSERT INTO `client_sys` (`info`) VALUES ('" + sys_info + "');");
            if (reg_sys.insertId) {
                res.set('sys_id', reg_sys.insertId);
            }
        }

        next()
    } catch (err) {
        console.log('in sys_log function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error', data: '', errors: err });
    }
};