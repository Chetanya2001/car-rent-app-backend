const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const IntercityBooking = sequelize.define("IntercityBooking", {
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

    pax: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    luggage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    distance_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    driver_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return IntercityBooking;
};
