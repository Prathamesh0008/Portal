import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    courier: {
      type: String,
      enum: ['DPD', 'FEDEX'],
      required: true,
    },
    trackingNumber: String,
    labelUrl: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    events: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: String,
        description: String,
      },
    ],
    internalNotes: String,
    returnReason: String,
    isReturned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
