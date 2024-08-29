const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Skill = sequelize.define(
  "Skill",
  {
    skill: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Skill;
