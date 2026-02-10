const bookingService = require("../services/car-service.service");
const { ChecklistItem, ServiceBooking } = require("../models");

exports.createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking({
      car_id: req.body.car_id,
      user_id: req.user.id,
      plan_id: req.body.plan_id,
      scheduled_at: req.body.scheduled_at,
    });

    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getChecklist = async (req, res) => {
  const items = await ChecklistItem.findAll({
    where: { booking_id: req.params.id },
  });

  res.json(items);
};

exports.updateChecklistItem = async (req, res) => {
  const item = await ChecklistItem.findByPk(req.params.itemId);

  item.status = req.body.status;
  item.remarks = req.body.remarks;
  item.completed_at = new Date();

  await item.save();

  res.json(item);
};

exports.completeBooking = async (req, res) => {
  const booking = await ServiceBooking.findByPk(req.params.id);

  booking.status = "completed";
  booking.completed_at = new Date();

  await booking.save();

  res.json({ message: "Service completed" });
};
