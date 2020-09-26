const axios = require('axios');
const dotenv = require('dotenv');
const qs = require('querystring');

// Cargamos variables de entorno
dotenv.config();

module.exports = async ({ number, message }) => {
  try {
    const { data } = await axios({
      method: 'POST',
      url: 'https://impulseyourbusiness.com/sms/parson-api/api/auth',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        client_key: process.env.PARSON_CLIENT_KEY,
        client_secret: process.env.PARSON_CLIENT_SECRET,
      }),
    });

    await axios({
      method: 'POST',
      url: 'https://impulseyourbusiness.com/sms/parson-api/api/sms/send',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-access-token': data.data.token,
      },
      data: qs.stringify({
        phone: number,
        message,
      }),
    });

    return { message, success: true };
  } catch (error) {
    return { message: JSON.stringify(error), success: false };
  }
};
