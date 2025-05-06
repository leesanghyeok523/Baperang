CREATE TABLE `NUTRIENT` (
	`pk`	BIGINT	NOT NULL,
	`영양소 이름`	TEXT	NULL,
	`단위`	TEXT	NULL
);

CREATE TABLE `메뉴별 영양소 테이블` (
	`pk`	BIGINT	NOT NULL,
	`pk2`	BIGINT	NOT NULL,
	`영양소 양`	FLOAT	NULL
);

CREATE TABLE `메뉴 테이블` (
	`pk`	BIGINT	NOT NULL,
	`pk2`	BIGINT	NOT NULL,
	`급식날짜`	DATE	NULL,
	`메뉴이름`	TEXT	NULL,
	`선호도`	FLOAT	NULL
);

CREATE TABLE `급식 이미지` (
	`Key`	BIGINT	NOT NULL,
	`Key2`	BIGINT	NOT NULL,
	`학교`	BIGINT	NOT NULL,
	`급식일자`	DATE	NULL,
	`처음 이미지`	TEXT	NULL,
	`잔반 이미지`	TEXT	NULL
);

CREATE TABLE `학교` (
	`pk`	BIGINT	NOT NULL,
	`학교`	TEXT	NULL,
	`시도명`	TEXT	NULL,
	`생성일자`	timestamp	NULL,
	`수정일자`	timestamp	NULL
);

CREATE TABLE `잔반율 테이블` (
	`pk`	BIGINT	NOT NULL,
	`pk2`	BIGINT	NOT NULL,
	`Key`	BIGINT	NOT NULL,
	`급식 날짜`	DATE	NULL,
	`메뉴 이름`	TEXT	NULL,
	`잔반율`	FLOAT	NULL
);

CREATE TABLE `사용자(영양사)` (
	`pk`	BIGINT	NOT NULL,
	`fk`	BIGINT	NOT NULL,
	`사용자 ID`	VARCHAR(20)	NULL,
	`비밀번호`	TEXT	NULL,
	`이름`	TEXT	NULL,
	`생성일자`	timestamp	NULL,
	`수정일자`	timestamp	NULL
);

CREATE TABLE `학생` (
	`Key`	BIGINT	NOT NULL,
	`학교`	BIGINT	NOT NULL,
	`학생이름`	TEXT	NULL,
	`학년`	INT	NULL,
	`반`	INT	NULL,
	`번호`	INT	NULL,
	`키`	FLOAT	NULL,
	`몸무게`	FLOAT	NULL,
	`날짜`	DATE	NULL,
	`리포트`	TEXT	NULL,
  -- PRIMARY KEY (`Key`, `학교`),
  KEY `idx_학생_학교` (`학교`)
);

ALTER TABLE `영양소 테이블` ADD CONSTRAINT `PK_영양소 테이블` PRIMARY KEY (
	`pk`
);

ALTER TABLE `메뉴별 영양소 테이블` ADD CONSTRAINT `PK_메뉴별 영양소 테이블` PRIMARY KEY (
	`pk`,
	`pk2`
);

ALTER TABLE `메뉴 테이블` ADD CONSTRAINT `PK_메뉴 테이블` PRIMARY KEY (
	`pk`,
	`pk2`
);

ALTER TABLE `급식 이미지` ADD CONSTRAINT `PK_급식 이미지` PRIMARY KEY (
	`Key`,
	`Key2`,
	`학교`
);

ALTER TABLE `학교` ADD CONSTRAINT `PK_학교` PRIMARY KEY (
	`pk`
);

ALTER TABLE `잔반율 테이블` ADD CONSTRAINT `PK_잔반율 테이블` PRIMARY KEY (
	`pk`,
	`pk2`,
	`Key`
);

ALTER TABLE `사용자(영양사)` ADD CONSTRAINT `PK_사용자(영양사)` PRIMARY KEY (
	`pk`,
	`fk`
);

ALTER TABLE `학생` ADD CONSTRAINT `PK_학생` PRIMARY KEY (
	`Key`,
	`학교`
);

ALTER TABLE `메뉴별 영양소 테이블` ADD CONSTRAINT `FK_메뉴 테이블_TO_메뉴별 영양소 테이블_1` FOREIGN KEY (
	`pk`
)
REFERENCES `메뉴 테이블` (
	`pk`
);

ALTER TABLE `메뉴별 영양소 테이블` ADD CONSTRAINT `FK_영양소 테이블_TO_메뉴별 영양소 테이블_1` FOREIGN KEY (
	`pk2`
)
REFERENCES `영양소 테이블` (
	`pk`
);

ALTER TABLE `메뉴 테이블` ADD CONSTRAINT `FK_학교_TO_메뉴 테이블_1` FOREIGN KEY (
	`pk2`
)
REFERENCES `학교` (
	`pk`
);

ALTER TABLE `급식 이미지` ADD CONSTRAINT `FK_학생_TO_급식 이미지_1` FOREIGN KEY (
	`Key2`
)
REFERENCES `학생` (
	`Key`
);

ALTER TABLE `급식 이미지` ADD CONSTRAINT `FK_학생_TO_급식 이미지_2` FOREIGN KEY (
	`학교`
)
REFERENCES `학생` (
	`학교`
);

ALTER TABLE `잔반율 테이블` ADD CONSTRAINT `FK_메뉴 테이블_TO_잔반율 테이블_1` FOREIGN KEY (
	`pk2`
)
REFERENCES `메뉴 테이블` (
	`pk`
);

ALTER TABLE `잔반율 테이블` ADD CONSTRAINT `FK_학생_TO_잔반율 테이블_1` FOREIGN KEY (
	`Key`
)
REFERENCES `학생` (
	`Key`
);

ALTER TABLE `사용자(영양사)` ADD CONSTRAINT `FK_학교_TO_사용자(영양사)_1` FOREIGN KEY (
	`fk`
)
REFERENCES `학교` (
	`pk`
);

ALTER TABLE `학생` ADD CONSTRAINT `FK_학교_TO_학생_1` FOREIGN KEY (
	`학교`
)
REFERENCES `학교` (
	`pk`
);

