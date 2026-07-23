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
    companyName: {
      type: String,
      trim: true,
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    workplaceType: {
      type: String,
      enum: ['Remote', 'Hybrid', 'Onsite'],
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    salaryCurrency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior'],
    },
    applicationDeadline: {
      type: Date,
    },
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
 * Schema-level validation for salary range.
 * WHY: This guarantees data integrity at the lowest level. Relying solely on UI
 * or controller validation allows bad data to slip in through scripts or bugs.
 * If both min and max are provided, max must be logically greater or equal to min.
 */
jobSchema.pre('validate', function (next) {
  if (this.salaryMin != null && this.salaryMax != null) {
    if (this.salaryMax < this.salaryMin) {
      this.invalidate('salaryMax', 'salaryMax must be greater than or equal to salaryMin');
    }
  }
  next();
});

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
