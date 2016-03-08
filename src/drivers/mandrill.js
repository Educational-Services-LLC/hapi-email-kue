'use strict';

const _ = require('lodash');
const Mandrill = require('mandrill-api');

module.exports = function (options) {

    const mandrillClient = new Mandrill.Mandrill(options.key);

    return {
        send : function (emailObject) {

            return new Promise((resolve, reject) => {

                if (!emailObject.from) {
                    reject('no from address provided');
                }

                if (!emailObject.subject) {
                    reject('no subject provided');
                }

                if (!emailObject.template){
                    reject('no template provided');
                }

                const sendObj = {
                    template_name    : emailObject.template,
                    template_content : [],
                    async            : false,
                    ip_pool          : 'Main Pool',
                    message          : {
                        subject    : emailObject.subject,
                        from_email : typeof emailObject.from === 'string' ? emailObject.from : emailObject.from.email,
                        from_name  : emailObject.from.name,
                        to         : this._formatTo(emailObject.to, reject),
                        headers    : {
                            'reply-to' : typeof emailObject.from === 'string' ? emailObject.from : emailObject.from.email
                        },
                        global_merge_vars : _.map(emailObject.templateVars, (value, key) => ({ name : key, content : value })),
                        attachments : emailObject.attachments
                    }
                };

                if (emailObject.from.name) {
                    sendObj.message.from_name = emailObject.from.name;
                }

                mandrillClient.messages.sendTemplate(
                    sendObj,
                    (result) => resolve(result),
                    (err) => reject('Mandrill error - ' + err.name + ': ' + err.message)
                );
            });
        },

        _formatTo : function (to, reject) {

            // If there's no whitelist, then always send to the trap address if it's defined
            to = (!options.whitelist || !options.whitelist.length) ? options.trap || to : to;

            if (typeof to === 'string') {
                return [{
                    email : this._checkWhitelist(to, reject),
                    type  : 'to'
                }];
            }
            else if (typeof to === 'object') {
                const formatObject = function (recipient) {

                    if (!recipient.email) {
                        reject('failure to provide a recipeient\'s email');
                    }

                    recipient.email = this._checkWhitelist(emailAddressObject.email, reject);
                    recipient.type = 'to';
                    return recipient;
                };

                if (Object.prototype.toString.call(to) !== '[object Array]') {
                    return [formatObject(to)];
                }

                return _.map(to, (recipient) => formatObject(recipient));
            }
        },

        _checkWhitelist : function (emailAddress, reject) {

            if (!options.whitelist || !options.whitelist.length) {
                return emailAddress;
            }

            const domainPattern = /@(.*)$/;
            const domain = emailAddress.match(domainPattern)[1];

            if (_.findIndex(options.whitelist, (whitelisted) => domain === whitelisted) >= 0) {
                return emailAddress;
            }

            if (!options.trap) {
                reject('trap option must be set if using whitelist');
            }
            else {
                return options.trap;
            }
        }
    };
};
