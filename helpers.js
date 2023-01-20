////////////////////////////////////////////////////////////////
////Helpers functions
////////////////////////////////////////////////////////////////

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};

//returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = function(userId, urlDatabase) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === userId) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// check if the email submitted already exists
const getUserByEmail = function(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };