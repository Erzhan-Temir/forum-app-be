module.exports = [
  {
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "forumsvc",
    password: "$69bJk*$XfcxuHD",
    database: "SuperForum",
    synchronize: true,
    logging: false,
    entities: ["src/repo/**/*.*"],
    cli: {
      entitiesDir: "src/repo",
    },
  },
];
