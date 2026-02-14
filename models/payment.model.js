const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define("Payment", {
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },

    payment_method: {
      type: DataTypes.ENUM("ZERO_RS", "RAZORPAY"),
      allowNull: false,
    },

    payment_gateway_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_gateway_payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
    },
  });
  Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, {
      foreignKey: "booking_id",
      as: "Booking", // ← must match the "as" you use in include
    });
  };

  return Payment;
};
