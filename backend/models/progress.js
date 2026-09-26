const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({

    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
},

    questions: {
        type: Number,
        required: [true, "Questions are required"],
        min: [1, "Questions must be at least 1"],
        max: [500, "Questions cannot be more than 500"]
    },

    topic: {
        type: String,
        required: [true, "Topic is required"],
        trim: true
    },

    difficulty: {
        type: String,
        required: [true, "Difficulty is required"],
        enum: {
            values: ["Easy", "Medium", "Hard"],
            message: "Difficulty must be Easy, Medium or Hard"
        }
    },

    platform: {
        type: String,
        required: [true, "Platform is required"],
        trim: true
    },

    date: {
        type: String,
        required: [true, "Date is required"]
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Progress", progressSchema);