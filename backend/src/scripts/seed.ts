// ============================================
// Seed Script - Test ma'lumotlarni yaratish
// ============================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ma\'lumotlar bazasini to\'ldirish boshlandi...');

  // Director yaratish
  const directorPassword = await bcrypt.hash('director123', 12);
  const director = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      phone: '+998901234567',
      password: directorPassword,
      firstName: 'Asliddin',
      lastName: 'Rahmonov',
      role: 'DIRECTOR',
    },
  });
  console.log(`✅ Director yaratildi: ${director.firstName} ${director.lastName} (${director.phone})`);

  // Super Admin yaratish
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { phone: '+998900000000' },
    update: {},
    create: {
      phone: '+998900000000',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin yaratildi: ${superAdmin.firstName} ${superAdmin.lastName}`);

  // O'qituvchilar yaratish
  const teacherData = [
    { phone: '+998911111111', firstName: 'Ali', lastName: 'Valiyev' },
    { phone: '+998912222222', firstName: 'Sardor', lastName: 'Karimov' },
    { phone: '+998913333333', firstName: 'Nodira', lastName: 'Aliyeva' },
    { phone: '+998914444444', firstName: 'Shaxlo', lastName: 'Raxmatova' },
    { phone: '+998915555555', firstName: 'Javohir', lastName: 'Toshmatov' },
  ];

  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const teachers = [];

  for (const data of teacherData) {
    const teacher = await prisma.user.upsert({
      where: { phone: data.phone },
      update: {},
      create: {
        ...data,
        password: teacherPassword,
        role: 'TEACHER',
      },
    });
    teachers.push(teacher);
    console.log(`✅ O'qituvchi yaratildi: ${teacher.firstName} ${teacher.lastName}`);
  }

  // O'quvchilar yaratish
  const studentData = [
    { phone: '+998931111111', firstName: 'Behruz', lastName: 'Sobirov' },
    { phone: '+998932222222', firstName: 'Malika', lastName: 'Ismoilova' },
    { phone: '+998933333333', firstName: 'Otabek', lastName: 'Normatov' },
    { phone: '+998934444444', firstName: 'Dilnoza', lastName: 'Yusupova' },
    { phone: '+998935555555', firstName: 'Asilbek', lastName: 'Xolmatov' },
    { phone: '+998936666666', firstName: 'Zarina', lastName: 'Qodirova' },
    { phone: '+998937777777', firstName: 'Jamshid', lastName: 'Ochilov' },
    { phone: '+998938888888', firstName: 'Mohira', lastName: 'Mirzayeva' },
  ];

  const studentPassword = await bcrypt.hash('student123', 12);
  const students = [];

  for (const data of studentData) {
    const student = await prisma.user.upsert({
      where: { phone: data.phone },
      update: {},
      create: {
        ...data,
        password: studentPassword,
        role: 'STUDENT',
      },
    });
    students.push(student);
  }
  console.log(`✅ ${students.length} ta o'quvchi yaratildi`);

  // Kurslar yaratish
  const courseData = [
    { name: 'Frontend Development', description: 'HTML, CSS, JavaScript, React', price: 500000, duration: 6 },
    { name: 'Backend Development', description: 'Node.js, Express, PostgreSQL', price: 600000, duration: 6 },
    { name: 'Python Dasturlash', description: 'Python asoslari va Django', price: 400000, duration: 4 },
    { name: 'Ingliz Tili', description: 'General English Course', price: 300000, duration: 3 },
    { name: 'Matematika', description: 'Oliy matematika kursi', price: 250000, duration: 4 },
  ];

  const courses = [];
  for (const data of courseData) {
    const course = await prisma.course.create({
      data: {
        ...data,
        directorId: director.id,
      },
    });
    courses.push(course);
    console.log(`✅ Kurs yaratildi: ${course.name}`);
  }

  // O'qituvchilarni kurslarga biriktirish
  for (let i = 0; i < teachers.length; i++) {
    await prisma.courseTeacher.create({
      data: {
        courseId: courses[i % courses.length].id,
        teacherId: teachers[i].id,
      },
    });
  }
  console.log('✅ O\'qituvchilar kurslarga biriktirildi');

  // O'quvchilarni kurslarga yozish
  for (let i = 0; i < students.length; i++) {
    await prisma.enrollment.create({
      data: {
        studentId: students[i].id,
        courseId: courses[i % courses.length].id,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✅ O\'quvchilar kurslarga yozildi');

  // Jarimalar
  const penaltyReasons = [
    'Darsga kech kelish',
    'Dars rejasini bajarmaslik',
    'Ota-onalar bilan uchrashuv o\'tkazmaslik',
    'Hisobotni kech topshirish',
  ];

  for (let i = 0; i < 4; i++) {
    await prisma.penalty.create({
      data: {
        targetId: teachers[i].id,
        createdById: director.id,
        amount: (i + 1) * 50000,
        reason: penaltyReasons[i],
        date: new Date(2026, 4, i + 1),
      },
    });
  }
  console.log('✅ Jarimalar yaratildi');

  // Bonuslar
  const bonusReasons = [
    'Eng yaxshi o\'qituvchi (Oylik)',
    'O\'quvchilar natijasi yuqori',
    'Qo\'shimcha darslar o\'tkazganligi uchun',
  ];

  for (let i = 0; i < 3; i++) {
    await prisma.bonus.create({
      data: {
        targetId: teachers[i].id,
        createdById: director.id,
        amount: (i + 1) * 100000,
        reason: bonusReasons[i],
        date: new Date(2026, 4, i + 5),
      },
    });
  }
  console.log('✅ Bonuslar yaratildi');

  // Xarajatlar
  const expenseData = [
    { title: 'Ofis ijarasi', amount: 3000000, category: 'RENT' as const },
    { title: 'Elektr energiyasi', amount: 500000, category: 'UTILITIES' as const },
    { title: 'Internet xizmati', amount: 200000, category: 'UTILITIES' as const },
    { title: 'Proyektor sotib olish', amount: 2500000, category: 'EQUIPMENT' as const },
    { title: 'Google reklama', amount: 800000, category: 'MARKETING' as const },
    { title: 'Doskalar va markerlar', amount: 150000, category: 'SUPPLIES' as const },
    { title: 'O\'qituvchi maoshi (Ali)', amount: 4000000, category: 'SALARY' as const },
    { title: 'O\'qituvchi maoshi (Sardor)', amount: 4500000, category: 'SALARY' as const },
  ];

  for (const data of expenseData) {
    await prisma.expense.create({
      data: {
        ...data,
        createdById: director.id,
        date: new Date(2026, 4, Math.floor(Math.random() * 28) + 1),
      },
    });
  }
  console.log('✅ Xarajatlar yaratildi');

  console.log('\n🎉 Ma\'lumotlar bazasi muvaffaqiyatli to\'ldirildi!');
  console.log('\n📋 Login ma\'lumotlari:');
  console.log('   Director:    +998901234567 / director123');
  console.log('   Super Admin: +998900000000 / superadmin123');
  console.log('   O\'qituvchi:  +998911111111 / teacher123');
  console.log('   O\'quvchi:    +998931111111 / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
