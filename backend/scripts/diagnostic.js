import mongoose from 'mongoose';

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentforgeai';
    const conn = await mongoose.connect(uri);
    const db = conn.connection.db;
    
    const jobs = await db.collection('jobs').find({}).toArray();
    
    console.log('TOTAL JOBS:', jobs.length);
    console.log('--------------------------------------------------');
    
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`);
      console.log(`  Title: ${job.title || 'MISSING'}`);
      console.log(`  Company: ${job.companyName || 'MISSING'}`);
      console.log(`  SalaryMin: ${job.salaryMin !== undefined ? job.salaryMin : 'MISSING'}`);
      console.log(`  Location: ${job.location || 'MISSING'}`);
      console.log(`  CreatedAt: ${job.createdAt || 'MISSING'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
