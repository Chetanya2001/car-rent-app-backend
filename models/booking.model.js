const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Booking = sequelize.define(
    "Booking",
    {
      start_datetime: DataTypes.DATE,
      end_datetime: DataTypes.DATE,
      pickup_address: DataTypes.TEXT,
      pickup_lat: DataTypes.DECIMAL(10, 6),
      pickup_long: DataTypes.DECIMAL(10, 6),
      drop_address: DataTypes.TEXT,
      drop_lat: DataTypes.DECIMAL(10, 6),
      drop_long: DataTypes.DECIMAL(10, 6),
      status: {
        type: DataTypes.ENUM("initiated", "booked", "cancelled", "completed"),
      },
    },
    { timestamps: true }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { as: "guest", foreignKey: "guest_id" });
    Booking.belongsTo(models.Car, { foreignKey: "car_id" });
    Booking.hasOne(models.Payment, { foreignKey: "booking_id" });
  };

  return Booking;
};
