import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDB, closeDB } from './db.js';
import { User } from './models.js';

function askHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal.');
  }
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
    };
    const onData = (buffer) => {
      for (const char of buffer.toString('utf8')) {
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Cancelled.'));
          return;
        }
        if (char === '\r' || char === '\n') {
          cleanup();
          resolve(value);
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else if (char >= ' ') {
          value += char;
        }
      }
    };
    stdin.on('data', onData);
  });
}

let connected = false;
try {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  rl.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');

  const password = await askHidden('New password (12+ characters, hidden): ');
  const confirmation = await askHidden('Confirm password: ');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  if (password !== confirmation) throw new Error('Passwords do not match.');

  await connectDB();
  connected = true;
  const existing = await User.findOne({ email }).exec();
  let admin = await User.findOne({ role: 'Admin' }).exec();
  if (existing && (!admin || !existing._id.equals(admin._id))) {
    throw new Error('That email already belongs to another account. Choose a different email.');
  }
  if (!admin) admin = new User({ name: 'IT Administrator', role: 'Admin', department: 'IT' });
  admin.email = email;
  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.isActive = true;
  await admin.save();
  console.log('Admin account created/updated. Keep PUBLIC_DEMO=false on Render to use this login.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connected) await closeDB();
}