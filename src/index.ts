import express from "express";
import session from "express-session";
import {createConnection} from "typeorm";
import {register, login, logout} from "./repo/UserRepo";
import bodyParser from 'body-parser';
import {createThread, getThreadById, getThreadsByCategoryId} from "./repo/ThreadRepo";
import {createThreadItem, getThreadItemsByThreadId} from "./repo/ThreadItemRepo";

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);

const main = async () => {
  const app = express();
  const router = express.Router();

  await createConnection();

  const PORT = process.env.PORT || 8000;

  mongoose.connect('mongodb://localhost/my-database', {
    useNewUrlParser: true,
    useFindAndModify: false,
  });
  mongoose.Promise = global.Promise;
  const db = mongoose.connection;

  app.use(bodyParser.json());

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

  router.get("/", (req: any, res, next) => {
    req.session!.test = "hello";
    res.send("hello");
  });

  router.post("/register", async (req, res, next) => {
    try {
      const userResult = await register(
        req.body.email,
        req.body.userName,
        req.body.password
      );
      if (userResult && userResult.user) {
        res.send(`new user created, userId: ${userResult.user.id}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/login", async (req: any, res, next) => {
    try {
      const userResult = await login(req.body.userName, req.body.password);
      if (userResult && userResult.user) {
        req.session!.userId = userResult.user?.id;
        res.send(`user logged in, userId: ${req.session!.userId}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/logout", async (req: any, res, next) => {
    try {
      const msg = await logout(req.body.userName);
      if (msg) {
        req.session!.userId = null;
        res.send(msg);
      } else {
        next();
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/createthread", async (req: any, res, next) => {
    try {
      const msg = await createThread(
        req.session!.userId,
        req.body.categoryId,
        req.body.title,
        req.body.body
      );

      res.send(msg);
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/thread", async (req, res, next) => {
    try {
      const threadResult = await getThreadById(req.body.id);

      if (threadResult && threadResult.entity) {
        res.send(threadResult.entity.title);
      } else if (threadResult && threadResult.messages) {
        res.send(threadResult.messages[0]);
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/threadsbycategory", async (req, res, next) => {
    try {
      const threadResult = await getThreadsByCategoryId(req.body.categoryId);

      if (threadResult && threadResult.entities) {
        let items = "";
        threadResult.entities.forEach((th) => {
          items += th.title + ", ";
        });
        res.send(items);
      } else if (threadResult && threadResult.messages) {
        res.send(threadResult.messages[0]);
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/createthreaditem", async (req: any, res, next) => {
    try {
      const msg = await createThreadItem(
        req.session!.userId,
        req.body.threadId,
        req.body.body
      );

      res.send(msg);
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/threadsitemsbythread", async (req, res, next) => {
    try {
      const threadItemResult = await getThreadItemsByThreadId(
        req.body.threadId
      );

      if (threadItemResult && threadItemResult.entities) {
        let items = "";
        threadItemResult.entities.forEach((ti) => {
          items += ti.body + ", ";
        });
        res.send(items);
      } else if (threadItemResult && threadItemResult.messages) {
        res.send(threadItemResult.messages[0]);
      }
    } catch (ex) {
      console.log(ex);
      res.send(ex.message);
    }
  });

  app.listen({port: PORT}, () => {
    console.log(`Server ready on port ${PORT}`);
  });
};

main();
