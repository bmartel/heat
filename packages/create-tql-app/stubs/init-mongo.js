db.createUser({
  user: ":dbusername:",
  pwd: ":dbpassword:",
  roles: [
    {
      role: "readWrite",
      db: ":dbname:",
    },
  ],
});
