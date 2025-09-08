const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Car = sequelize.define(
    "Car",
    {
      make: DataTypes.STRING,
      model: DataTypes.STRING,
      year: DataTypes.INTEGER,
      kms_driven: DataTypes.INTEGER,
      rc_number: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "rejected",
          "active",
          "inactive"
        ),
      },
      price_per_hour: {
        type: DataTypes.DECIMAL(10, 2), // 👈 stores price like 250.00
        allowNull: false,
      },
    },
    { timestamps: true }
  );

  Car.associate = (models) => {
    Car.belongsTo(models.User, { as: "host", foreignKey: "host_id" });
    Car.hasOne(models.CarDocument, { foreignKey: "car_id" });
    Car.hasMany(models.Booking, { foreignKey: "car_id" });
    Car.hasOne(models.CarLocation, { foreignKey: "car_id" });
    Car.hasMany(models.CarPhoto, { foreignKey: "car_id" });
  };

  return Car;
};
