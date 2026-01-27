const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Booking = sequelize.define(
    "Booking",
    {
      booking_type: {
        type: DataTypes.ENUM("SELF_DRIVE", "INTERCITY"),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"),
        allowNull: false,
        defaultValue: "CONFIRMED",
      },

      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      paid_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      payment_status: {
        type: DataTypes.ENUM("PAID", "REFUNDED"),
        allowNull: false,
        defaultValue: "PAID",
      },

      cancelled_reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { timestamps: true },
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      as: "guest",
      foreignKey: "guest_id",
    });

    Booking.belongsTo(models.Car, {
      foreignKey: "car_id",
    });

    Booking.hasOne(models.Payment, {
      foreignKey: "booking_id",
    });

    Booking.hasOne(models.SelfDriveBooking, {
      foreignKey: "booking_id",
    });

    Booking.hasOne(models.IntercityBooking, {
      foreignKey: "booking_id",
    });
  };

  return Booking;
};
