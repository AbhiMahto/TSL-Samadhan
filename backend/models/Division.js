const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure name is unique per location
DivisionSchema.index({ name: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Division', DivisionSchema);
