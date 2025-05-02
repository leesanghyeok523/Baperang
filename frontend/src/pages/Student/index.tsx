import { useState, useRef, useEffect } from 'react';
import { studentData, Student } from '../../data/studentData';
import { useReactToPrint } from 'react-to-print';
import InputCard from '../../components/ui/inputcard';

// 학생 성별을 무작위로 결정하기 위한 함수
// 이름은 무작위로 저장된 데이터이므로 50% 확률로 성별을 결정
const getRandomGender = (studentId: number) => {
  // 학생 ID를 기준으로 고정된 성별 결정 (데이터가 변경되어도 같은 학생은 같은 성별 유지)
  return studentId % 2 === 0 ? 'male' : 'female';
};

const StudentManagement = () => {
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [searchName, setSearchName] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(studentData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedStudent, setSelectedStudent] = useState(studentData[0]);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // 클래스 목록 (선택된 학년에 따라 달라짐)
  const classOptions = selectedGrade
    ? [
        ...new Set(studentData.filter((s) => s.grade === selectedGrade).map((s) => s.classNum)),
      ].sort()
    : [];

  // 학년 목록 (중복 제거)
  const gradeOptions = [...new Set(studentData.map((s) => s.grade))].sort();

  // 필터링 로직
  useEffect(() => {
    let result = [...studentData];

    if (selectedGrade) {
      result = result.filter((student) => student.grade === selectedGrade);
    }

    if (selectedClass) {
      result = result.filter((student) => student.classNum === selectedClass);
    }

    if (searchName) {
      result = result.filter((student) =>
        student.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(result);
  }, [selectedGrade, selectedClass, searchName]);

  // 학생 선택 함수
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setAiReport(null); // 새 학생 선택시 리포트 초기화
  };

  // AI 건강 리포트 생성 함수
  const generateAIReport = () => {
    const { name, grade, classNum, studentNum, bmi, wasteRate } = selectedStudent;

    // BMI 상태 평가
    let bmiStatus = '';
    if (bmi < 18.5) bmiStatus = '저체중';
    else if (bmi >= 18.5 && bmi < 23) bmiStatus = '정상';
    else if (bmi >= 23 && bmi < 25) bmiStatus = '과체중';
    else bmiStatus = '비만';

    // 잔반율 평가
    let wasteComment = '';
    if (wasteRate <= 10) wasteComment = '매우 좋습니다';
    else if (wasteRate <= 20) wasteComment = '보통입니다';
    else wasteComment = '개선이 필요합니다';

    // 리포트 생성
    const report = `
      <h2>${name} 학생 건강 리포트</h2>
      <p>학년: ${grade}학년 ${classNum}반 ${studentNum}번</p>
      <p>BMI 지수: ${bmi} (${bmiStatus})</p>
      <p>잔반율: ${wasteRate}% (${wasteComment})</p>
      <h3>건강 분석 결과</h3>
      <p>BMI 지수 ${bmi}는 ${bmiStatus} 상태입니다. ${
      bmiStatus === '정상'
        ? '현재 건강한 상태를 유지하고 있습니다.'
        : '식습관 개선과 적절한 운동이 필요합니다.'
    }</p>
      <p>잔반율은 ${wasteRate}%로, ${wasteComment}. ${
      wasteRate > 20
        ? '음식을 남기지 않고 적절히 섭취하는 습관을 기르는 것이 중요합니다.'
        : '앞으로도 균형 잡힌 식사를 유지하세요.'
    }</p>
      <h3>개선 방안</h3>
      <ul>
        ${bmiStatus !== '정상' ? '<li>규칙적인 운동 습관을 기르세요.</li>' : ''}
        ${bmiStatus === '저체중' ? '<li>영양가 있는 음식을 충분히 섭취하세요.</li>' : ''}
        ${
          bmiStatus === '과체중' || bmiStatus === '비만'
            ? '<li>당분과 지방 섭취를 줄이세요.</li>'
            : ''
        }
        ${wasteRate > 20 ? '<li>적정량의 음식을 선택해 잔반을 줄이세요.</li>' : ''}
      </ul>
    `;

    setAiReport(report);
  };

  // PDF 인쇄 함수
  const handlePrint = useReactToPrint({
    // @ts-expect-error - react-to-print 타입 문제 해결
    content: () => reportRef.current,
  });

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 bg-main bg-cover bg-center"></div>

      {/* 메인 컨텐츠 */}
      <div
        className="relative z-10 flex items-center justify-evenly"
        style={{ height: 'calc(100vh - 80px)', marginTop: '75px' }}
      >
        <div className="w-[85%] mx-auto">
          <div
            className="bg-[#F8F1E7] rounded-3xl shadow-lg p-0 flex flex-col overflow-hidden"
            style={{ height: '73vh' }}
          >
            {/* 학생관리 컨텐츠 */}
            <div className="px-6 py-3 flex-grow flex flex-row gap-4 mb-1 h-full">
              {/* 좌측: 필터링 */}
              <div className="w-full md:w-1/3 bg-transparent rounded-2xl p-6 flex flex-col">
                <div className="mb-2">
                  {/* 학년 선택 */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">학년</label>
                    <select
                      className="mt-2 w-full px-4 py-5 bg-white/50 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={selectedGrade}
                      onChange={(e) => {
                        setSelectedGrade(e.target.value ? Number(e.target.value) : '');
                        setSelectedClass(''); // 학년 변경시 반 초기화
                      }}
                    >
                      <option value="">전체 학년</option>
                      {gradeOptions.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}학년
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 반 선택 */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">반</label>
                    <select
                      className="mt-2 w-full px-4 py-5 bg-white/50 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={selectedClass}
                      onChange={(e) =>
                        setSelectedClass(e.target.value ? Number(e.target.value) : '')
                      }
                      disabled={!selectedGrade}
                    >
                      <option value="">전체 반</option>
                      {classOptions.map((classNum) => (
                        <option key={classNum} value={classNum}>
                          {classNum}반
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 이름 검색 */}
                  <div className="mb-4">
                    <InputCard
                      type="text"
                      placeholder="이름 검색"
                      label="이름"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>
                </div>

                {/* 학생 목록 - 스크롤 가능한 창 */}
                <div className="flex-grow overflow-hidden bg-white/50 rounded-2xl p-4">
                  <h3 className="text-base font-semibold mb-2 text-gray-700">학생 목록</h3>
                  <div className="h-[calc(100%-2rem)] overflow-y-auto pr-2">
                    {filteredStudents.length > 0 ? (
                      <ul className="space-y-2">
                        {filteredStudents.map((student) => (
                          <li
                            key={student.id}
                            className={`px-4 py-3 rounded-md cursor-pointer transition-colors ${
                              selectedStudent.id === student.id
                                ? 'bg-[#96c059]/20 border border-[#96c059]/30'
                                : 'bg-white hover:bg-gray-50 border border-gray-100'
                            }`}
                            onClick={() => handleSelectStudent(student)}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 flex-shrink-0 mr-3">
                                <img
                                  src={`/images/items/${
                                    getRandomGender(student.id) === 'female'
                                      ? 'girl.png'
                                      : 'boy.png'
                                  }`}
                                  alt=""
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/items/blank.png';
                                  }}
                                />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800">{student.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {student.grade}학년 {student.classNum}반 {student.studentNum}번
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">검색 결과가 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 우측: 학생 상세 정보 및 AI 리포트 */}
              <div className="flex flex-row w-full md:w-2/3 h-full items-center justify-center relative">
                {!aiReport ? (
                  <div className="flex flex-col items-center justify-center w-full">
                    {/* 학생 아바타 - 수직 가운데 정렬 */}

                    {/* 학생 정보 */}
                    <div className="bg-white/50 rounded-2xl shadow-md p-6 text-center w-full h-[495px]">
                      <div className="w-40 h-40 overflow-hidden mb-6 mx-auto flex items-center justify-center">
                        <img
                          src={`/images/items/${
                            getRandomGender(selectedStudent.id) === 'female'
                              ? 'girl.png'
                              : 'boy.png'
                          }`}
                          alt={selectedStudent.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            // 이미지 로드 실패시 기본 이미지로 대체
                            e.currentTarget.src = '/images/items/blank.png';
                          }}
                        />
                      </div>
                      <h2 className="text-2xl font-bold mb-4">이름 : {selectedStudent.name}</h2>
                      <p className="text-xl mb-3">
                        학번 : {selectedStudent.grade}
                        {selectedStudent.classNum.toString().padStart(2, '0')}
                        {selectedStudent.studentNum.toString().padStart(2, '0')}
                      </p>
                      <p className="text-xl mb-3">BMI : {selectedStudent.bmi}</p>
                      <p className="text-xl mb-3">잔반율 : {selectedStudent.wasteRate}%</p>

                      <button
                        className="mt-4 px-8 py-3 bg-[#96c059] text-white rounded-2xl hover:bg-[#7ba348] transition-colors text-base"
                        onClick={generateAIReport}
                      >
                        AI 건강 리포트 생성
                      </button>
                    </div>
                  </div>
                ) : (
                  /* AI 리포트 */
                  <div className="bg-white/50 rounded-2xl shadow-md p-8 w-full h-[495px]">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">AI 건강 리포트</h2>
                      <button
                        className="px-6 py-2 text-red-600 hover:text-red-800 transition border border-red-600 rounded-full"
                        onClick={handlePrint}
                      >
                        PDF로 저장
                      </button>
                    </div>

                    <div ref={reportRef} className="p-4 overflow-y-auto h-[calc(100%-70px)]">
                      <div
                        dangerouslySetInnerHTML={{ __html: aiReport }}
                        className="text-lg space-y-4"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
