import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const baseModels = [
  {
    id: 'phi-3-mini',
    name: 'Phi-3 Mini 4K Instruct',
    hfModelId: 'microsoft/Phi-3-mini-4k-instruct',
    description: "Microsoft's compact 3.8B model, excellent for instruction following",
    paramCount: '3.8B',
    maxVram: 8,
    targetModules: JSON.stringify([
      'q_proj', 'k_proj', 'v_proj', 'o_proj',
      'gate_proj', 'up_proj', 'down_proj'
    ]),
    isActive: true,
  },
  {
    id: 'gemma-2-2b',
    name: 'Gemma 2 2B Instruct',
    hfModelId: 'google/gemma-2-2b-it',
    description: "Google's efficient 2B model with strong reasoning",
    paramCount: '2B',
    maxVram: 6,
    targetModules: JSON.stringify([
      'q_proj', 'k_proj', 'v_proj', 'o_proj',
      'gate_proj', 'up_proj', 'down_proj'
    ]),
    isActive: true,
  },
  {
    id: 'llama-3.2-3b',
    name: 'Llama 3.2 3B Instruct',
    hfModelId: 'meta-llama/Llama-3.2-3B-Instruct',
    description: "Meta's Llama 3.2 3B, great balance of size and performance",
    paramCount: '3B',
    maxVram: 8,
    targetModules: JSON.stringify([
      'q_proj', 'k_proj', 'v_proj', 'o_proj',
      'gate_proj', 'up_proj', 'down_proj'
    ]),
    isActive: true,
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B Instruct v0.3',
    hfModelId: 'mistralai/Mistral-7B-Instruct-v0.3',
    description: 'Mistral 7B, high performance instruction model',
    paramCount: '7B',
    maxVram: 16,
    targetModules: JSON.stringify([
      'q_proj', 'k_proj', 'v_proj', 'o_proj',
      'gate_proj', 'up_proj', 'down_proj'
    ]),
    isActive: true,
  },
  {
    id: 'qwen2.5-3b',
    name: 'Qwen2.5 3B Instruct',
    hfModelId: 'Qwen/Qwen2.5-3B-Instruct',
    description: "Alibaba's Qwen2.5 3B, multilingual and code-capable",
    paramCount: '3B',
    maxVram: 8,
    targetModules: JSON.stringify([
      'q_proj', 'k_proj', 'v_proj', 'o_proj',
      'gate_proj', 'up_proj', 'down_proj'
    ]),
    isActive: true,
  },
];

async function main() {
  console.log('Starting database seed...');

  for (const model of baseModels) {
    await prisma.baseModel.upsert({
      where: { id: model.id },
      update: model,
      create: model,
    });
    console.log(`Seeded BaseModel: ${model.name}`);
  }

  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
