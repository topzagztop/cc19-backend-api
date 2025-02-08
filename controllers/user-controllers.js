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