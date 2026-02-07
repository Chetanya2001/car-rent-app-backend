// models/CarModel.js
module.exports = (sequelize, DataTypes) => {
  const CarModel = sequelize.define(
    "CarModel",
    {
      model_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      variant_name: {
        type: DataTypes.STRING,
        allowNull: false, // Base / Top / ZX / Sport
      },

      body_type: {
        type: DataTypes.ENUM(
          "hatchback",
          "sedan",
          "suv",
          "muv",
          "coupe",
          "convertible",
          "pickup",
          "van",
        ),
        allowNull: false,
      },

      mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      transmission: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      seats: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      luggage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      fuel: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      car_range: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { timestamps: true },
  );

  CarModel.associate = (models) => {
    CarModel.belongsTo(models.CarMake, { foreignKey: "make_id" });
    CarModel.hasMany(models.Car, { foreignKey: "model_id" });
  };

  return CarModel;
};
