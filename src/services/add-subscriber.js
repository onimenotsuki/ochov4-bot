const mailchimp = require('../providers/mailchimp');
const phrases = require('./../training/phrases');

module.exports = async ({ sender, email, firstName = '', lastName = '' }) => {
  try {
    await mailchimp.lists.addListMember('0681b18087', {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        MESSENGER_ID: sender,
        ORIGIN: 'Facebook Messenger',
      },
      tags: ['Facebook', 'Shopify'],
    });

    return {
      success: true,
      message:
        phrases.addSubscriber[
          Math.floor(Math.random() * phrases.addSubscriber.length)
        ],
    };
  } catch (error) {
    return { success: false, message: 'Hubo un error al agregar tu correo ' };
  }
};
