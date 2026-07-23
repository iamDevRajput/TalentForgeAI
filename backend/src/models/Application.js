import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    resume: {
      url: { type: String, required: true },
      originalFilename: { type: String, required: true },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      uploadedAt: { type: Date, required: true }
    },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected'],
      default: 'applied',
    },

  },
  { timestamps: true }
);

// Compound UNIQUE index: one application per candidate per job
// WHY: This ensures a race condition (two simultaneous submit clicks) is caught 
// by MongoDB itself, not by a pre-check-then-insert pattern that could have a gap.
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
