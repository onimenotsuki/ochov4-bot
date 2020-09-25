const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

router.get('/message', async ({ wit, query }, res) => {
  const { text } = query;

  const result = await wit.message(text);

  return res.status(200).json(result);
});

module.exports = router;
