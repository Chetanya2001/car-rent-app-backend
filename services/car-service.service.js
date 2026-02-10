const { ServiceBooking, ServicePlan } = require("../models");
const { cloneChecklist } = require("./checklist.service");

exports.createBooking = async ({ car_id, user_id, plan_id, scheduled_at }) => {
  const plan = await ServicePlan.findByPk(plan_id);

  if (!plan) throw new Error("Invalid plan");

  const booking = await ServiceBooking.create({
    car_id,
    user_id,
    plan_id,
    scheduled_at,
    total_price: plan.price,
  });

  await cloneChecklist(booking.id, plan_id);

  return booking;
};
