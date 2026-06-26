import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

async function seedUserProjects(userId: string, prefix: string) {
  // 1. Create medical project (completed)
  const medProject = await prisma.project.create({
    data: {
      id: `${prefix}-proj-medical-qa`,
      userId,
      name: 'Clinical Diagnosis QA',
      description: 'Fine-tuning Phi-3 on medical diagnosis instruction sets to improve accuracy on clinical QA tasks.',
      baseModelId: 'phi-3-mini',
      status: 'completed',
    },
  });

  // Seed dataset for medical project
  const medRows = [
    { id: 'm1', instruction: 'Explain the difference between Type 1 and Type 2 diabetes.', input: '', output: 'Type 1 diabetes is an autoimmune condition where the immune system destroys insulin-producing beta cells in the pancreas, requiring lifelong insulin therapy. Type 2 diabetes is characterized by insulin resistance, where cells fail to respond properly to insulin, and can often be managed through lifestyle, oral medications, or insulin.' },
    { id: 'm2', instruction: 'What are the classic symptoms of an acute myocardial infarction (heart attack)?', input: '', output: 'Classic symptoms include substernal chest pain or pressure (often radiating to the left arm, neck, or jaw), shortness of breath (dyspnea), diaphoresis (profuse sweating), nausea, vomiting, and a sense of impending doom.' },
    { id: 'm3', instruction: 'A patient presents with high fever, neck stiffness, and photophobia. What is the suspected condition?', input: '', output: 'The symptoms strongly suggest acute meningitis. Urgent lumbar puncture and initiate empiric broad-spectrum antibiotics and antivirals are indicated after blood cultures.' },
    { id: 'm4', instruction: 'Describe the mechanism of action of Metformin.', input: '', output: 'Metformin decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.' },
    { id: 'm5', instruction: 'What is the primary treatment for anaphylaxis?', input: '', output: 'The primary, first-line treatment is the immediate intramuscular injection of Epinephrine (usually 0.3mg to 0.5mg of 1:1000 solution in the anterolateral thigh).' },
  ];

  await prisma.dataset.create({
    data: {
      projectId: medProject.id,
      rowCount: medRows.length,
      formatted: true,
      rows: JSON.stringify(medRows),
    },
  });

  // Create training config for medical project
  await prisma.trainingConfig.create({
    data: {
      projectId: medProject.id,
      epochs: 3,
      learningRate: 0.0002,
      loraRank: 16,
      loraAlpha: 32,
      useQLoRA: true,
    },
  });

  // Generate historical loss metrics curve
  const medLossCurve = [
    { step: 10, epoch: 0.2, loss: 2.45, evalLoss: 2.6 },
    { step: 20, epoch: 0.4, loss: 1.95, evalLoss: 2.1 },
    { step: 30, epoch: 0.6, loss: 1.54, evalLoss: 1.7 },
    { step: 40, epoch: 0.8, loss: 1.12, evalLoss: 1.3 },
    { step: 50, epoch: 1.0, loss: 0.85, evalLoss: 0.95 },
    { step: 60, epoch: 1.2, loss: 0.67, evalLoss: 0.8 },
    { step: 75, epoch: 1.5, loss: 0.49, evalLoss: 0.65 },
    { step: 90, epoch: 1.8, loss: 0.35, evalLoss: 0.5 },
    { step: 100, epoch: 2.0, loss: 0.24, evalLoss: 0.42 },
    { step: 120, epoch: 2.4, loss: 0.18, evalLoss: 0.38 },
    { step: 150, epoch: 3.0, loss: 0.11, evalLoss: 0.34 },
  ];

  // Seed training job for medical project
  await prisma.job.create({
    data: {
      id: `${prefix}-job-medical-training`,
      projectId: medProject.id,
      type: 'training',
      status: 'completed',
      progress: 100,
      metrics: JSON.stringify({ loss: medLossCurve }),
      errorMessage: null,
      outputPath: 'models/proj-medical-qa/merged_gguf.bin',
      createdAt: new Date(Date.now() - 3600 * 24000), // 1 day ago
      completedAt: new Date(Date.now() - 3600 * 24000 + 34 * 60 * 1000),
    },
  });

  // Seed evaluation results for medical project
  const medComparisons = [
    {
      instruction: 'A 45-year-old male complains of crushing chest pain radiating to his left shoulder.',
      input: '',
      reference: 'Suspend myocardial infarction. Obtain urgent 12-lead ECG, check cardiac enzymes (Troponin), and administer aspirin immediately.',
      baseOutput: 'Crushing chest pain radiating to the shoulder can be due to many causes, including muscle strain, acid reflux, anxiety, or a panic attack. You should schedule an appointment with a doctor to discuss these symptoms or monitor if they get worse.',
      fineTunedOutput: 'CRITICAL: Suspect acute myocardial infarction (heart attack). Immediate action required: 1. Call emergency services (911). 2. Obtain an immediate 12-lead ECG. 3. Check serum troponin levels. 4. Administer chewable Aspirin (162-325mg) if not contraindicated. Do not wait for lab values to initiate basic monitoring.',
      bleu: 45.2,
      rougeL: 62.4,
    },
    {
      instruction: 'What is the dosage recommendation for metformin in a newly diagnosed adult Type 2 diabetic?',
      input: '',
      reference: 'Initiate at 500 mg orally once daily, titrating up by 500 mg weekly up to a maximum dose of 2000 mg/day as tolerated.',
      baseOutput: 'Metformin is typically prescribed by doctors for diabetes. The dosage is determined by your physician depending on your weight, blood sugar levels, and other medications you might be taking. Make sure to read the label carefully.',
      fineTunedOutput: 'Starting Dose: Metformin IR 500 mg orally once daily with dinner (or 500 mg BID with breakfast and dinner). Titration: Increase by 500 mg weekly based on glycemic control and GI tolerance. Maximum Dose: 2000 mg/day. Monitor eGFR prior to initiation.',
      bleu: 39.8,
      rougeL: 60.1,
    },
  ];

  await prisma.evaluation.create({
    data: {
      projectId: medProject.id,
      bleuScore: 42.5,
      rougeL: 61.2,
      rouge1: 68.4,
      rouge2: 49.8,
      comparisons: JSON.stringify(medComparisons),
    },
  });

  // 2. Create legal summarizer (training)
  const legalProject = await prisma.project.create({
    data: {
      id: `${prefix}-proj-legal-summarizer`,
      userId,
      name: 'Contracts Summarizer',
      description: 'Adapting Llama 3.2 to write high-quality summaries of NDA and procurement agreements.',
      baseModelId: 'llama-3.2-3b',
      status: 'training',
    },
  });

  // Seed dataset for legal project
  const legalRows = [
    { id: 'l1', instruction: 'Summarize the indemnification clause of this NDA.', input: 'Each Party agrees to indemnify, defend, and hold harmless the other Party from and against any and all claims, liabilities, losses, damages, or costs (including reasonable attorneys\' fees) arising out of or relating to any breach of this Agreement by the indemnifying party.', output: 'The clause requires each party to cover all costs, losses, and legal fees incurred by the other party resulting from breaches of the confidentiality agreement.' },
  ];

  await prisma.dataset.create({
    data: {
      projectId: legalProject.id,
      rowCount: 140, // Mock dataset size
      formatted: true,
      rows: JSON.stringify(legalRows),
    },
  });

  // Create training config for legal project
  await prisma.trainingConfig.create({
    data: {
      projectId: legalProject.id,
      epochs: 5,
      learningRate: 0.0001,
      loraRank: 8,
      loraAlpha: 16,
      useQLoRA: true,
    },
  });

  // Seed active training job
  const legalLossCurve = [
    { step: 10, epoch: 0.1, loss: 3.12, evalLoss: 3.3 },
    { step: 20, epoch: 0.2, loss: 2.78, evalLoss: 2.9 },
    { step: 30, epoch: 0.3, loss: 2.45, evalLoss: 2.6 },
    { step: 40, epoch: 0.4, loss: 2.12, evalLoss: 2.3 },
    { step: 50, epoch: 0.5, loss: 1.84, evalLoss: 2.1 },
  ];

  await prisma.job.create({
    data: {
      id: `${prefix}-job-legal-training`,
      projectId: legalProject.id,
      type: 'training',
      status: 'running',
      progress: 45,
      metrics: JSON.stringify({ loss: legalLossCurve }),
      errorMessage: null,
      createdAt: new Date(),
    },
  });

  // 3. Create code project (draft)
  const codeProject = await prisma.project.create({
    data: {
      id: `${prefix}-proj-code-assistant`,
      userId,
      name: 'Internal APIs CodeGen',
      description: 'Fine-tuning Qwen 2.5 on internal API endpoints documentation to generate code snippets.',
      baseModelId: 'qwen2.5-3b',
      status: 'draft',
    },
  });

  await prisma.dataset.create({
    data: {
      projectId: codeProject.id,
      rowCount: 0,
      formatted: false,
      rows: '[]',
    },
  });
}

async function main() {
  console.log('Starting database seed...');

  // 1. Seed base models
  for (const model of baseModels) {
    await prisma.baseModel.upsert({
      where: { id: model.id },
      update: model,
      create: model,
    });
    console.log(`Seeded BaseModel: ${model.name}`);
  }

  // 2. Seed users
  const demoEmail = 'demo@slmforge.ai';
  const adminEmail = 'admin@slmforge.ai';
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      password: hashedPassword,
      name: 'Dr. John Doe',
    },
    create: {
      email: demoEmail,
      password: hashedPassword,
      name: 'Dr. John Doe',
    },
  });
  console.log(`Seeded User: ${demoUser.email} (Password: password123)`);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: 'Dr. John Doe',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Dr. John Doe',
    },
  });
  console.log(`Seeded User: ${adminUser.email} (Password: password123)`);

  // 3. Clear existing user data so we get a clean demo environment
  await prisma.project.deleteMany({
    where: {
      userId: {
        in: [demoUser.id, adminUser.id],
      },
    },
  });

  // 4. Seed projects for both users
  await seedUserProjects(demoUser.id, 'demo');
  console.log('Seeded projects for demo@slmforge.ai');

  await seedUserProjects(adminUser.id, 'admin');
  console.log('Seeded projects for admin@slmforge.ai');

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
