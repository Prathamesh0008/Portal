import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    routeType: {
      type: String,
      enum: ['EU_TO_EU', 'EU_TO_US'],
      required: true,
    },
    courier: {
      type: String,
      enum: ['DPD', 'FEDEX'],
      required: true,
    },
    // Sender Details
    senderFirstName: String,
    senderLastName: String,
    senderCompany: String,
    senderCountry: String,
    senderCity: String,
    senderPostalCode: String,
    senderAddress: String,
    senderHouseNumber: String,
    senderAddition: String,
    senderExtraInfo: String,
    senderEmail: String,
    senderCountryCode: String,
    senderPhone: String,
    senderReference: String,

    // Receiver Details
    receiverFirstName: String,
    receiverLastName: String,
    receiverCompany: String,
    receiverCountry: String,
    receiverCity: String,
    receiverPostalCode: String,
    receiverAddress: String,
    receiverHouseNumber: String,
    receiverAddition: String,
    receiverExtraInfo: String,
    receiverEmail: String,
    receiverCountryCode: String,
    receiverPhone: String,
    receiverReference: String,

    // Product Details
    productName: String,
    productSent: String,
    quantity: Number,
    weight: Number, // in kg
    length: Number, // in cm
    width: Number, // in cm
    height: Number, // in cm
    parcelCount: {
      type: Number,
      default: 1,
    },
    notes: String,

    // Status and Tracking
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'PROCESSING',
        'LABEL_CREATED',
        'SHIPPED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },
    trackingId: String,
    labelUrl: String,
    estimatedDeliveryDate: Date,

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: String,
    shippingNotes: String,

    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

// Auto-generate order number before required field validation runs.
orderSchema.pre('validate', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order?.countDocuments() || 0;
    this.orderNumber = String(10001 + count);
  }
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
