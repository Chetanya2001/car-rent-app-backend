const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      amount: DataTypes.DECIMAL(10, 2),
      payment_method: { type: DataTypes.ENUM("upi", "card", "cash") },
      transaction_id: DataTypes.STRING,
      status: { type: DataTypes.ENUM("pending", "completed", "failed") },
    },
    { timestamps: true }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, { foreignKey: "booking_id" });
  };

  return Payment;
};
