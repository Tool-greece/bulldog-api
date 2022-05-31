const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const User = require("../../models/User");
const { transporter, resetPasswordTemplate, getPasswordResetUrl, usePasswordHashToMakeToken, sendPinTemplate } = require('../../middleware/mail');

//@route    POST api/users
//@desc     Register user route
//@access   PUblic
router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty().trim().escape(),
    check('email', 'Invalid email').exists().isEmail().normalizeEmail(),
    check(
      "password",
      "Please enter a password with at least 6 characters"
    ).isLength({ min: 6 }).trim().escape()
  ],
  async (req, res) => {
    {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      try {
        let user = await User.findOne({ email });

        if (user) {
          return res.status(400).json({ errors: [{ msg: "User already exists" }] });
        }

        // if ! exists
        const avatar = gravatar.url(email, {
          s: "200",
          r: "pg",
          d: "mm"
        });

        user = new User({
          name,
          email,
          avatar,
          password
        });

        //Encrypt pass
        const salt = await bcrypt.genSalt(10);
        const pin = Math.floor(1000 + Math.random() * 9000);
        user.password = await bcrypt.hash(password, salt);
        user.pin = pin;
        //save user
        await user.save();
        //Return JWT
        //send User the pin
        await transporter.sendMail(sendPinTemplate(email, pin), (err, resp) => {
          if (err) {
            res.status(400).json({ errors: [{ msg: "error sending pin email" }] })
          } else {
            next();
          }
        })

        const payload = {
          user: { id: user.id }
        };

        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 360000 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      } catch (err) {
        console.log(err)
        res.status(500).json({ errors: [{ msg: "Server Error" }] });
      }
    }
  }
);

router.post(
  "/reset",
  [
    check('email', 'Invalid email').exists().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const error = validationResult(req);
    console.log(error.array())
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: [{ msg: error.array() }] })
    }
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ errors: [{ msg: "User does not exist" }] });
      }
      const token = usePasswordHashToMakeToken(user);
      const url = getPasswordResetUrl(user, token);
      await transporter.sendMail(resetPasswordTemplate(user, url), (err, resp) => {
        if (err) {
          console.log(err)
          res.status(500).send({ errors: [{ msg: 'error sending email' }] })
        }
        // console.log(resp);
        res.status(200).json('email send');
      })
      // res.status(200).send('success');
    }
    catch (err) {
      res.status(500).json({ errors: [{ msg: 'server error' }] })
    }

  }
)

router.post(
  "/reset/:userId/:token",
  [
    check(
      "password",
      "Please enter a password with at least 6 characters"
    ).isLength({ min: 6 }).trim().escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    try {
      const userId = req.params.userId;
      const token = req.params.token;
      const password = req.body.password;
      const user = await User.findOne({ _id: userId });
      if (user) {
        const secret = user.password + "-" + user.date;
        const payload = jwt.decode(token, secret);
        if (payload.userId == user._id) {
          jwt.verify(token, secret, (err, decoded) => {
            if (err) {
              console.log(err)
              res.status(401).json({ errors: [{ msg: "Link has expired" }] })
            } else {
              bcrypt.genSalt(10, function (err, salt) {
                if (err) return
                bcrypt.hash(password, salt, function (err, hash) {
                  if (err) return
                  User.updateOne({ _id: userId }, { password: hash }).then(() => {
                    res.status(201).json({ errors: [{ msg: "Password changed successfully" }] })
                  }).catch(err => res.status(400).json(err))
                })
              })
            }
          })
        }
      } else {
        res.status(404).json({ errors: [{ msg: "user not found" }] })
      }

      // res.status(200).json({date : user.date})
    }
    catch (err) {
      res.status(500).json({ errors: [{ msg: 'server error' }] });
    }
  }
)

router.post("/sendpin", [check('email', 'Invalid email').exists().isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    var pin = Math.floor(1000 + Math.random() * 9000);
    console.log(pin)
    // await transporter.sendMail(sendPinTemplate(email, pin), (err, resp) => {
    //   if(err) {
    //     res.status(400).json({ errors: [{ msg: "error sending email" }] })
    //   } else{
    //     console.log(resp)
    //     res.status(200)
    //   }
    // })
    console.log(email);
    res.json({ email })
  }
)


module.exports = router;
