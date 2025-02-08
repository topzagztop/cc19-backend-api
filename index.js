require("dotenv").config()

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const errorHandler = require("./middleware/error")
const notFound = require("./middleware/not-found")

// import Routes
const authRoutes = require("./routes/auth-routes")
const userRoutes = require("./routes/user-routes")

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))

// Routes
app.use("/api", authRoutes)
app.use("/api", userRoutes)

// Error
app.use(errorHandler)
app.use(notFound)

app.listen("8000", ()=> console.log("Server is running port 8000"))