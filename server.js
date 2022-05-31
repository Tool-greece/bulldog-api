const express = require("express");
const connectDB = require("./config/db.js");
const app = express();
const cors = require('cors');
const helmet = require('helmet');


//connect to DB
connectDB();

app.use(helmet());
app.use(cors({ credentials: true, origin: 'https://bulldog-admin.netlify.app' }));
// app.use(cors({ credentials: true, origin: 'https://bulldog-admin.netlify.app' }));
//Init Middleware
app.use(express.json({ extended: false, limit: '10kb' }));

app.get("/", (req, res) => res.send("API is Running"));

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/games", require("./routes/api/games"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
