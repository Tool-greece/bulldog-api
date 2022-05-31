const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const Game = require("../../models/Game");
//@route    GET api/auth
//@desc     Test route
//@access   PUblic
router.get("/", auth, async (req, res) => {
  try {
    //req.user.id Comes from the auth.js where we take the id from the token payload
    const user = await User.findById(req.user.id).select("-password");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ errors: [{ msg: "User not found" }] });
    }
  } catch (err) {
    res.status(500).json({ errors: [{ msg: "Server Error" }] });
  }
});

//@route    POST api/auth
//@desc     Authenticate use and get token
//@access   PUblic
router.post(
  "/",
  [
    check("email", "Please type a valid email").isEmail().normalizeEmail(),
    check("password", "Password is required").exists()
  ],
  async (req, res) => {
    {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      try {
        // get User from DB
        let user = await User.findOne({ email });
        console.log(user);
        if (!user) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Wrong email or password" }] });
        }
        //match email and pass
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Wrong email or password" }] });
        }

        if (!user.isVerified) {
          res.status(200).json({ verified: false })
        }

        const payload = {
          user: { id: user.id }
        };

        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 3600000 },
          (err, token) => {
            if (err) throw err;
            res.status(200).json({ token, verified: true });
          }
        );
      } catch (err) {
        console.log(err.message);
        res.status(500).json({ errors: [{ msg: "Server Error" }] });
      }
    }
  }
);

router.post("/verify",
  [check("email", "Please type a valid email").exists().isEmail().normalizeEmail(),
  check("pin", "Please type a valid pin").exists().isNumeric().escape().isLength({ min: 4, max: 4 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email;
    try {
      let user = await User.findOne({ email });
      if (user.pin == req.body.pin) {
        const payload = {
          user: { id: user.id }
        };
        user.isVerified = true;
        await user.save();
        await User.updateOne({ _id: user.id }, { $unset: { pin: 1 } });
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 3600000 },
          (err, token) => {
            if (err) throw err;
            res.status(200).json({ token });
          }
        );
      } else {
        res.status(400).json({ errors: [{ msg: 'pin is not correct' }] })
      }
    }
    catch (err) {
      console.log(err)
      res.status(500).json({ errors: [{ msg: 'server error' }] });
    }
  }
)

router.post(
  "/player",
  [
    check("username", "username is required").exists().trim().escape(),
    check("gameId", "game id is required").exists().trim().escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, gameId } = req.body;
      const game = await Game.findOne({ gameId: gameId });
      const playerExists = await Game.findOne({ gameId: gameId, "players.user_name": username });
      if (playerExists) {
        return res.status(400).json({ errors: [{ msg: "user_exists" }] })
      }
      if (!game) {
        return res.status(404).json({ errors: [{ msg: "wrong_id" }] })
      }
      const player = await Game.updateOne({ gameId: gameId }, { $push: { players: { user_name: username } } })
      if (player.nModified > 0) {
        const payload = {
          user: {
            username: username,
            gameId: gameId
          }
        };
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          // { expiresIn: 3600000 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        )
      } else {
        res.status(400).json({ errors: [{ msg: "bad request -- player did not register" }] })
      }
      // res.json({game});
    }
    catch (err) {
      console.log(err)
      res.status(500).json({ errors: [{ msg: 'server error' }] });
    }
  }
)

module.exports = router;
