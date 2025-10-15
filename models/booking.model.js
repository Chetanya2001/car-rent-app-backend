const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Booking = sequelize.define(
    "Booking",
    {
      start_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      pickup_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pickup_lat: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
      },
      pickup_long: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
      },
      drop_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      drop_lat: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
      },
      drop_long: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
      },
      insure_amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      driver_amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("initiated", "booked", "cancelled", "completed"),
        allowNull: false,
        defaultValue: "initiated",
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
