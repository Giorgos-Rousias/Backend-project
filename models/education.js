const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./user");

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

// Education.belongsTo(User, { foreignKey: "userId" });

module.exports = Education;
