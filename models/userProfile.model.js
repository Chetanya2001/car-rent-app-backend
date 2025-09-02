const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserProfile = sequelize.define(
    "UserProfile",
    {
      profile_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.JSON, // stores multiple addresses in JSON format
        allowNull: true,
      },
    },
    { timestamps: true }
  );

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return UserProfile;
};
