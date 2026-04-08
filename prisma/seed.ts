import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('--- Create a new user ---\n');

  const name = await ask('Name: ');
  const email = await ask('Email: ');
  const password = await ask('Password: ');

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log('Email already in use');
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: 'ADMIN' },
  });

  console.log(`\nUser created: ${user.name} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
