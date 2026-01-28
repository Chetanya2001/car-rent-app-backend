const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BookingOTP = sequelize.define(
    "BookingOTP",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Bookings", // Name of the target table
          key: "id",
        },
      },
      otp_type: {
        type: DataTypes.ENUM("PICKUP", "DROP"),
        allowNull: false,
        unique: "uniq_booking_otp", // Composite unique key part 1
      },
      otp_code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verified_by: {
        type: DataTypes.ENUM("GUEST", "HOST", "DRIVER"),
        allowNull: true,
      },
    },
    {
      timestamps: true, // Automatically handles createdAt and updatedAt
      tableName: "BookingOTPs",
      indexes: [
        {
          unique: true,
          name: "uniq_booking_otp",
          fields: ["booking_id", "otp_type"],
        },
      ],
    },
  );

  BookingOTP.associate = (models) => {
    BookingOTP.belongsTo(models.Booking, {
      foreignKey: "booking_id",
      onDelete: "CASCADE",
    });
  };

  return BookingOTP;
};
