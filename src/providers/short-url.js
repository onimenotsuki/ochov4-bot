const axios = require('axios');
const dotenv = require('dotenv');
const qs = require('querystring');

// Cargamos variables de entorno
dotenv.config();

module.exports = async (url) => {
  try {
    const { data } = await axios({
      method: 'POST',
      url: 'http://www.iyb.bz/shortly/api/auth',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        client_key: process.env.PARSON_CLIENT_KEY,
        client_secret: process.env.PARSON_CLIENT_SECRET,
      }),
    });

    const result = await axios({
      method: 'POST',
      url: 'http://www.iyb.bz/shortly/api/url/add',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-access-token': data.data.token,
      },
      data: qs.stringify({ url }),
    });

    return result.data;
  } catch (error) {
    return { message: JSON.stringify(error), success: false };
  }
};
