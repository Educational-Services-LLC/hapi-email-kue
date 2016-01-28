var _        = require('lodash');
var mandrill = require('mandrill-api');

module.exports = function(options) {
    var mandrillClient = new mandrill.Mandrill(options.key);

    return {
        send : function(emailObject) {
            var driver = this;
            return new Promise(function(resolve, reject) {
                if (!emailObject.from) reject('no from address provided');
                if (!emailObject.subject) reject('no subject provided');
                if (!emailObject.template) reject('no template provided');

                var sendObj = {
                    template_name    : emailObject.template,
                    template_content : [],
                    async            : false,
                    ip_pool          : 'Main Pool',
                    message          : {
                        subject    : emailObject.subject,
                        from_email : typeof emailObject.from === 'string' ? emailObject.from : emailObject.from.email,
                        from_name  : emailObject.from.name,
                        to         : driver._formatTo(emailObject.to, reject),
                        headers : {
                            'reply-to' : typeof emailObject.from === 'string' ? emailObject.from : emailObject.from.email
                        },
                        global_merge_vars : _.map(emailObject.templateVars, function(value, key) {
                            return {name : key, content : value};
                        })
                    }
                };

                if (emailObject.from.name) {
                    sendObj.message.from_name = emailObject.from.name;
                }

                mandrillClient.messages.sendTemplate(sendObj, function(result) {
                    resolve(result);
                }, function(err) {
                    reject('Mandrill error - ' + err.name + ': ' + err.message);
                });
            });
        },

        _formatTo : function(to, reject) {
            var driver = this;

            // If there's no whitelist, then always send to the trap address if it's defined
            to = (! options.whitelist || ! options.whitelist.length) ? options.trap || to : to;

            if (typeof to === 'string') {
                return [{
                    email : driver._checkWhitelist(to, reject),
                    type  : 'to'
                }];
            } else if (typeof to === 'object') {
                var formatObject = function(to) {
                    if (! to.email) reject('failure to provide a recipeient\'s email');
                    to.email = driver._checkWhitelist(to.email, reject);
                    to.type = 'to';
                    return to;
                };

                if (Object.prototype.toString.call(to) !== '[object Array]') {
                    return [formatObject(to)];
                } else {
                    return _.map(to, function(recipient) {
                        return formatObject(recipient);
                    });
                }
            }
        },

        _checkWhitelist : function(emailAddress, reject) {
            if (! options.whitelist || ! options.whitelist.length) {
                return emailAddress;
            }

            var domainPattern = /@(.*)$/,
                domain = emailAddress.match(domainPattern)[1];

            if (_.findIndex(
                options.whitelist,
                function(whitelisted) { return domain === whitelisted;}) >= 0
            ) {
                return emailAddress;
            } else {
                if (! options.trap) {
                    reject('trap option must be set if using whitelist');
                } else {
                    return options.trap;
                }
            }
        }
    };
};
