const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Providers
const sms = require('../../providers/sms');

module.exports = async ({ body }, res) => {
  const { phoneNumber, index } = body;

  const selectItem = (number) => {
    switch (number) {
      case 0:
        return 36353320943779;
      case 1:
        return 36392326201507;
      case 2:
        return 36441062211747;
    }
  };

  try {
    const { data: order } = await axios.post(
      `${process.env.FORWARDING_ADDRESS}/shopify/create-order`,
      {
        item: selectItem(parseInt(index, 10)),
      },
    );

    sms({
      number: phoneNumber,
      message: order.invoice_url,
    });

    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
    });
  } catch (error) {
    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
    });
  }
};
