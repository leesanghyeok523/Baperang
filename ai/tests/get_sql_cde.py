import pymysql, random
import json
from collections import defaultdict
from datetime import datetime, timedelta

# DB 연결 정보
conn = pymysql.connect(
    host="k12e102.p.ssafy.io",
    user="root",
    password="root",
    database="baperang",
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor
)

def get_menu_pool(cursor):
    cursor.execute("SELECT DISTINCT menu_name, category FROM menu")
    rows = cursor.fetchall()
    return {row['menu_name']: row['category'] for row in rows}

def get_nutrient_lookup(cursor):
    cursor.execute("SELECT nutrient_pk, nutrient_name FROM nutrient")
    rows = cursor.fetchall()
    return {row["nutrient_pk"]: row["nutrient_name"] for row in rows}

def get_menu_data(cursor, start_date, end_date, nutrient_lookup):
    query = f"""
        SELECT 
            m.menu_date, m.menu_name,
            mn.nutrient_pk, mn.amount
        FROM menu m
        LEFT JOIN menu_nutrient mn ON m.menu_pk = mn.menu_pk
        WHERE m.menu_date BETWEEN %s AND %s
    """
    cursor.execute(query, (start_date, end_date))
    rows = cursor.fetchall()

    menu_data = defaultdict(lambda: defaultdict(dict))

    for row in rows:
        date = row['menu_date'].strftime("%Y-%m-%d")
        menu_name = row['menu_name']
        nutrient_name = nutrient_lookup.get(row['nutrient_pk'])

        if nutrient_name is None:
            continue

        if 'nutrition' not in menu_data[date][menu_name]:
            leftover_val = round(random.uniform(0.0, 1.0), 2)
            preference_val = round(random.uniform(0.0, 1.0), 2)

            menu_data[date][menu_name] = {
                "leftover": leftover_val,
                "preference": preference_val,
                "nutrition": {}
            }

        menu_data[date][menu_name]["nutrition"][nutrient_name] = row['amount']

    return menu_data

def main():
    try:
        with conn.cursor() as cursor:
            # 1. 메뉴 풀
            menu_pool = get_menu_pool(cursor)

            # 2. 영양소 PK→이름 매핑
            nutrient_lookup = get_nutrient_lookup(cursor)

            # 3. 3년치 메뉴 데이터
            today = datetime.today()
            start_date = (today - timedelta(days=365 * 3)).strftime("%Y-%m-%d")
            end_date = today.strftime("%Y-%m-%d")
            menu_data = get_menu_data(cursor, start_date, end_date, nutrient_lookup)

        final_json = {
            "menuData": menu_data,
            "menuPool": menu_pool
        }

        with open("menu_output.json", "w", encoding="utf-8") as f:
            json.dump(final_json, f, indent=2, ensure_ascii=False)

        print("✅ JSON 생성 완료: menu_output.json")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
