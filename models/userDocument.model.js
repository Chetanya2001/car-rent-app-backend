const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserDocuments = sequelize.define(
    "UserDocuments",
    {
      doc_type: {
        type: DataTypes.ENUM("DL", "GovtID"),
        allowNull: false,
      },
      image_fr: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_bk: {
        type: DataTypes.STRING,
        allowNull: true,
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
