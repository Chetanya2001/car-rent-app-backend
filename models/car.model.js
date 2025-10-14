const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Car = sequelize.define(
    "Car",
    {
      make: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kms_driven: {
        type: DataTypes.INTEGER,
        allowNull: true, // optional at creation
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "rejected",
          "active",
          "inactive"
        ),
        defaultValue: "pending", // ✅ default when new car is added
      },
      price_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // optional
        defaultValue: null,
      },
      available_from: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      available_till: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      description: {
        type: DataTypes.TEXT, // ✅ allows long description
        allowNull: true,
        defaultValue: null,
      },
    },
    { timestamps: true }
  );

  Car.associate = (models) => {
    Car.belongsTo(models.User, { as: "host", foreignKey: "host_id" });
    Car.hasOne(models.CarDocument, { foreignKey: "car_id", as: "documents" });
    Car.hasMany(models.Booking, { foreignKey: "car_id" });
    Car.hasOne(models.CarLocation, { foreignKey: "car_id" });
    Car.hasMany(models.CarPhoto, { foreignKey: "car_id", as: "photos" });
    Car.hasOne(models.CarFeatures, { foreignKey: "car_id", as: "features" });
  };

  return Car;
};
