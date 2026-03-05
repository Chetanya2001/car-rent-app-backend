module.exports = (sequelize, DataTypes) => {
  const TradeRequest = sequelize.define("TradeRequest", {
    // Price Range
    min_amount: DataTypes.DECIMAL(10, 2),
    max_amount: DataTypes.DECIMAL(10, 2),

    // Vehicle Preferences
    preferred_make: DataTypes.STRING,
    preferred_model: DataTypes.STRING,
    min_year: DataTypes.INTEGER,
    max_year: DataTypes.INTEGER,
    min_kms_driven: DataTypes.INTEGER,
    max_kms_driven: DataTypes.INTEGER,

    // Vehicle Specs
    fuel_type: {
      type: DataTypes.ENUM(
        "petrol",
        "diesel",
        "electric",
        "hybrid",
        "cng",
        "lpg",
      ),
      allowNull: true,
    },
    body_type: {
      type: DataTypes.ENUM(
        "sedan",
        "suv",
        "hatchback",
        "coupe",
        "convertible",
        "wagon",
        "van",
        "truck",
        "pickup",
      ),
      allowNull: true,
    },
    transmission: {
      type: DataTypes.ENUM("manual", "automatic", "cvt", "semi-automatic"),
      allowNull: true,
    },
    color: DataTypes.STRING,

    // Additional Preferences
    features: {
      type: DataTypes.JSON, // e.g. ["sunroof", "leather seats", "apple carplay"]
      allowNull: true,
    },
    seats: DataTypes.INTEGER,
    owner: {
      type: DataTypes.ENUM("first", "second", "third", "fourth_or_more"),
      allowNull: true,
    },

    // Availability
    availability: {
      type: DataTypes.ENUM("instock", "booked", "upcoming"),
      defaultValue: "instock",
    },

    // Metadata
    city: DataTypes.STRING,
    notes: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("open", "matched", "closed", "cancelled"),
      defaultValue: "open",
    },
  });

  TradeRequest.associate = (models) => {
    TradeRequest.belongsTo(models.User, {
      foreignKey: "buyer_id",
      as: "buyer",
    });

    TradeRequest.hasMany(models.TradeOffer, {
      foreignKey: "request_id",
      as: "offers",
    });
  };

  return TradeRequest;
};
