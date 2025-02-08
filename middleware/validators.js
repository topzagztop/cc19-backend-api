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
