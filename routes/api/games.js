const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Game = require("../../models/Game");
const { check, validationResult } = require("express-validator");
const crypto = require('crypto');


router.get("/", auth,
    async (req, res) => {
        try {
            let games = await Game.find({ user: req.user.id }).sort({ date: -1 });
            return res.status(200).json(games);
        }
        catch (err) {
            console.log(err.message)
            res.status(500).json({ errors: [{ msg: "server error" }] })
        }

    }
)


router.post("/new",
    [
        auth,
        check("name", "name is required").not().isEmpty().trim().escape()
    ],
    async (req, res) => {
        try {
            var gameId = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            // gameId = gameId.toString('hex');
            console.log(gameId)
            const prevgame = await Game.findOne({ gameId: gameId })
            if (prevgame) {
                gameId = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
            }
            const game = new Game({ user: req.user.id, name: req.body.name, gameId: gameId });
            await game.save();
            return res.status(200).json(game);
        }
        catch (err) {
            console.log(err.message);
            res.status(500).json({ errors: [{ msg: 'server error' }] });
        }
    }
)

router.post("/score",
    [
        auth,
        check("answers", "no data provided").not().isEmpty()
    ],

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const player = req.user.username;
            const gameId = req.user.gameId;
            const questions = req.body.answers;
            
            var PA_score = 0;
            var VA_score = 0;
            var A_score = 0;
            var H_score = 0;
            if(req.query.part === "1" ){
                questions.forEach((question) => {
                    question.category == "PA" ? PA_score += question.answer : null;
                    question.category == "VA" ? VA_score += question.answer : null;
                    question.category == "H" ? H_score += question.answer : null;
                    question.category == "A" ? A_score += question.answer : null;
                })
                const gameToUpdate = await Game.updateOne({ gameId: gameId, "players.user_name": player },
                    {
                        $set: {
                            [`players.$.part_${req.query.part}.PA_score`]: PA_score,
                            [`players.$.part_${req.query.part}.VA_score`]: VA_score,
                            [`players.$.part_${req.query.part}.H_score`]: H_score,
                            [`players.$.part_${req.query.part}.A_score`]: A_score
                        }
                    }
                );

                if (gameToUpdate.nModified > 0) {
                    res.status(200).json("Score submitted successfully")
                } else {
                    res.status(404).json("Score did not submit, wrong data or already submitted");
                }
            } else {
                if(req.query.part === "3" ) {
                    //Part3 submit
                    var total = questions.length;
                    var corrects = 0;
                    questions.forEach(q => {
                        q === 1 ? corrects++ : null
                    })
                    const gameToUpdate = await Game.updateOne({ gameId: gameId, "players.user_name": player },
                    {
                        $set: {
                            [`players.$.part_${req.query.part}.score`]: corrects,
                            [`players.$.part_${req.query.part}.total`]: total,
                        }
                    }
                    );
                    if (gameToUpdate.nModified > 0) {
                        res.status(200).json("Score submitted successfully")
                    } else {
                        res.status(404).json("Score did not submit, wrong data or already submitted");
                    }
                }
                else {
                    res.status(404).json("Score did not submit, wrong part or data");
                }
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).json({ errors: [{ msg: 'server error' }] });
        }
    }
)


router.get("/:gameId", auth,
    async (req, res) => {
        try {
            const game = await Game.findOne({ gameId: req.params.gameId })
            if (game) {
                return res.status(200).json({ game });
            } else {
                return res.status(404).json({ errors: [{ msg: "Game not found" }] })
            }
        }
        catch (err) {
            console.log(err.message);
            res.status(500).json({ errors: [{ msg: 'server error' }] })
        }
    }
)

module.exports = router;