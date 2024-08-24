const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Education = sequelize.define(
  "Education",
  {
    institution: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    endYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: true,
  }
);

module.exports = Education;
