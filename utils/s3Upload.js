const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadToS3(file) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET, // your bucket name
    Key: `${uuidv4()}-${file.originalname}`, // unique file name
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const data = await s3.upload(params).promise();
  return data.Location; // this is the file URL
}

module.exports = { uploadToS3 };
