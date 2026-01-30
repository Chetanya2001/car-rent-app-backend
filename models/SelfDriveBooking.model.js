const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SelfDriveBooking = sequelize.define(
    "SelfDriveBooking",
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

      // ✅ Pricing breakdown
      hourly_rate_snapshot: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      base_amount: {
        type: DataTypes.INTEGER,
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

      drop_charge: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      gst_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { timestamps: true },
  );

  SelfDriveBooking.associate = (models) => {
    SelfDriveBooking.belongsTo(models.Booking, {
      foreignKey: "booking_id",
    });
  };

  return SelfDriveBooking;
};
