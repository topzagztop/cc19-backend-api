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