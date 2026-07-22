import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      minlength: [3, 'Job title must be at least 3 characters'],
      maxlength: [150, 'Job title cannot exceed 150 characters'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'open', 'closed'],
      default: 'draft',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job creator (User ID) is required'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * WHY: Candidates will primarily query the platform to list available jobs. 
 * The business rule restricts their view strictly to `status: "open"`, and 
 * the product requirement dictates a default sorting of `createdAt DESC` 
 * (newest first). A compound index on `{ status: 1, createdAt: -1 }` allows 
 * MongoDB to efficiently satisfy the filter AND the sort simultaneously without 
 * needing an in-memory sort operation.
 */
jobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
