const {
  sequelize,
  Booking,
  SelfDriveBooking,
  IntercityBooking,
  User,
  Car,
} = require("../models");

exports.createSelfDriveBooking = async (data) => {
  return sequelize.transaction(async (t) => {
    const booking = await Booking.create(
      {
        guest_id: data.guest_id,
        car_id: data.car_id,
        total_amount: data.total_amount,
        booking_type: "SELF_DRIVE",
      },
      { transaction: t }
    );

    const selfDrive = await SelfDriveBooking.create(
      {
        ...data.selfDrive,
        booking_id: booking.id,
      },
      { transaction: t }
    );

    return { booking, selfDrive };
  });
};

exports.createIntercityBooking = async (data) => {
  return sequelize.transaction(async (t) => {
    const booking = await Booking.create(
      {
        guest_id: data.guest_id,
        car_id: data.car_id,
        total_amount: data.total_amount,
        booking_type: "INTERCITY",
      },
      { transaction: t }
    );

    const intercity = await IntercityBooking.create(
      {
        ...data.intercity,
        booking_id: booking.id,
      },
      { transaction: t }
    );

    return { booking, intercity };
  });
};
