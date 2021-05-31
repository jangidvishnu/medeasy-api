const emailRegex = require('email-regex');


exports.signupFieldsValid = (data) => {
    let errors = [];

    if (data) {

        if (!data.first_name) {
            errors.push('Missing First Name field');
        } else {

        }


        if (!data.last_name) {
            errors.push('Missing Last Name field');
        } else {

        }


        if (!data.username) {
            errors.push('Missing username field');
        } else {

        }

        if (!data.email) {
            errors.push('Missing email field');
        } else {
            if (!emailRegex({ exact: true }).test(data.email)) {
                errors.push("Email is  not Valid");
            }
        }

        if (!data.password) {
            errors.push('Missing password field');
        } else {

        }

        if (!data.re_password) {
            errors.push('Missing confirm password field');
        } else {

        }

        if (!data.mobile) {
            errors.push('Missing  Mobile field');
        } else {

        }

        if (errors.length) {
            return { success: false, msg: 'Fields are missing', data: data, errors: errors.join(',') };
        } else {
            return { success: true, msg: 'Fields are valid', data: data, errors: errors.join(',') };
        }
    } else {
        return { success: false, msg: 'Fields are missing', data: data, errors: 'Fields are missing' };
    }
};