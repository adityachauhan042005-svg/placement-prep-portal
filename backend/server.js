const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const authMiddleware = require("./middleware/authMiddleware");
const dns = require("dns");
const cors = require("cors");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const Progress = require("./models/progress");

const app = express();

const PORT = 5000;
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(function () {
        console.log("MongoDB connected successfully!");
    })
    .catch(function (error) {
        console.log("MongoDB connection failed:", error.message);
    });

app.get("/", function (req, res) {
    res.send("Placement Prep Portal Backend is Running!");
});

app.get("/api/test", function (req, res) {
    res.json({
        message: "API is working!"
    });
});
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

if (existingUser) {
    return res.status(400).json({
        message: "Email already registered"
    });
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
    name,
    email,
    password: hashedPassword
});

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            message: "Registration failed"
        });
    }
});
// 👆 Register API ends here

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);

        res.json({
    message: "Login successful",
    token: token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email
    }
});

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});
app.get("/api/progress", authMiddleware, async function (req, res) {
    try {
        const progress = await Progress.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json({
            message: "Progress fetched successfully!",
            data: progress
        });

    } catch (error) {
        console.error("Fetch progress error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/progress", authMiddleware, async function (req, res) {
    try {
        const progress = new Progress({
            userId: req.userId,
            questions: req.body.questions,
            topic: req.body.topic,
            difficulty: req.body.difficulty,
            platform: req.body.platform,
            date: req.body.date
        });

        const savedProgress = await progress.save();

        res.status(201).json({
            message: "Progress saved successfully!",
            data: savedProgress
        });

    } catch (error) {

    if (error.name === "ValidationError") {

        const messages = Object.values(error.errors).map(function (err) {
            return err.message;
        });

        return res.status(400).json({
            message: "Validation failed",
            errors: messages
        });

    }

    res.status(500).json({
        message: "Internal server error"
    });

}

});
app.put("/api/progress/:id", authMiddleware, async function (req, res) {
    try {
        const updatedProgress = await Progress.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            {
                questions: req.body.questions,
                topic: req.body.topic,
                difficulty: req.body.difficulty,
                platform: req.body.platform,
                date: req.body.date
            },
            {
                new: true,
                runValidators: true
            }
        );

        // baaki tumhara existing error handling same rahega

        if (!updatedProgress) {
            return res.status(404).json({
                message: "Progress not found"
            });
        }

        res.json({
            message: "Progress updated successfully!",
            data: updatedProgress
        });

    } catch (error) {

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid progress ID"
            });
        }

        if (error.name === "ValidationError") {

            const messages = Object.values(error.errors).map(function (err) {
                return err.message;
            });

            return res.status(400).json({
                message: "Validation failed",
                errors: messages
            });

        }

        res.status(500).json({
            message: "Internal server error"
        });

    }

});
app.delete("/api/progress/:id", authMiddleware, async function (req, res) {

    try {

        const deletedProgress = await Progress.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
});

        if (!deletedProgress) {
            return res.status(404).json({
                message: "Progress not found"
            });
        }

        res.json({
            message: "Progress deleted successfully!",
            data: deletedProgress
        });

    } catch (error) {

    if (error.name === "CastError") {
        return res.status(400).json({
            message: "Invalid progress ID"
        });
    }

    res.status(500).json({
        message: "Internal server error"
    });

}

});

app.listen(PORT, function () {
    console.log(`Server running on http://localhost:${PORT}`);
});