const express = require("express");
const connectDB = require("./config/db");

const app = express();

//connect to database
connectDB();

// Init middleware
app.use(express.json({extended : false}));// new way for bodyparser

//Define Routes

app.use("/api/users" , require("./routes/api/users")) ;
app.use("/api/posts" , require("./routes/api/posts")) ;
app.use("/api/auth" , require("./routes/api/auth")) ;
app.use("/api/profile" , require("./routes/api/profile")) ;





app.get("/" , (req , res) => {
    res.send("API Running");
})


const PORT = process.env.PORT || 5000;

app.listen(PORT , () => {
    console.log(`Server started successfuly on ${PORT}`);
})