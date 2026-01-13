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

      insure_amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    { timestamps: true }
  );

  SelfDriveBooking.associate = (models) => {
    SelfDriveBooking.belongsTo(models.Booking, {
      foreignKey: "booking_id",
    });
  };

  return SelfDriveBooking;
};
