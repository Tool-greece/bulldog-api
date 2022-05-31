 
# Bulldog API Endpoints

### Mobile Game Endpoints

POST /api/auth/player : Registers player in a game. Requires two properties in body object, username and gameId. Returns authorization token to store.

POST /api/games/score?part={} : Post player score per part. Takes part number as a url parameter. Requires x-auth-token key in Headers for authorization. Body requires one property answers which is an array. 
For part = 1 has this schema: answers:
  [
    { question: 1, answer: 2, category: “PA” },
  …}
  ].
For part = 3 :  answers: [0, 1, 0, 1, 1, …]



### Dashboard Endpoints

POST /api/users/ : Registers new user. Requires three properties in body, name, email and password. Returns token to store.

POST /api/auth/ : User Login. Requires two properties in body, email and password. Returns token to store.

GET /api/auth : Requires x-auth-token key in headers for authorization. Returns user object.

POST /api/verify : Verifies new user account. Requires two properties in body, email and pin (pin from email verification) .

POST /api/users/reset : Sends email to user to reset password. Requires one property in body email.

POST /api/users/reset/:userId/:token : Resets user password. Requires password property in body.




