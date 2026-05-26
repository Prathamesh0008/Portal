import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    company: String,
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    houseNumber: String,
    addition: String,
    extraInfo: String,
    email: {
      type: String,
      required: true,
    },
    countryCode: String,
    phone: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

recipientSchema.index(
  { customerId: 1, email: 1, address: 1, postalCode: 1, houseNumber: 1 },
  { unique: true }
);

export default mongoose.models.Recipient || mongoose.model('Recipient', recipientSchema);
