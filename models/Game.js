const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    user_name: {
        type: String
    },
    score_1: {
        type: Number
    },
    score_2: {
        type: Number
    },
    score_3: {
        type: Number
    }
});

const GameSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    name: {
        type: String
    },
    gameId: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    players: [{
        user_name: String,
        part_1: {
            PA_score: Number,
            VA_score: Number,
            A_score: Number,
            H_score: Number
        },
        part_3: {
            score: Number,
            total: Number
        }
    }]
});

module.exports = Game = mongoose.model("game", GameSchema);


