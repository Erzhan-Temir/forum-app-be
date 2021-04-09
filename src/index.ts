import express from "express";
import session from "express-session";

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);

const app = express();
const router = express.Router();

const PORT = process.env.PORT || 8000;

mongoose.connect('mongodb://localhost/my-database', {
  useNewUrlParser: true,
  useFindAndModify: false,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;

app.use(cookieParser());
app.use(session(
  {
    store: new MongoStore({mongooseConnection: db}),
    name: "forum-cookie",
    sameSite: "Strict",
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: "/",
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  } as any)
);

app.use(router);
router.get("/", (req: any, res: any, next) => {
  if (!req.session!.userid) {
    req.session!.userid = req.query.userid;
    req.session!.loadedCount = 0;
  } else {
    req.session!.loadedCount = Number(req.session!.loadedCount) + 1;
  }

  res.send(
    `userid: ${req.session!.userid}, loadedCount: ${req.session!.loadedCount}`
  );
});

app.listen({port: PORT}, () => {
  console.log(`Server ready on port ${PORT}`);
});
