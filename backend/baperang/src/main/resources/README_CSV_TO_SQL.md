# CSV에서 SQL로 변환기

이 도구는 `final_school_food.csv` 파일의 학교 급식 영양 데이터를 Baperang 데이터베이스용 SQL 삽입문으로 변환합니다.

## 사전 요구사항

- Python 3.x
- Pandas 라이브러리 (`pip install pandas`)

## 사용법

### 기본 사용법

```bash
python csv_to_sql.py
```

기본적으로 스크립트는:
- 현재 디렉토리의 `final_school_food.csv` 파일을 읽습니다
- `school_food_data.sql` 파일을 출력으로 생성합니다
- CSV 파일을 위해 'cp949' 인코딩을 사용합니다 (한글 텍스트에 적합)

### 고급 옵션

```bash
python csv_to_sql.py -i 입력파일.csv -o 출력파일.sql -e 인코딩
```

명령줄 옵션:
- `-i, --input`: 입력 CSV 파일 경로 지정 (기본값: final_school_food.csv)
- `-o, --output`: 출력 SQL 파일 경로 지정 (기본값: school_food_data.sql)
- `-e, --encoding`: CSV 파일 인코딩 지정 (기본값: cp949)

예시:
```bash
python csv_to_sql.py -i 나의_데이터.csv -o 결과.sql -e utf-8
```

## 출력

SQL 파일은 Baperang 데이터베이스 스키마를 따르는 INSERT 문을 포함합니다:
- 단위가 포함된 영양소 삽입
- 도시 정보가 포함된 학교 삽입
- 날짜와 이름이 포함된 메뉴 항목 삽입
- 영양가 정보가 포함된 메뉴-영양소 관계 삽입

## 데이터 매핑

스크립트는 CSV 열을 다음과 같이 데이터베이스 필드에 매핑합니다:

1. 도시 → school.city
2. 학교 이름 → school.school_name
3. 메뉴 날짜 → menu.menu_date
4. 메뉴 이름 → menu.menu_name
5. 영양 값 → menu_nutrient.amount (적절한 영양소에 연결됨)

## 데이터베이스로 가져오기

생성된 SQL을 MySQL 데이터베이스로 가져오려면:

```bash
mysql -u 사용자명 -p baperang < school_food_data.sql
```

또는 MySQL Workbench, DBeaver와 같은 데이터베이스 관리 도구를 사용하여 SQL 파일을 실행하세요.

## 문제 해결

- **인코딩 문제**: 인코딩 문제가 발생하면 `-e` 옵션으로 다른 인코딩을 시도하세요. 한글 텍스트에 일반적인 인코딩은 'cp949', 'euc-kr', 'utf-8'입니다.

- **열 구조**: CSV 파일의 열 구조가 다른 경우, 스크립트의 `column_names` 리스트를 수정하세요.

- **SQL 오류**: 스크립트는 텍스트 데이터의 작은 따옴표를 이스케이프 처리하지만, 다른 SQL 구문 문제가 발생하면 스크립트에서 `escape_sql_string()` 함수를 향상시켜야 할 수 있습니다. 