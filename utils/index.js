const jwt = require("jsonwebtoken");
const axios = require("axios");
const { decode } = require("../utils/ams");
// middleware untuk cek permission
const checkPermissions = (permissions, action) => {
  const check = permissions.includes(action);
  return check;
};

// middleware untuk cek permission untuk suatu aksi
const authorization = (action) => {
  return (req, res, next) => {
    // next()
    const token = req.headers.authorization.replace(/^Bearer\s+/, "");
    // console.log("token", token);
    // const user = jwt.verify(token, req.app.get("secretKey"));
    const user = jwt.decode(token);
    // console.log("user", user);
    if (user == null) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission params access token",
      });
    }
    const { permissions } = user;
    console.log("permissions", permissions);
    const isAllowed = checkPermissions(permissions, action);
    console.log(isAllowed);
    if (isAllowed) {
      req.userInfo = user;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have the necessary permissions to perform this action.",
      });
    }
  };
};

// middleware untuk memverifikasi access token
const authentication = async (req, res, next, uriAuth) => {
  console.log("token", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }

  console.log("authentication gateway", req.headers.authorization);
  const token = req.headers.authorization;

  try {
    const resAuth = await axios.post(
      uriAuth,
      {},
      { headers: { Authorization: token } }
    );

    if (resAuth.status == 200) {
      const userData = resAuth.data.user;
      const userInfo = {
        _id: userData._id,
        name: userData.name,
      };
      req.userInfo = userInfo;
      next();
    } else {
      res.status(resAuth.status).json({ message: resAuth.status.message });
    }
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// middleware untuk validasi ams token
const validateAMSToken = async (req, res, next) => {
  const ams_token = req.headers["token"];

  const data = decode(ams_token);

  if (data) {
    req.userIdAMS = data;
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized!" });
  }
};

module.exports = {
  validateAMSToken,
  authorization,
  authentication,
};
