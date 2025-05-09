import csv
import pandas as pd
import datetime
import os
import re
import argparse

def escape_sql_string(s):
    """SQL 특수 문자를 이스케이프 처리합니다."""
    if isinstance(s, str):
        # SQL을 위해 작은 따옴표를 이스케이프 처리
        return s.replace("'", "''")
    return s

def convert_csv_to_sql(CSV파일_경로, SQL출력_경로, 인코딩='cp949'):
    """CSV 파일을 SQL 삽입문으로 변환합니다."""
    
    # CSV 헤더 기반 영양소 이름 정의
    # 원래 CSV 헤더는 한글이며 인코딩 문제가 있으므로 수동으로 매핑합니다
    nutrient_columns = [
        ('중량', 'g'),  # 중량(g)
        ('에너지', 'kcal'),  # 에너지(kcal)
        ('탄수화물', 'g'),  # 탄수화물(g)
        ('단백질', 'g'),  # 단백질(g)
        ('지방', 'g'),  # 지방(g)
        ('식이섬유', 'g'),  # 식이섬유(g)
        ('칼슘', 'mg'),  # 칼슘(mg)
        ('인', 'mg'),  # 인(mg)
        ('나트륨', 'mg'),  # 나트륨(mg)
        ('칼륨', 'mg'),  # 칼륨(mg)
        ('마그네슘', 'mg'),  # 마그네슘(mg)
        ('철', 'mg'),  # 철(mg)
        ('아연', 'mg'),  # 아연(mg)
        ('콜레스테롤', 'mg'),  # 콜레스테롤(mg)
    ]
    
    try:
        # 인코딩 문제 처리를 위해 pandas로 CSV 파일 읽기
        dataframe = pd.read_csv(CSV파일_경로, encoding='euc-kr')
        print(f"euc-kr 인코딩으로 CSV 파일을 성공적으로 읽었습니다. 총 {len(dataframe)}개의 행이 있습니다.")

        # 쉽게 접근하기 위해 열 이름 변경
        # CSV의 열이 이 순서와 일치한다고 가정
        columns = ['도시', '학교명', '메뉴날짜', '메뉴이름'] + [name for name, _ in nutrient_columns]
        
        # 올바른 열 수를 가지고 있는지 확인
        if len(dataframe.columns) >= len(columns):
            dataframe = dataframe.iloc[:, :len(columns)]
            dataframe.columns = columns
        else:
            print(f"경고: CSV에는 {len(dataframe.columns)}개의 열이 있지만, 최소 {len(columns)}개가 필요합니다.")
            # 실제 열 수에 맞게 조정
            dataframe.columns = columns[:len(dataframe.columns)]

        # SQL 파일 생성
        with open(SQL출력_경로, 'w', encoding='utf-8') as sql_파일:
            # 트랜잭션 시작 작성
            sql_파일.write("START TRANSACTION;\n\n")
            
            # 영양소 데이터 먼저 삽입
            sql_파일.write("-- 영양소 데이터 삽입\n")
            for i, (nutrient_name, unit) in enumerate(nutrient_columns, 1):
                sql_파일.write(f"INSERT INTO nutrient (nutrient_pk, nutrient_name, unit) VALUES ({i}, '{escape_sql_string(nutrient_name)}', '{escape_sql_string(unit)}');\n")
            
            sql_파일.write("\n-- 학교 데이터 삽입\n")
            # 이미 추가한 학교 추적
            schools = {}
            
            # 이미 추가한 메뉴 추적
            menus = {}
            
            # 메뉴 영양소 쌍 추적
            menu_nutrient_pairs = []
            
            # DataFrame의 각 행 처리
            for _, row in dataframe.iterrows():
                도시 = escape_sql_string(str(row['도시']))
                학교명 = escape_sql_string(str(row['학교명']))
                메뉴날짜 = row['메뉴날짜']
                메뉴이름 = escape_sql_string(str(row['메뉴이름']))
                
                # menu_date가 유효한지 확인
                if pd.isna(menu_date) or menu_date == '':
                    continue
                
                # 학교 키가 존재하지 않으면 생성
                school_key = f"{city}_{school_name}"
                if school_key not in schools:
                    schools[school_key] = len(schools) + 1
                    sql_파일.write(f"INSERT INTO school (school_pk, school_name, city) VALUES ({schools[school_key]}, '{school_name}', '{city}');\n")
                
                # 메뉴 키 생성
                menu_key = f"{school_key}_{menu_date}_{menu_name}"
                if menu_key not in menus:
                    menus[menu_key] = len(menus) + 1
                    # 기본 선호도 값은 0.0
                    sql_파일.write(f"INSERT INTO menu (menu_pk, school_pk, menu_date, menu_name, favorite) VALUES ({menus[menu_key]}, {schools[school_key]}, '{menu_date}', '{menu_name}', 0.0);\n")
                
                # menu_nutrient 항목 추가
                for i, (nutrient_name, _) in enumerate(nutrient_columns, 1):
                    # 영양소 값이 누락되었거나 숫자가 아닌 경우 건너뛰기
                    nutrient_value = row.get(nutrient_name)
                    if pd.notna(nutrient_value) and nutrient_value != '':
                        try:
                            amount = float(nutrient_value)
                            menu_nutrient_pairs.append((menus[menu_key], i, amount))
                        except ValueError:
                            print(f"경고: '{menu_key}'의 {nutrient_name}에 대한 '{nutrient_value}'는 숫자가 아닙니다.")
            
            # menu_nutrient 데이터 작성
            sql_파일.write("\n-- 메뉴 영양소 데이터 삽입\n")
            for menu_pk, nutrient_pk, amount in menu_nutrient_pairs:
                sql_파일.write(f"INSERT INTO menu_nutrient (menu_pk, nutrient_pk, amount) VALUES ({menu_pk}, {nutrient_pk}, {amount});\n")
            
            # 트랜잭션 종료 작성
            sql_파일.write("\nCOMMIT;")
            
            print(f"SQL 파일 생성 완료: {SQL출력_경로}")
            print(f"총 학교 수: {len(schools)}")
            print(f"총 메뉴 수: {len(menus)}")
            print(f"총 메뉴-영양소 쌍 수: {len(menu_nutrient_pairs)}")
            
            return True
            
    except Exception as e:
        print(f"오류: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='학교 급식 CSV 데이터를 SQL 삽입문으로 변환합니다.')
    parser.add_argument('-i', '--input', help='입력 CSV 파일 경로', default='final_school_food.csv')
    parser.add_argument('-o', '--output', help='출력 SQL 파일 경로', default='school_food_data.sql')
    parser.add_argument('-e', '--encoding', help='CSV 파일 인코딩', default='cp949')
    
    args = parser.parse_args()
    
    print(f"{args.input}을(를) {args.output}(으)로 {args.encoding} 인코딩으로 변환 중...")
    성공 = convert_csv_to_sql(args.input, args.output, args.encoding)
    
    if 성공:
        print("변환이 성공적으로 완료되었습니다!")
    else:
        print("변환에 실패했습니다. 위의 오류 메시지를 확인하세요.")

if __name__ == "__main__":
    main() 