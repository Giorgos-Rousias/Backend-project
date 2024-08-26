const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Skill = sequelize.define(
  "Skill",
  {
    skill: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  },
  {
    timestamps: true,
  }
);

module.exports = Skill;
