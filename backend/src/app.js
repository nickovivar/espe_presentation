const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto');
const cors = require('cors');

const SECRET = "SUPERSECRET";
const MAX_MESSAGES = 100;

const app = express();

function make_auth_token(username) {
    const hash = crypto.createHash('sha256');
    hash.update(`${username}${SECRET}`);
    return `${username}###${hash.digest('hex')}`;
}

function verify_auth_token(token) {
    const username = token.split("###")[0];
    const valid_token = make_auth_token(username);
    if (valid_token === token) {
      return username;
    } else {
      return null;
    }
}

var messages = [];
var users = {};

function getMessages() {
  return [...messages].reverse();
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("../frontend/build"));

app.post('/api/login',
  (req, res) => {
    const username = req.body.username;
    if (!username) {
      return res.status(403).send("No username sent.");
    }
    const token = make_auth_token(username);
    res.send({auth_token: token});
  }
);

app.get('/api/messages',
  (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const user = verify_auth_token(token);
    if (user === null) {
      return res.status(401).send("Not authenticated.");
    }
    res.send(getMessages());
  }
);

app.post('/api/messages',
  (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const user = verify_auth_token(token);
    if (user === null) {
      return res.status(401).send("Not authenticated.");
    }
    const message = req.body.message;
    if (typeof(message) !== "string") {
      return res.status(400).send("Invalid or no message provided.");
    }
    messages.unshift({sender: user, message});
    messages = messages.slice(0, MAX_MESSAGES);
    res.send(getMessages());
  }
);

app.listen(80, () => console.log('Chat app listening on port 80!'));
