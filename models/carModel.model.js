// models/CarModel.js
module.exports = (sequelize, DataTypes) => {
  const CarModel = sequelize.define("CarModel", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
  });

  CarModel.associate = (models) => {
    CarModel.belongsTo(models.CarMake, { foreignKey: "make_id" });
    CarModel.hasMany(models.CarVariant, { foreignKey: "model_id" });
  };

  return CarModel;
};
