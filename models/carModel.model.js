module.exports = (sequelize, DataTypes) => {
  const CarModel = sequelize.define(
    "CarModel",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      make_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      model_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "name", // ← maps to DB column
      },

      variant_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "variant_name",
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
        field: "body_type",
      },

      mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "mileage",
      },

      transmission: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "transmission",
      },

      seats: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "seats",
      },

      luggage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "luggage",
      },

      fuel: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "fuel",
      },

      car_range: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "car_range",
      },
    },
    {
      tableName: "CarModels",
      timestamps: true,
    },
  );

  CarModel.associate = (models) => {
    CarModel.belongsTo(models.CarMake, { foreignKey: "make_id" });
    CarModel.hasMany(models.Car, { foreignKey: "model_id" });
  };

  return CarModel;
};
