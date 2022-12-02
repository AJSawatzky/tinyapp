const { users } = require("./express_server")

const getUserByEmail = function(email, database) {
  let userID = null;
  for (const user of Object.keys(database)) {
    //console.log(users[user].email);
    if (database[user].email === email) {
      userID = database[user].id;
    }
  } return userID;
};

module.exports = { getUserByEmail };