const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserDocuments = sequelize.define(
    "UserDocuments",
    {
      user_id: {
        type: DataTypes.INTEGER, // Match User PK type
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      doc_type: {
        type: DataTypes.ENUM(
          "Passport",
          "Driver's License",
          "National ID Card",
          "Voter Card",
          "PAN Card",
          "Other"
        ),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING, // Path or URL to uploaded image
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM("Pending", "Verified", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
    },
    { timestamps: true }
  );

  UserDocuments.associate = (models) => {
    UserDocuments.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return UserDocuments;
};
