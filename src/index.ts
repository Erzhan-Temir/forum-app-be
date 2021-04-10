import express from "express";
import session from "express-session";
import {createConnection} from "typeorm";
import bodyParser from 'body-parser';
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import typeDefs from "./gql/typeDefs";
import resolvers from "./gql/resolvers";
import cors from "cors";

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);

const main = async () => {
  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL || "http://localhost:8000",
    })
  );

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

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
  });
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen({port: PORT}, () => {
    console.log(`Server ready on port ${PORT}${apolloServer.graphqlPath}`);
  });
};

main();
