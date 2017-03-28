'use strict';

const _ = require('lodash');
const Mailgun = require('mailgun-js');

function whitelistRecipients(to, reject) {
   if (Array.isArray(to)) {
        return to.map(recipient => checkWhitelist(recipient, reject)).join(',');
    } else {
        return checkWhitelist(to, reject)
    }
}

module.exports = function (options) {

    const mailgunClient = Mailgun({
        apiKey: options.key,
        domain: options.domain
    });

    const checkWhitelist = (emailAddress, reject) => {

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
    };

    return {
        send : (emailObject) => {

            return new Promise((resolve, reject) => {
                if (!emailObject.to) {
                    return reject('no to address provided');
                }

                if (!emailObject.from) {
                    return reject('no from address provided');
                }

                if (!emailObject.subject) {
                    return reject('no subject provided');
                }

                if (!emailObject.text && !emailObject.html) {
                    return reject('no text or html body provided');
                }

                const mail = {
                    from: emailObject.from,
                    to: whitelistRecipients(emailObject.to, reject),
                    subject: emailObject.subject,
                    body: emailObject.text || '',
                    html: emailObject.html || ''
                };

                if (emailObject.bcc) {
                    mail.bcc = whitelistRecipients(emailObject.bcc, reject);
                }

                if (emailObject.cc) {
                    mail.cc = whitelistRecipients(emailObject.cc, reject);
                }

                if (emailObject.attachments) {
                    if (!Array.isArray(emailObject.attachments)) {
                        return reject('attachments must be an array');
                    }

                    const attachments = [];
                    emailObject.attachments.forEach((attachment) => {

                        // Buffer's don't make it through kue,
                        // so convert strings to buffers
                        if (typeof attachment.data === 'string') {
                            attachment.data = new Buffer(attachment.data);
                        }

                        attachments.push(new mailgunClient.Attachment({
                            contentType: attachment.contentType,
                            filename: attachment.filename,
                            data: attachment.data
                        }));
                        mail.attachment = attachments[0];
                    });
                }

                mailgunClient.messages().send(mail, (error, body) => {

                    if (error) {
                        console.log(error, mail);
                        reject(error);
                    }
                    else {
                        resolve(body);
                    }
                });
            });
        }
    };
};
