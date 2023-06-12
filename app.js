const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbpath = path.join(__dirname, "twitterClone.db");
app.use(express.json());
let db = null;
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
  }
};
initializeServer();

// API 1
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const postQuery = `INSERT INTO user(username,password,name,gender) VALUES('${username}','${hashedPassword}','${name}','${gender}')`;
  const selectUser = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectUser);
  if (dbuser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbresponse = await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
//API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectUser);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    ispasswordMatch = await bcrypt.compare(password, dbuser.password);
    if (ispasswordMatch === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "black-box");
      response.status(200);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//authentication
const authentication = async (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "black-box", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        request.name = payload.username;
        next();
      }
    });
  }
};
app.get("/user/tweets/feed/", authentication, async (request, response) => {
  const getQuery = `SELECT username ,tweet,date_time AS dateTime FROM user NATURAL JOIN tweet ORDER BY date_time DESC LIMIT 4`;
  const dbresponse = await db.all(getQuery);
  response.send(dbresponse);
});
//API 4
app.get("/user/following/", authentication, async (request, response) => {
  const getQuery = `SELECT user.name FROM user INNER JOIN follower ON user.user_id=follower.following_user_id  group by user.name`;
  const dbresponse = await db.all(getQuery);
  response.send(dbresponse);
});
