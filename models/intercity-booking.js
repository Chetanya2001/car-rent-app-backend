const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const IntercityBooking = sequelize.define(
    "IntercityBooking",
    {
      pickup_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      pickup_city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      pickup_station: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      drop_city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Optional: can be null for city-center drops
      drop_station: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      pax: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 6,
        },
      },

      luggage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 5,
        },
      },

      distance_km: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true, // calculated later (Google Maps)
      },

      base_fare: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      driver_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // always included
      },

      insure_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: DataTypes.ENUM("initiated", "booked", "cancelled", "completed"),
        allowNull: false,
        defaultValue: "initiated",
      },
    },
    {
      tableName: "intercity_bookings",
      timestamps: true,
    }
  );

  IntercityBooking.associate = (models) => {
    IntercityBooking.belongsTo(models.User, {
      as: "guest",
      foreignKey: "guest_id",
    });

    IntercityBooking.belongsTo(models.Car, {
      foreignKey: "car_id",
    });

    IntercityBooking.hasOne(models.Payment, {
      foreignKey: "intercity_booking_id",
    });
  };

  return IntercityBooking;
};
