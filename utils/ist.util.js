// At the top of your cron file
function toIST(date) {
  if (!date) return "missing";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

// Then in logs:
console.log(
  `  Start (IST): ${toIST(booking.SelfDriveBooking?.start_datetime)}`,
);
