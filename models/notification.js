const sequelize = require("../sequelize");

const Notification = sequelize.define("notification", {
    type: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        validate: {
            isIn: [["like", "comment", "friendRequest"]],
        },
    },
    sourceId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
    },
    userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
    },
    content: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
    },
    read: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
});

module.exports = Notification;