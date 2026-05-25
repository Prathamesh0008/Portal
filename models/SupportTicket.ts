import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['DELIVERY', 'BILLING', 'DAMAGE', 'OTHER'],
      default: 'OTHER',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate ticket number before required field validation runs.
supportTicketSchema.pre('validate', async function () {
  if (!this.ticketNumber) {
    const count = await mongoose.models.SupportTicket?.countDocuments() || 0;
    this.ticketNumber = `TKT-${Date.now()}-${count + 1}`;
  }
});

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
