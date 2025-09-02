const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserBankDetails = sequelize.define(
    "UserBankDetails",
    {
      account_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ifsc: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { timestamps: true }
  );

  UserBankDetails.associate = (models) => {
    UserBankDetails.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return UserBankDetails;
};
