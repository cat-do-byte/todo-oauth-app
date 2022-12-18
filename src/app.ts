import axios from "axios"
import express, { Application } from "express"
import path from "path"
import QueryString from "qs"
import cookieParser from "cookie-parser"

const app: Application = express()

const CLIENT_ID = "F1eF4OSSoMOQ/6Zo1w7q7yUwRsKhZtfvXH5AxZLqFP8="
const SERVER_OAUTH_TODO = "http://localhost:4000" // url app dashboard server
const mapToken = new Map() // global store token with id is random of user

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "/views"))

app.use(cookieParser())

// set a random cookie
app.use(function (req, res, next) {
  let userId = req.cookies.cookieName
  if (userId === undefined) {
    let randomNumber = Math.random().toString()
    randomNumber = randomNumber.substring(12, randomNumber.length)
    userId = randomNumber
    res.cookie("cookieName", randomNumber, { maxAge: 900000, httpOnly: true })
    console.log("cookie created successfully")
  }

  res.locals.user = userId

  next()
})

app.get("/refresh", (req, res) => {
  res.clearCookie("cookieName")
  res.redirect("/")
})

app.get("/", (req, res) => {
  res.render("home", {
    clientId: CLIENT_ID,
    oauthServer: SERVER_OAUTH_TODO,
    user: res.locals.user,
  })
})

app.get("/todo", (req, res) => {
  let userId = req.cookies.cookieName

  const userToken = mapToken.get(userId)
  console.log("userToken::", userToken)
  if (!userToken) {
    res.send("Current user is not authorized")
  } else {
    res.render("todo", {
      oauthServer: SERVER_OAUTH_TODO,
      token: userToken,
    })
  }
})

app.get("/all-token", (req, res) => {
  res.json(mapToken)
})

app.get("/oauth-callback", async (req, res) => {
  // exchange authorization code with token
  try {
    const { code } = req.query

    const codeData = {
      code,
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
    }

    const options = {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: QueryString.stringify(codeData),
      url: SERVER_OAUTH_TODO + "/oauth/get-token",
    }
    const result = await axios(options)

    if (!result.data.access_token) throw new Error("Can not get token")
    console.log(result, "result:::")

    // store current user token
    const cookie = req.cookies.cookieName
    console.log(result.data)
    mapToken.set(cookie, result.data)

    res.render("callback", {
      clientId: CLIENT_ID,
      oauthServer: SERVER_OAUTH_TODO,
      code,
    })
  } catch (err) {
    console.log(err)
  }
})

const port = 4002
app.listen(port, () => console.log(`Running at port ${port}`))
