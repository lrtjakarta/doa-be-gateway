require("dotenv").config();

const express = require("express");
const proxy = require("express-http-proxy");
const logger = require("morgan");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
var app = express();

app.use("/html", express.static(path.join(__dirname, "html")));

// console.log("allowed origins", allowedOrigins);
const corsConfig = {
  origin: true,
  credentials: true,
  preflightContinue: false,
};

// const url = require("./config/serviceConfig");
const isMultipartRequest = function (req) {
  let contentTypeHeader = req.headers["content-type"];
  return contentTypeHeader && contentTypeHeader.indexOf("multipart") > -1;
};

const bodyParserJsonMiddleware = function () {
  return function (req, res, next) {
    if (isMultipartRequest(req)) {
      app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
      app.use(bodyParser.json({ limit: "50mb" }));
      console.log("this is multipart !");
      return next();
    }
    // app.use(bodyParser.json());
    const hed = req.headers;
    console.log("NOT multipart !", JSON.stringify(hed));
    console.log(JSON.stringify(req.headers));
    if (hed["content-type"] === "text/json") {
      console.log("req = text/json");
      app.use(bodyParser.text({ type: "text/*" }));
    } else {
      console.log("req = JSON");
      app.use(bodyParser.json({ limit: "50mb" }));
      app.use(
        bodyParser.urlencoded({
          extended: true,
          limit: "50mb",
          parameterLimit: 50000,
        })
      );
      return bodyParser.json({ limit: "50mb" })(req, res, next);
    }
    return next();
  };
};

app.use(bodyParserJsonMiddleware());

app.use(logger("dev"));

const { authentication, validateAMSToken } = require("./utils");

const check_authentication = async (req, res, next) => {
  return authentication(
    req,
    res,
    next,
    process.env.USER_URI + "/auth/verifyToken"
  );
};

app.use("/auth", cors(corsConfig));
app.use(
  "/auth",
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      return "/auth" + require("url").parse(req.url).path;
    },
  })
);

// set wild card for any domain can access
app.use(cors());
app.use(
  "/permission",
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      return "/permission" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/user",
  check_authentication,
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      console.log("req user", req);

      return "/user" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/page",
  check_authentication,
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      return "/page" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/permission",
  check_authentication,
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      return "/permission" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/role",
  check_authentication,
  proxy(process.env.USER_URI, {
    proxyReqPathResolver: function (req) {
      return "/role" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/work-order",
  check_authentication,
  proxy(process.env.WORKORDER_URI, {
    // Menambahkan req.userInfo ke header
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      // Menambahkan userInfo ke header
      proxyReqOpts.headers["X-User-Id"] = srcReq.userInfo._id;
      proxyReqOpts.headers["X-User-Name"] = srcReq.userInfo.name;
      return proxyReqOpts;
    },
    // proxyErrorHandler: function (err, res, next) {
    //   next(err);
    // },
  })
);
app.use("/goods", check_authentication, proxy(process.env.GOODS_URI));
app.use("/assesment", check_authentication, proxy(process.env.ASSESMENT_URI));
app.use(
  "/uploads",
  // check_authentication,
  proxy(process.env.UPLOAD_URI, { limit: "50mb" })
);
app.use("/service", check_authentication, proxy(process.env.SERVICE_URI));
app.use(
  "/medical",
  check_authentication,
  proxy(process.env.MEDICAL_CHECKUP_URI)
);

app.use(
  "/operational/ptw/ams",
  // validateAMSToken,
  proxy(process.env.OPERATIONAL_ASP_URI, {
    // proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    //   // Menambahkan userInfo ke header
    //   proxyReqOpts.headers["X-UserId-AMS"] = srcReq.userIdAMS;
    //   // console.log("srcReq", srcReq.originalUrl);
    //   // console.log("req", proxyReqOpts);
    //   return proxyReqOpts;
    // },
    proxyReqPathResolver: function (req) {
      return "/ptw/ams" + require("url").parse(req.url).path;
    },
  })
);

app.use(
  "/operational/public/cabinEntry",
  proxy(process.env.OPERATIONAL_ASP_URI, {
    proxyReqPathResolver: function (req) {
      console.log("req user", req);

      return "/public/cabinEntry" + require("url").parse(req.url).path;
    },
  })
);
app.use(
  "/operational",
  check_authentication,
  proxy(process.env.OPERATIONAL_ASP_URI)
);
app.use(
  "/occ/report/external/dispatcher",
  validateAMSToken,
  proxy(process.env.OPERATIONAL_OCC_URI, {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      // Menambahkan userInfo ke header
      proxyReqOpts.headers["X-UserId-AMS"] = srcReq.userIdAMS;
      return proxyReqOpts;
    },
  })
);

app.use("/occ", check_authentication, proxy(process.env.OPERATIONAL_OCC_URI));
app.use(
  "/occ_files",
  proxy(process.env.OPERATIONAL_OCC_URI, {
    proxyReqPathResolver: function (req) {
      return "/files" + require("url").parse(req.url).path;
    },
  })
);

app.get("/", (req, res) => {
  res.send("LRT OPL Backend Gateway Service is Connected");
});

const port = process.env.PORT;

var server = require("http").createServer(app);

server.listen(port, () => {
  console.log(`LRT OPL Backend Gateway Service running on port ${port}`);
});
