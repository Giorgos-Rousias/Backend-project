const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./user");
const Listing = require("./listing");

// Define the UserFriends junction table
const SeenListings = sequelize.define("SeenListings", {
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: "id",
        },
        onDelete: "CASCADE",
        primaryKey: true, // Composite primary key with listingId

    },
    listingId: {
        type: DataTypes.INTEGER,
        references: {
            model: Listing,
            key: "id",
        },
        onDelete: "CASCADE",
        primaryKey: true, // Composite primary key with listingId
    },
});

module.exports = SeenListings;
