const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      type: {
        type: DataTypes.ENUM(
          "booking_update",
          "payment_update",
          "validation_update"
        ),
      },
      message: DataTypes.TEXT,
      is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { timestamps: true }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Notification;
};
