"use strict";
require('dotenv').config();
const db = require('../common/db');


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.getAlternativeMedicineById = async (id, mustBeLess = false) => {
    let alternatives = await db.query("SELECT * FROM `medicine` WHERE `compounds` IN (SELECT `compounds` FROM `medicine` WHERE `id` = " + id + " ) && `id` != " + id + (mustBeLess ? " && `price` < ( SELECT `price` FROM `medicine` WHERE `id` = " + id + "  ) " : "") + " ORDER BY `price` ASC;");
    return alternatives;
}

exports.getAlternativesMedicines = async (req, res) => {
    try {
        let searchParam = req.query.searchParam;
        let alternatives;

        if (searchParam.includes(",") && isNaN(searchParam)) {
            let searchedMedicines = searchParam.split(",");
            alternatives = [];

            for (let searchedMedicine of searchedMedicines) {
                let alternative = await this.getAlternativeMedicineById(searchedMedicine, true);
                (alternative && alternative[0]) ? alternatives.push(alternative[0]) : "";
            }

            res.status(200).send({ success: true, msg: 'Alternatives Found', data: { alternatives: alternatives }, errors: '' });
        } else if (!isNaN(searchParam)) {
            alternatives = await this.getAlternativeMedicineById(searchParam, false);
            res.status(200).send({ success: true, msg: 'Alternatives Found', data: { alternatives: alternatives }, errors: '' });
        } else {
            res.status(400).send({ success: false, msg: 'Invalid Data', data: {}, errors: '' });
        }
    } catch (err) {
        console.log('in getAlternativesMedicines function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error in getting alternatives medicines', data: {}, errors: '' });
    }
};

exports.getMedicines = async (req, res) => {
    try {
        let name = req.query.name;
        let medicines;

        if (!isJson(name)) {
            medicines = await db.query("SELECT * FROM `medicine` WHERE lower(`name`) like '%" + name + "%';");
            res.status(200).send({ success: true, msg: 'Medicines Found', data: { medicines: medicines }, errors: '' });
        } else {
            res.status(400).send({ success: false, msg: 'Invalid Medicine Name', data: {}, errors: '' });
        }


    } catch (err) {
        console.log('in getAlternativesMedicines function error');
        console.log(err);
        res.status(500).send({ success: false, msg: 'Error in getting alternatives medicines', data: {}, errors: '' });
    }
};