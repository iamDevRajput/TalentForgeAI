/**
 * seed-demo.js — Creates realistic demo data for TalentForgeAI
 * Run: node scripts/seed-demo.js
 */

import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Inline schemas (avoid circular imports) ─────────────────────────────────

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'candidate' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  department: String,
  requirements: [String],
  status: { type: String, default: 'open' },
  createdBy: mongoose.Schema.Types.ObjectId,
  companyName: String,
  companyLogo: String,
  location: String,
  workplaceType: { type: String, enum: ['Remote', 'Hybrid', 'Onsite'] },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'] },
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: { type: String, default: 'INR' },
  experienceLevel: { type: String, enum: ['1-3 Years', '3-5 Years', '5-8 Years'] },
  applicationDeadline: Date,
  skills: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Job = mongoose.model('Job', jobSchema);

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_JOBS = [
  {
    companyName: 'Google',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    description: 'Build next-generation web experiences for Google Search and Workspace products used by billions.',
    location: 'Bengaluru, Karnataka',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 4000000,
    salaryMax: 7000000,
    salaryCurrency: 'INR',
    experienceLevel: '5-8 Years',
    skills: ['React', 'TypeScript', 'GraphQL', 'Performance Optimization'],
    requirements: ['5+ years React experience', 'TypeScript expertise', 'GraphQL knowledge'],
    status: 'open',
  },
  {
    companyName: 'Microsoft',
    title: 'Backend Engineer — Azure',
    department: 'Cloud Platform',
    description: 'Design and build scalable microservices for Microsoft Azure cloud infrastructure.',
    location: 'Hyderabad, Telangana',
    workplaceType: 'Onsite',
    employmentType: 'Full-time',
    salaryMin: 3500000,
    salaryMax: 6000000,
    salaryCurrency: 'INR',
    experienceLevel: '3-5 Years',
    skills: ['Node.js', 'Go', 'Kubernetes', 'Azure', 'PostgreSQL'],
    requirements: ['3+ years backend experience', 'Cloud-native architecture', 'Kubernetes proficiency'],
    status: 'open',
  },
  {
    companyName: 'Amazon',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    description: 'Maintain and evolve AWS infrastructure supporting millions of daily transactions across India.',
    location: 'Mumbai, Maharashtra',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    salaryMin: 3000000,
    salaryMax: 5500000,
    salaryCurrency: 'INR',
    experienceLevel: '3-5 Years',
    skills: ['AWS', 'Terraform', 'Docker', 'CI/CD', 'Python'],
    requirements: ['4+ years DevOps/SRE', 'AWS certifications preferred', 'Terraform IaC'],
    status: 'open',
  },
  {
    companyName: 'Atlassian',
    title: 'Product Designer',
    department: 'Design',
    description: 'Shape the future of collaborative work tools — Jira, Confluence, Trello — used by millions of teams.',
    location: 'Bengaluru, Karnataka',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 2800000,
    salaryMax: 5000000,
    salaryCurrency: 'INR',
    experienceLevel: '3-5 Years',
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
    requirements: ['3+ years product design', 'Strong portfolio', 'Design systems experience'],
    status: 'open',
  },
  {
    companyName: 'Razorpay',
    title: 'QA Automation Engineer',
    department: 'Quality Assurance',
    description: 'Ensure payment reliability at scale through comprehensive automated testing pipelines.',
    location: 'Bengaluru, Karnataka',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 1800000,
    salaryMax: 3200000,
    salaryCurrency: 'INR',
    experienceLevel: '1-3 Years',
    skills: ['Selenium', 'Cypress', 'Jest', 'Python', 'API Testing'],
    requirements: ['1-2 years QA automation', 'Selenium/Cypress', 'API testing knowledge'],
    status: 'open',
  },
  {
    companyName: 'Swiggy',
    title: 'Machine Learning Engineer',
    department: 'Data & AI',
    description: 'Build recommendation systems and demand forecasting models that power food delivery logistics.',
    location: 'Bengaluru, Karnataka',
    workplaceType: 'Onsite',
    employmentType: 'Full-time',
    salaryMin: 3500000,
    salaryMax: 6500000,
    salaryCurrency: 'INR',
    experienceLevel: '3-5 Years',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Spark', 'MLflow'],
    requirements: ['3+ years ML engineering', 'Production ML systems', 'Python expertise'],
    status: 'open',
  },
  {
    companyName: 'Zomato',
    title: 'iOS Engineer',
    department: 'Mobile Engineering',
    description: 'Build the consumer-facing iOS app used by 20M+ monthly active users ordering food across India.',
    location: 'Gurgaon, Haryana',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 2500000,
    salaryMax: 4500000,
    salaryCurrency: 'INR',
    experienceLevel: '3-5 Years',
    skills: ['Swift', 'SwiftUI', 'UIKit', 'CoreData', 'Instruments'],
    requirements: ['3+ years iOS', 'Swift proficiency', 'App Store deployment experience'],
    status: 'open',
  },
  {
    companyName: 'Flipkart',
    title: 'Product Manager — Payments',
    department: 'Product',
    description: "Own the end-to-end payments and checkout experience for India's largest e-commerce platform.",
    location: 'Bengaluru, Karnataka',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salaryMin: 4500000,
    salaryMax: 8000000,
    salaryCurrency: 'INR',
    experienceLevel: '5-8 Years',
    skills: ['Product Strategy', 'Payments', 'Data Analysis', 'Stakeholder Management'],
    requirements: ['5+ years PM experience', 'Payments domain expertise', 'Strong analytical skills'],
    status: 'open',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentforgeai';
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected!\n');

  // Find or create an HR user
  let hrUser = await User.findOne({ role: 'hr' });
  if (!hrUser) {
    const hash = await bcrypt.hash('Password123', 12);
    hrUser = await User.create({
      name: 'Demo HR Admin',
      email: 'hr@talentforge.demo',
      passwordHash: hash,
      role: 'hr',
    });
    console.log('👤 Created HR user:', hrUser.email, '/ Password: Password123');
  } else {
    console.log('👤 Using existing HR user:', hrUser.email);
  }

  // Delete ALL existing jobs
  const deleted = await Job.deleteMany({});
  console.log(`🗑  Deleted ${deleted.deletedCount} existing job(s)\n`);

  // Insert fresh demo jobs
  const created = await Job.insertMany(
    DEMO_JOBS.map(job => ({ ...job, createdBy: hrUser._id }))
  );

  console.log(`✨ Created ${created.length} demo jobs:\n`);
  created.forEach(j => console.log(`   ✅  ${j.companyName.padEnd(12)} — ${j.title}`));

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete!');
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
