// Dev convenience: seeds one admin user, a couple of teams/agents, and routing
// rules so ticket creation has somewhere to route to on a fresh database.
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import RoutingRule from '../src/models/RoutingRule.js';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();

  const teamsData = [
    { name: 'Billing', categories: ['Billing', 'Refunds'] },
    { name: 'Technical Support', categories: ['Technical', 'Bug'] },
    { name: 'General Support', categories: ['General'] },
  ];

  const teams = {};
  for (const t of teamsData) {
    const team = await Team.findOneAndUpdate({ name: t.name }, t, { upsert: true, new: true });
    teams[t.name] = team;
  }

  const routingRules = [
    { category: 'Billing', teamId: teams['Billing']._id, priorityWeight: 1 },
    { category: 'Refunds', teamId: teams['Billing']._id, priorityWeight: 1 },
    { category: 'Technical', teamId: teams['Technical Support']._id, priorityWeight: 1 },
    { category: 'Bug', teamId: teams['Technical Support']._id, priorityWeight: 1 },
    { category: 'General', teamId: teams['General Support']._id, priorityWeight: 1 },
  ];
  for (const rule of routingRules) {
    await RoutingRule.findOneAndUpdate({ category: rule.category }, rule, { upsert: true });
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await User.findOneAndUpdate(
    { email: 'admin@supportiq.dev' },
    { name: 'Admin User', email: 'admin@supportiq.dev', role: 'admin', passwordHash },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'agent.billing@supportiq.dev' },
    { name: 'Billing Agent', email: 'agent.billing@supportiq.dev', role: 'agent', teamId: teams['Billing']._id, passwordHash },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'agent.tech@supportiq.dev' },
    { name: 'Tech Agent', email: 'agent.tech@supportiq.dev', role: 'agent', teamId: teams['Technical Support']._id, passwordHash },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'agent.general@supportiq.dev' },
    { name: 'General Agent', email: 'agent.general@supportiq.dev', role: 'agent', teamId: teams['General Support']._id, passwordHash },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'customer@supportiq.dev' },
    { name: 'Demo Customer', email: 'customer@supportiq.dev', role: 'customer', passwordHash },
    { upsert: true }
  );

  console.log('Seed complete.');
  console.log('Login with any of the seeded emails and password: Password123!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
