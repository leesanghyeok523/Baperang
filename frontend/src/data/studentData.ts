// 학생 데이터 타입 정의
export interface Student {
  id: number;
  name: string;
  grade: number; // 학년
  classNum: number; // 반
  studentNum: number; // 학번
  bmi: number; // BMI 지수
  wasteRate: number; // 개인별 잔반율 (%)
}

// 성(姓) 목록 (ㄱ-ㅎ 계열)
const familyNames = [
  '김',
  '강',
  '구',
  '곽',
  '권',
  '나',
  '남',
  '노',
  '도',
  '동',
  '라',
  '류',
  '림',
  '마',
  '문',
  '민',
  '목',
  '박',
  '배',
  '백',
  '부',
  '서',
  '성',
  '손',
  '송',
  '신',
  '심',
  '안',
  '양',
  '오',
  '원',
  '유',
  '윤',
  '이',
  '임',
  '장',
  '전',
  '정',
  '조',
  '주',
  '지',
  '진',
  '차',
  '채',
  '최',
  '추',
  '천',
  '하',
  '한',
  '허',
  '홍',
  '황',
];

// 이름 뒷부분 목록 (랜덤 조합용)
const nameSecondSyllables = [
  '준',
  '민',
  '서',
  '지',
  '우',
  '현',
  '진',
  '석',
  '영',
  '기',
  '태',
  '수',
  '은',
  '혜',
  '원',
  '아',
  '선',
  '재',
  '연',
  '철',
  '호',
];
const nameThirdSyllables = [
  '서',
  '호',
  '준',
  '우',
  '민',
  '영',
  '수',
  '원',
  '진',
  '석',
  '현',
  '아',
  '은',
  '연',
  '지',
  '선',
  '재',
];

// 랜덤한 한국 이름 생성 함수
function generateKoreanName(): string {
  const familyName = familyNames[Math.floor(Math.random() * familyNames.length)];

  // 항상 두 글자 이름 생성 (성씨 제외)
  const secondSyllable =
    nameSecondSyllables[Math.floor(Math.random() * nameSecondSyllables.length)];
  const thirdSyllable = nameThirdSyllables[Math.floor(Math.random() * nameThirdSyllables.length)];
  return `${familyName}${secondSyllable}${thirdSyllable}`;
}

// 랜덤한 BMI 지수 생성 (정상 범위 내에서 더 많이 분포하도록)
function generateBMI(): number {
  // 대부분의 학생은 정상 범위(18.5-24.9)에 위치하도록 설정
  const normalDistribution = Math.random() < 0.7; // 70% 확률로 정상 범위

  if (normalDistribution) {
    // 정상 BMI 범위 (18.5-24.9)
    return +(18.5 + Math.random() * 6.4).toFixed(1);
  } else {
    // 저체중이나 과체중/비만 범위
    const lowWeight = Math.random() < 0.5;
    if (lowWeight) {
      // 저체중 (17.0-18.4)
      return +(17.0 + Math.random() * 1.4).toFixed(1);
    } else {
      // 과체중/비만 (25.0-30.0)
      return +(25.0 + Math.random() * 5.0).toFixed(1);
    }
  }
}

// 랜덤한 잔반율 생성 (0-30% 사이)
function generateWasteRate(): number {
  return Math.floor(Math.random() * 7) * 5; // 0, 5, 10, 15, 20, 25, 30%
}

// 학생 데이터 생성
function generateStudents(count: number): Student[] {
  const students: Student[] = [];

  // 학년별로 학생 수를 균등하게 배분
  const gradesCount = 3; // 초등학교라고 가정하면 1-6학년, 중학교면 1-3학년
  const studentsPerGrade = Math.floor(count / gradesCount);

  for (let grade = 1; grade <= gradesCount; grade++) {
    // 각 학년에 2-3개 반을 무작위로 배정
    const classes = 2 + Math.floor(Math.random() * 2); // 2 또는 3개 반
    const studentsPerClass = Math.floor(studentsPerGrade / classes);

    for (let classNum = 1; classNum <= classes; classNum++) {
      // 각 반에 학생 배정
      for (let i = 0; i < studentsPerClass && students.length < count; i++) {
        const studentNum = i + 1; // 학번은 1부터 시작

        students.push({
          id: students.length + 1,
          name: generateKoreanName(),
          grade,
          classNum,
          studentNum,
          bmi: generateBMI(),
          wasteRate: generateWasteRate(),
        });
      }
    }
  }

  // 정확히 count 명이 되도록 추가 또는 제거
  while (students.length < count) {
    const grade = Math.floor(Math.random() * gradesCount) + 1;
    const classNum = Math.floor(Math.random() * 3) + 1;
    const studentNum = Math.floor(Math.random() * 30) + 1;

    students.push({
      id: students.length + 1,
      name: generateKoreanName(),
      grade,
      classNum,
      studentNum,
      bmi: generateBMI(),
      wasteRate: generateWasteRate(),
    });
  }

  // count보다 많으면 제거
  while (students.length > count) {
    students.pop();
  }

  return students;
}

// 50명의 학생 데이터 생성
export const studentData = generateStudents(50);
