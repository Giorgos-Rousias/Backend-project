const sequelize = require("../sequelize");

const Listing = sequelize.define("Listing", {
    title: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false,
    },
    company: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
    },
    location: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
    },
    salary: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
    },
    userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
    }
}, {
    timestamps: true,
}
);

module.exports = Listing;