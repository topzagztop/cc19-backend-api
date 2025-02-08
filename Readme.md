## Step 1 
```bash
npm init -y
```
## Step 2
Create file index.js

```bash
npm i express nodemon cors dotenv bcryptjs jsonwebtoken cloudinary multer morgan zod
```
```bash
npm i prisma init
```
edit file package.json Script run
```bash
 "scripts": {
    "start": "nodemon index.js"
  },
```

## Step 3
open server port and setup first in index.js
``` js
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")

const app = express();
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))


app.listen("8000", ()=> console.log("Server is running port 8000"))
```

## Step 4 
create error middleware and create error utils
#### path /middleware
- error.js
```js
const errorHandler = (err, req, res, next) => {
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Internal Server error" });
}

module.exports = errorHandler
```
- not-found.js
```js
const notFound = (req, res, next) => {
    res.status(400).json({ message: "Resource not found on this server" });
}

module.exports = notFound
```
#### path /utils
createError.js
```js
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

module.exports = createError
```
#### update file index.js
```js
// error 
app.use(errorHandler)
app.use(notFound)
```

## Step 5 Setup Prisma
- .env
```bash
DATABASE_URL="mysql://root:12345678@localhost:3306/cc19-profile"
```

- schema.prisma
```js
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

model Profile {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  firstname String
  lastname  String
  createAt  DateTime @default(now())
  updated   DateTime @updatedAt

  @@map("profile")
}
```
### push to database
```bash
npx prisma migrate dev --name init
```
#### or
```bash
npx prisma db push
```
## Step 6 Create Route and Controllers
routes/auth-routes.js
```js
const express = require("express");

const router = express.Router();

router.post("/register")
router.post("/login")
router.get("/current-user")

module.exports = router

```

## Step 6 Basic Security
### Validate Zodjs
- path/middleware validators.js
```js
const { z } = require("zod");

exports.registerSchema = z
  .object({
    email: z.string().email("Email is incorrect"),
    password: z.string().min(6, "Password must be more than 6 characters."),
    firstname: z.string().min(3, "firstname must be more than 3 characters."),
    lastname: z.string().min(3, "lastname must be more than 3 characters"),
    confirmPassword: z
      .string()
      .min(3, "Confirm Password must be more than 3 characters."),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Confirm Password not match",
    path: ["confirmPassword"],
  });

exports.loginSchema = z.object({
  email: z.string().email("Email is incorrect"),
  password: z.string().min(6, "Password must be more than 6 characters."),
});

exports.validateWithZod = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errMsg = error.errors.map((item) => item.message);
    const errTxt = errMsg.join(",");
    const mergeError = new Error(errTxt);
    next(mergeError);
  }
};

```
### Authentication
/path/middleware auth-middleware.js
```js 
const createError = require("../utils/createError");
const jwt = require("jsonwebtoken");

exports.authCheck = (req, res, next) => {
  {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        return createError(400, "Missing Token!!!");
      }

      const token = authorization.split(" ")[1];

      jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
        if (err) {
          return createError(401, "Unauthorized !!!");
        }

        req.user = decode;

        next();
      });
    } catch (error) {
      next(error);
    }
  }
};
```
### Register and Login
controllers/auth-controllers.js
```js
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    const checkEmail = await prisma.profile.findFirst({
      where: {
        email: email,
      },
    });

    if (checkEmail) {
      return createError(400, "Email is already exits!!!");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const profile = await prisma.profile.create({
      data: {
        email: email,
        password: hashedPassword,
        firstname: firstname,
        lastname: lastname,
      },
    });

    res.json({ message: "Register SuccessFully"});
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const profile = await prisma.profile.findFirst({
      where: {
        email: email,
      },
    });

    if (!profile) {
      return createError(400, "Email and Password invalid!!!");
    }

    const isMatch = bcrypt.compareSync(password, profile.password);

    if (!isMatch) {
      return createError(400, "Email and Password is invalid!!!");
    }

    const payload = {
      id: profile.id,
      email: profile.email,
      firstname: profile.firstname,
      lastname: profile.lastname,
      role: profile.role,
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "30d",
    });

    res.json({ message: "Login", payload: payload, token: token });
  } catch (error) {
    next(error);
  }
};

exports.currentUser = (req, res, next) => {
    try {
        res.json({message: "Hello, current User"})
    } catch (error) {
        next(error)
    }
}
```
routes/auth-routes.js
```js
const express = require("express");
const authControllers = require("../controllers/auth-controllers");
const {
  registerSchema,
  loginSchema,
  validateWithZod,
} = require("../middleware/validators");
const { authCheck } = require("../middleware/auth-middleware");

const router = express.Router();

router.post(
  "/register",
  validateWithZod(registerSchema),
  authControllers.register
);
router.post("/login", validateWithZod(loginSchema), authControllers.login);
router.get("/current-user", authCheck, authControllers.currentUser);

module.exports = router;

```
## Step 7 API user
controllers/user-controllers.js
```js
const prisma = require("../config/prisma");

exports.listUser = async (req, res, next) => {
  try {
    const users = await prisma.profile.findMany({
      omit: {
        password: true,
      },
    });

    res.json({ result: users });
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id, role } = req.body;

    const updated = await prisma.profile.update({
      where: { id: Number(id) },
      data: { role: role },
    });

    res.json({ message: "Update Success" });
  } catch (error) {
    next(error);
  }
};

exports.dateleUser = async (req, res, next) => {
    try {
        const { id } = req.body;

        const deleted = await prisma.profile.delete({
          where: {
            id: Number(id),
          },
        });

        res.json({message: "Delete Success"})
        
    } catch (error) {
        next(error)
    }
}
```
routes/user-routes.js
```js
const express = require("express")
const userControllers = require("../controllers/user-controllers")
const { authCheck } = require("../middleware/auth-middleware");

const router = express.Router()

router.get("/users", authCheck, userControllers.listUser)
router.patch("/user/update-role", authCheck, userControllers.updateRole)
router.delete("user/:id", authCheck, userControllers.dateleUser)

module.exports = router
```
index.js
```js
// import Routes
const userRoutes = require("./routes/user-routes")

// Routes
app.use("/api", userRoutes)
```
