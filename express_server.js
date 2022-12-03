const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const PORT = 8080; 
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./server_helper");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['superSecretKey', 'anotherEvenMoreSecretKey'],
}));

app.set("view engine", "ejs");


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user1",
  },
  b6UTxS: {
    longURL: "https://facebook.com",
    userID: "user1",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2",
  },
};

const users = {
  user1: {
    id: "user1",
    email: "user1@example.com",
    password: "user1Password",
  },
  user2: {
    id: "user2",
    email: "user2@example.com",
    password: "user2Password",
  },
};

const urlsForUser = (id) => {
  const userURLs = {};
  const currentUser = id;
  for (const shortID of Object.keys(urlDatabase)) {
    if (urlDatabase[shortID].userID === currentUser) {
      userURLs[shortID] = urlDatabase[shortID];
    }
  } return userURLs;
};

const generateRandomString = () => {
  return (Math.random() + 1).toString(36).slice(2,8);
};

const checkUsersPassword = (loginPassword) => {
  let value = false;
  for (const user of Object.keys(users)) {
    if (users[user].password === loginPassword) {
      value = true;
    } 
  } return value;
};

//Checks if the url ID in the Database. If value = null, then the key is in the DB
const checkDatabaseForID = (ID) => {
  let value = true;
  for (const key in urlDatabase) {
    if (key === ID) {
      value = null;
    } 
  } return value;
};

app.get("/", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const viewerID = req.session.user_id;
  if (urlDatabase[req.params.id].userID !== viewerID) {
    res.status(401).send("You don't have permission to view this URL");
  } if (urlDatabase[id] === undefined) {
    res.status(404).send("That URL ID does not exist!");
  } if (req.session.user_id === undefined) {
    res.status(401).send("You don't have permission to delete this URL");
  }
  delete urlDatabase[id];
  console.log("New database objects:",urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const viewerID = req.session.user_id;
  if (urlDatabase[id].userID !== viewerID) {
    res.status(401).send("You don't have permission to view this URL");
  } if (req.session.user_id === undefined) {
    res.status(401).send("You must be logged in to view this URL");
  } if (urlDatabase[id] === undefined) {
    res.status(404).send("That URL ID does not exist!");
  }
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(401).send("You must be logged in to shorten a URL");
  }
  console.log('postURLs', req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};
  console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
  res.send("Ok"); // Responds 'Ok' 
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(401).send("Log in to view short URLs");
  }
  const userURLs = urlsForUser(req.session.user_id);
  const templateVars = {
    urls: userURLs,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (checkDatabaseForID(id) === true) {
    res.status(404).send("URL ID doesn't exist!");
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const urlID = req.params.id;
  const viewerID = req.session.user_id;
  if (urlDatabase[urlID] === undefined) {
    res.status(404).send("That URL ID does not exist!");
  } if (viewerID === undefined) {
    res.status(401).send("log in to view shortened URLs");
  } if (urlDatabase[req.params.id].userID !== viewerID) {
    res.status(401).send("You don't have permission to view this URL");
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect(`/login`);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const userEmail = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (userEmail === "" || password === "") {
    res.status(400).send("Please check that you've inputted a username and password!");
  } else if (getUserByEmail(req.body.email, users) !== null) {
    res.status(400).send("That email already has an account registered!");
  } else {
    users[id] = {id: id, email: userEmail, password: hashedPassword};
    console.log("users:", users);
    res.session.user_id = users[id].id; //login new user
    res.redirect(`/urls`);
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = getUserByEmail(userEmail, users);
  if (getUserByEmail(req.body.email, users) === null) {
    res.status(403).send("User not found!");
  } if (checkUsersPassword(password) === true || bcrypt.compareSync(password, users[userID].password) === true) {
      let loginUserID = getUserByEmail(userEmail, users);
    req.session.user_id = users[loginUserID].id;
    res.redirect(`/urls`);
  } else {
    res.status(403).send("Incorrect Password.");
  }
});

app.use((req, res) => {
  res.status(404).send("404 page not found!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports = { users };