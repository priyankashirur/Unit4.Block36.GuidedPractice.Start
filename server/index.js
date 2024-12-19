const {
  client,
  createTables,
  createUser,
  createSkill,
  fetchUsers,
  fetchSkills,
  createUserSkill,
  fetchUserSkills,
  deleteUserSkill,
  authenticate,
  findUserByToken,
} = require("./db");
const express = require("express");
const app = express();
app.use(express.json());

// TODO - create middleware function isLoggedIn; use in the /api/auth/me route

app.post("/api/auth/login", async (req, res, next) => {
  try {
    res.send(await authenticate(req.body));
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth/me", async (req, res, next) => {
  try {
    res.send(await findUserByToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/skills", async (req, res, next) => {
  try {
    res.send(await fetchSkills());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

// TODO - use isLoggedIn middleware
app.get("/api/users/:id/userSkills", async (req, res, next) => {
  try {
    // TODO - verify that the req.user.id on the route matches the user id in req.params

    res.send(await fetchUserSkills(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

// TODO - use isLoggedIn middleware
app.delete("/api/users/:userId/userSkills/:id", async (req, res, next) => {
  try {
    // if (req.params.userId !== req.user.id) {
    //   const error = Error("not authorized");
    //   error.status = 401;
    //   throw error;
    // }
    await deleteUserSkill({ user_id: req.params.userId, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// TODO - use isLoggedIn middleware
app.post("/api/users/:id/userSkills", async (req, res, next) => {
  try {
    // if (req.params.id !== req.user.id) {
    //   const error = Error("not authorized");
    //   error.status = 401;
    //   throw error;
    // }
    res.status(201).send(
      await createUserSkill({
        user_id: req.params.id,
        skill_id: req.body.skill_id,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");
  const [logan, chase, lincoln, boots, running, barking, dogTricks, meowing] =
    await Promise.all([
      createUser({ username: "logan", password: "password1" }),
      createUser({ username: "chase", password: "password2" }),
      createUser({ username: "lincoln", password: "password3" }),
      createUser({ username: "boots", password: "password4" }),
      createSkill({ name: "running" }),
      createSkill({ name: "barking" }),
      createSkill({ name: "dogTricks" }),
      createSkill({ name: "meowing" }),
    ]);

  console.log("users", await fetchUsers());
  console.log("skills", await fetchSkills());

  const userSkills = await Promise.all([
    createUserSkill({ user_id: logan.id, skill_id: running.id }),
    createUserSkill({ user_id: logan.id, skill_id: dogTricks.id }),
    createUserSkill({ user_id: chase.id, skill_id: running.id }),
    createUserSkill({ user_id: chase.id, skill_id: barking.id }),
    createUserSkill({ user_id: chase.id, skill_id: meowing.id }),
    createUserSkill({ user_id: lincoln.id, skill_id: barking.id }),
    createUserSkill({ user_id: lincoln.id, skill_id: dogTricks.id }),
    createUserSkill({ user_id: boots.id, skill_id: meowing.id }),
  ]);
  console.log("chase skills", await fetchUserSkills(chase.id));
  await deleteUserSkill({ user_id: chase.id, id: userSkills[4].id });
  console.log("chase skills", await fetchUserSkills(chase.id));

  console.log("data seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
