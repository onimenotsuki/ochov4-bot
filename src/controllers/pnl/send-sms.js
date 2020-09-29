// Providers
const sms = require('../../providers/sms');

module.exports = ({ body }, res) => {
  const { phoneNumber, productId } = body;

  console.log(productId);

  sms({
    number: phoneNumber,
    message: 'Gracias por suscribirte a #OchoV4Team desde Messenger',
  });

  return res
    .status(200)
    .json({ message: 'Mensaje enviado correctamente', phoneNumber, productId });
};
