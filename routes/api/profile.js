const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route    GET api/profile/me
//@desc     Get current users profile
//@access   Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "avatar"]);
    // console.log(profile);
    if (!profile) {
      return res.status(404).json({ errors: [{ msg: "There is no profile for this user" }] });
    }
    res.json(200).jsong({ profile });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ errors: [{ msg: "Server Error" }] });
  }
});

//@route    Post api/profile
//@desc     Create/update use profile
//@access   Private
router.post(
  "/",
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location } = req.body;

    //build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    // we check if fields are coming from the front end
    if (location) profileFields.location = location;

    //insert/update data
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //update it
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // if profile it does not exist create it and save it
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    Post api/profile
//@desc     Create/update use profile
//@access   Private

router.get("/", async (req, res) => {
  try {
    const profile = await Profile.find().populate("user", ["name", "avatar"]);
    res.status(200).json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ errors: [{ msg: "Server Error" }] });
  }
});

module.exports = router;
