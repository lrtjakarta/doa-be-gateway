const crypto = require("crypto-js");

const decode = (token) => {
  try {
    const decoded = crypto.AES.decrypt(
      token,
      process.env.AMS_TOKEN_KEY
    ).toString(crypto.enc.Utf8);
    if (decoded.length === 0) return null;

    const userId = decoded.split("|")[1];
    return userId;
  } catch (error) {
    console.log("error decode token", error);

    return null;
  }
};

module.exports = { decode };
