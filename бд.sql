-- ПОЛНОЕ ПЕРЕСОЗДАНИЕ БАЗЫ РАЗВИТАЙМ
-- ВНИМАНИЕ: УДАЛИТ СТАРУЮ БАЗУ razvitime ЦЕЛИКОМ

DROP DATABASE IF EXISTS razvitime;

CREATE DATABASE razvitime
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE razvitime;

-- =========================
-- 1. Пользователи (аккаунты)
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('parent','center_admin','admin') NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL
) ENGINE=InnoDB;

-- =========================
-- 2. Профиль родителя
-- =========================
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 3. Профиль детского центра
-- =========================
CREATE TABLE centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,          -- админ центра (аккаунт)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100),
    address VARCHAR(255),
    latitude DECIMAL(9,6) NULL,
    longitude DECIMAL(9,6) NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    website VARCHAR(255),
    instagram VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 4. Комнаты / залы центра
-- =========================
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,          -- "Зал хореографии", "Кабинет 101"
    capacity INT,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 5. Дети
-- =========================
CREATE TABLE kids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    birth_date DATE,
    gender ENUM('girl','boy','other') NULL,
    special_needs TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 6. Направления / кружки (внутри центра)
-- =========================
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,          -- "Робототехника", "Хореография"
    category VARCHAR(100),                -- спорт, творчество, IT и т.п.
    description TEXT,
    min_age TINYINT,
    max_age TINYINT,
    level VARCHAR(50),                    -- начальный, продвинутый
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 7. Группы внутри занятия
-- =========================
CREATE TABLE activity_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,           -- "Группа 8–10 лет (вечер)"
    max_kids INT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (activity_id) REFERENCES activities(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 8. Слоты расписания (конкретные дни/время)
-- =========================
CREATE TABLE schedule_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    weekday TINYINT NOT NULL,             -- 1=Пн ... 7=Вс
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INT NULL,
    FOREIGN KEY (group_id) REFERENCES activity_groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 9. Запись ребёнка в группу
-- =========================
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kid_id INT NOT NULL,
    group_id INT NOT NULL,
    status ENUM('pending','approved','rejected','waitlist','left')
        DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kid_id, group_id),
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES activity_groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 10. Избранные центры у родителя
-- =========================
CREATE TABLE favorite_centers (
    parent_id INT NOT NULL,
    center_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, center_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 11. Напоминания о занятиях
-- =========================
CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    kid_id INT NULL,
    schedule_slot_id INT NOT NULL,
    remind_before_minutes INT NOT NULL DEFAULT 60,
    channel ENUM('email','sms','telegram','push') DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (schedule_slot_id) REFERENCES schedule_slots(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 12. Тарифы и подписки центров
-- =========================
CREATE TABLE tariff_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,     -- BASIC, PRO и т.п.
    name VARCHAR(100) NOT NULL,
    max_activities INT,
    max_kids INT,
    price_month DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE center_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    tariff_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (tariff_id) REFERENCES tariff_plans(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 13. Немного тестовых данных (для проверки)
-- =========================

-- Пользователи
INSERT INTO users (email, password_hash, role) VALUES
('parent_demo@example.com', 'hashed_parent', 'parent'),
('center_demo@example.com', 'hashed_center', 'center_admin'),
('admin@example.com', 'hashed_admin', 'admin');

-- Родитель
INSERT INTO parents (user_id, full_name, phone, city)
VALUES (1, 'Демо Родитель', '+7-999-000-00-00', 'Симферополь');

-- Ребёнок
INSERT INTO kids (parent_id, full_name, birth_date, gender)
VALUES (1, 'Аня Л.', '2016-05-10', 'girl');

-- Центр
INSERT INTO centers (user_id, name, description, city, address, phone, website)
VALUES (
    2,
    'Демо Центр развития детей',
    'Кружки по творчеству, спорту и IT для детей от 4 до 14 лет.',
    'Симферополь',
    'ул. Примерная, д. 10',
    '+7-978-111-11-11',
    'https://demo-center.example.com'
);

-- Зал
INSERT INTO rooms (center_id, name, capacity)
VALUES (1, 'Кабинет 101', 12);

-- Занятие
INSERT INTO activities (center_id, title, category, description, min_age, max_age, level)
VALUES (
    1,
    'Робототехника для детей',
    'IT',
    'Изучение основ робототехники и программирования в игровой форме.',
    8,
    12,
    'beginner'
);

-- Группа
INSERT INTO activity_groups (activity_id, name, max_kids, start_date)
VALUES (1, 'Группа 8–10 лет (вечер)', 10, '2025-09-01');

-- Слоты расписания (Пн и Ср 17:00–18:30)
INSERT INTO schedule_slots (group_id, weekday, start_time, end_time, room_id)
VALUES
(1, 1, '17:00:00', '18:30:00', 1),
(1, 3, '17:00:00', '18:30:00', 1);

-- Запись ребёнка на группу
INSERT INTO enrollments (kid_id, group_id, status, comment)
VALUES (1, 1, 'approved', 'Подтверждено администратором центра');

-- Тарифы
INSERT INTO tariff_plans (code, name, max_activities, max_kids, price_month)
VALUES
('BASIC', 'Базовый', 5, 100, 1990.00),
('PRO', 'Продвинутый', 20, 500, 4990.00);

-- Подписка центра
INSERT INTO center_subscriptions (center_id, tariff_id, start_date, end_date, is_active)
VALUES (1, 2, '2025-01-01', '2025-12-31', TRUE);



ALTER TABLE kids
  ADD COLUMN photo_url VARCHAR(255) NULL,
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


ALTER TABLE parents
  ADD COLUMN telegram VARCHAR(100) NULL,
  ADD COLUMN whatsapp VARCHAR(100) NULL,
  ADD COLUMN extra_email VARCHAR(255) NULL,
  ADD COLUMN avatar_url VARCHAR(255) NULL;

CREATE TABLE school_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kid_id INT NOT NULL,
    weekday TINYINT NOT NULL,          -- 1=Пн ... 7=Вс
    lesson_number TINYINT NULL,        -- 1,2,3... (по желанию)
    start_time TIME NULL,              -- или можно хранить время
    end_time TIME NULL,
    subject VARCHAR(100) NOT NULL,
    classroom VARCHAR(50) NULL,
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ПОЛНОЕ ПЕРЕСОЗДАНИЕ БАЗЫ РАЗВИТАЙМ
-- ВНИМАНИЕ: УДАЛИТ СТАРУЮ БАЗУ razvitime ЦЕЛИКОМ

DROP DATABASE IF EXISTS razvitime;

CREATE DATABASE razvitime
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE razvitime;

-- =========================
-- 1. Пользователи (аккаунты)
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('parent','center_admin','admin') NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL
) ENGINE=InnoDB;

-- =========================
-- 2. Профиль родителя
-- =========================
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    notes TEXT,
    telegram VARCHAR(100) NULL,
    whatsapp VARCHAR(100) NULL,
    extra_email VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 3. Профиль детского центра
-- =========================
CREATE TABLE centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100),
    address VARCHAR(255),
    latitude DECIMAL(9,6) NULL,
    longitude DECIMAL(9,6) NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    website VARCHAR(255),
    instagram VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 4. Комнаты / залы центра
-- =========================
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 5. Дети
-- =========================
CREATE TABLE kids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    birth_date DATE,
    gender ENUM('girl','boy','other') NULL,
    special_needs TEXT,
    photo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 6. Школьное расписание детей
-- =========================
CREATE TABLE school_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kid_id INT NOT NULL,
    weekday TINYINT NOT NULL,          -- 1=Пн ... 7=Вс
    lesson_number TINYINT NULL,        -- 1,2,3...
    start_time TIME NULL,
    end_time TIME NULL,
    subject VARCHAR(100) NOT NULL,
    classroom VARCHAR(50) NULL,
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 7. Направления / кружки (внутри центра)
-- =========================
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    min_age TINYINT,
    max_age TINYINT,
    level VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 8. Группы внутри занятия
-- =========================
CREATE TABLE activity_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    max_kids INT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (activity_id) REFERENCES activities(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 9. Слоты расписания (конкретные дни/время)
-- =========================
CREATE TABLE schedule_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    weekday TINYINT NOT NULL,             -- 1=Пн ... 7=Вс
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INT NULL,
    FOREIGN KEY (group_id) REFERENCES activity_groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 10. Запись ребёнка в группу
-- =========================
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kid_id INT NOT NULL,
    group_id INT NOT NULL,
    status ENUM('pending','approved','rejected','waitlist','left')
        DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kid_id, group_id),
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES activity_groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 11. Избранные центры у родителя
-- =========================
CREATE TABLE favorite_centers (
    parent_id INT NOT NULL,
    center_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, center_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 12. Напоминания о занятиях
-- =========================
CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    kid_id INT NULL,
    schedule_slot_id INT NOT NULL,
    remind_before_minutes INT NOT NULL DEFAULT 60,
    channel ENUM('email','sms','telegram','push') DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (kid_id) REFERENCES kids(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (schedule_slot_id) REFERENCES schedule_slots(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 13. Тарифы и подписки центров
-- =========================
CREATE TABLE tariff_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,     -- BASIC, PRO и т.п.
    name VARCHAR(100) NOT NULL,
    max_activities INT,
    max_kids INT,
    price_month DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE center_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    tariff_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (tariff_id) REFERENCES tariff_plans(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- 14. ТЕСТОВЫЕ ДАННЫЕ
-- =========================

-- Пользователи:
-- 1 — демо-родитель
-- 2 — админ Центра №1
-- 3 — админ платформы
-- 4 — админ Центра №2
INSERT INTO users (email, password_hash, role) VALUES
('parent_demo@example.com', 'hashed_parent', 'parent'),
('center_demo1@example.com', 'hashed_center1', 'center_admin'),
('admin@example.com', 'hashed_admin', 'admin'),
('center_demo2@example.com', 'hashed_center2', 'center_admin');

-- Родитель (id=1)
INSERT INTO parents (user_id, full_name, phone, city, telegram, whatsapp, extra_email, avatar_url)
VALUES (
  1,
  'Демо Родитель',
  '+7-999-000-00-00',
  'Симферополь',
  '@demo_parent',
  '+7-999-000-00-00',
  'parent_demo_alt@example.com',
  'https://dummyimage.com/120x120/ffe1c8/333333&text=DR'
);

-- Дети демо-родителя
-- kid_id = 1..3
INSERT INTO kids (parent_id, full_name, birth_date, gender, photo_url, special_needs)
VALUES
  (1, 'Аня Л.',  '2016-05-10', 'girl', 'https://dummyimage.com/80x80/e4f6e4/333333&text=A', NULL),
  (1, 'Мария Петрова', '2017-03-15', 'girl', 'https://dummyimage.com/80x80/ffe1c8/333333&text=M', NULL),
  (1, 'Илья Петров',   '2013-09-02', 'boy',  'https://dummyimage.com/80x80/e4f6e4/333333&text=I', NULL);

-- Школьное расписание (school_lessons) для детей
-- Привязка к kid_id: 1 = Аня, 2 = Мария, 3 = Илья

-- Аня, начальная школа (Пн–Пт 1–4 уроки)
INSERT INTO school_lessons (kid_id, weekday, lesson_number, subject, classroom)
VALUES
(1, 1, 1, 'Русский язык', 'Каб. 5'),
(1, 1, 2, 'Математика',   'Каб. 5'),
(1, 1, 3, 'Окружающий мир', 'Каб. 7'),
(1, 2, 1, 'Математика',   'Каб. 5'),
(1, 2, 2, 'Чтение',       'Каб. 5'),
(1, 3, 1, 'Английский язык', 'Каб. 12'),
(1, 3, 2, 'Русский язык', 'Каб. 5'),
(1, 4, 1, 'Математика',   'Каб. 5'),
(1, 5, 1, 'Физкультура',  'Спортзал');

-- Мария (8 лет, 2–3 класс, похоже на демо-расписание из сайта)
INSERT INTO school_lessons (kid_id, weekday, lesson_number, subject, classroom)
VALUES
(2, 1, 1, 'Русский язык', 'Каб. 8'),
(2, 1, 2, 'Математика',   'Каб. 8'),
(2, 1, 3, 'Литература',   'Каб. 9'),
(2, 2, 1, 'Математика',   'Каб. 8'),
(2, 2, 2, 'Окружающий мир', 'Каб. 7'),
(2, 3, 1, 'Английский язык', 'Каб. 12'),
(2, 3, 2, 'Русский язык', 'Каб. 8'),
(2, 4, 1, 'Информатика',  'Каб. 15'),
(2, 5, 1, 'Физкультура',  'Спортзал');

-- Илья (12 лет, средняя школа)
INSERT INTO school_lessons (kid_id, weekday, lesson_number, subject, classroom)
VALUES
(3, 1, 1, 'Алгебра',      'Каб. 21'),
(3, 1, 2, 'Геометрия',    'Каб. 21'),
(3, 1, 3, 'Физика',       'Каб. 19'),
(3, 2, 1, 'Русский язык', 'Каб. 18'),
(3, 2, 2, 'История',      'Каб. 16'),
(3, 3, 1, 'Английский язык', 'Каб. 12'),
(3, 3, 2, 'Информатика',  'Каб. 25'),
(3, 4, 1, 'Физкультура',  'Спортзал'),
(3, 5, 1, 'Обществознание','Каб. 17');

-- Центры:
-- center_id = 1,2
INSERT INTO centers (user_id, name, description, city, address, phone, whatsapp, website, instagram)
VALUES
(
  2,
  'Демо Центр развития детей',
  'Кружки по творчеству, спорту и IT для детей от 4 до 14 лет.',
  'Симферополь',
  'ул. Примерная, д. 10',
  '+7-978-111-11-11',
  '+7-978-111-11-11',
  'https://demo-center.example.com',
  'https://instagram.com/demo_center'
),
(
  4,
  'СК «Дельфин»',
  'Детские группы по плаванию и гимнастике.',
  'Симферополь',
  'ул. Летняя, д. 5',
  '+7-978-222-22-22',
  '+7-978-222-22-22',
  'https://delfin-sport.example.com',
  'https://instagram.com/delfin_sport'
);

-- Залы
INSERT INTO rooms (center_id, name, capacity)
VALUES
  (1, 'Кабинет 101', 12),
  (2, 'Большой бассейн', 20),
  (2, 'Спортивный зал', 18);

-- Занятия (activities)
-- activity_id = 1..5
INSERT INTO activities (center_id, title, category, description, min_age, max_age, level)
VALUES
  (1, 'Робототехника для детей', 'IT',
   'Изучение основ робототехники и программирования в игровой форме.',
   8, 12, 'beginner'),
  (1, 'Творческая студия «АртMix»', 'творчество',
   'Рисование, лепка и декоративно-прикладное творчество для детей.',
   6, 10, 'beginner'),
  (1, 'Английский язык для детей', 'языки',
   'Коммуникативный курс английского языка с играми и проектами.',
   7, 12, 'beginner'),
  (2, 'Плавание для детей 6–9 лет', 'спорт',
   'Обучение плаванию и игры в воде в малых группах.',
   6, 9, 'beginner'),
  (2, 'Гимнастика 8–12 лет', 'спорт',
   'Общая физическая подготовка и базовая спортивная гимнастика.',
   8, 12, 'beginner');

-- Группы (activity_groups)
-- group_id = 1..6
INSERT INTO activity_groups (activity_id, name, max_kids, start_date, end_date)
VALUES
  (1, 'Робототехника 8–10 лет (вечер)', 10, '2025-09-01', NULL),      -- id=1
  (1, 'Робототехника 10–12 лет (выходные)', 10, '2025-09-01', NULL),  -- id=2
  (2, 'АртMix 6–8 лет (вечер)', 12, '2025-09-01', NULL),              -- id=3
  (3, 'Английский 7–10 лет (после школы)', 12, '2025-09-01', NULL),   -- id=4
  (4, 'Плавание (младшая группа)', 8, '2025-09-01', NULL),            -- id=5
  (5, 'Гимнастика (спортгруппа)', 10, '2025-09-01', NULL);            -- id=6

-- Слоты расписания (schedule_slots)
-- привязаны к демо-расписанию с Пн–Пт
INSERT INTO schedule_slots (group_id, weekday, start_time, end_time, room_id)
VALUES
  -- Робототехника 8–10 (вечер) — Пн, Ср 17:00–18:30
  (1, 1, '17:00:00', '18:30:00', 1),
  (1, 3, '17:00:00', '18:30:00', 1),

  -- Робототехника 10–12 (выходные) — Сб 11:00–12:30
  (2, 6, '11:00:00', '12:30:00', 1),

  -- АртMix 6–8 — Вт, Чт 16:00–17:00 (как в демо: рисование / творчество)
  (3, 2, '16:00:00', '17:00:00', 1),
  (3, 4, '16:00:00', '17:00:00', 1),

  -- Английский 7–10 — Ср 17:00–18:00
  (4, 3, '17:00:00', '18:00:00', 1),

  -- Плавание — Вт, Чт 18:00–19:00 (как в демо: плавание)
  (5, 2, '18:00:00', '19:00:00', 2),
  (5, 4, '18:00:00', '19:00:00', 2),

  -- Гимнастика — Чт 17:30–18:30
  (6, 4, '17:30:00', '18:30:00', 3);

-- Записи детей (enrollments)
-- kid_id: 1 = Аня, 2 = Мария, 3 = Илья
-- group_id: см. выше комментарии
INSERT INTO enrollments (kid_id, group_id, status, comment, created_at)
VALUES
  -- Аня: робототехника (Пн, Ср)
  (1, 1, 'approved', 'Подтверждено администратором центра', NOW()),

  -- Мария: рисование (АртMix) и английский
  (2, 3, 'approved', 'Основная творческая студия', NOW()),
  (2, 4, 'approved', 'Группа английского языка', NOW()),

  -- Илья: плавание и гимнастика
  (3, 5, 'approved', 'Тренировки по плаванию', NOW()),
  (3, 6, 'pending',  'Ожидает подтверждения на гимнастику', NOW());

-- Избранные центры для демо-родителя
INSERT INTO favorite_centers (parent_id, center_id)
VALUES
  (1, 1),
  (1, 2);

-- Напоминания (reminders) — для демонстрации
-- parent_id = 1, kid_id = 2 (Мария), 3 (Илья)
-- schedule_slot_id: см. AUTO_INCREMENT (у тебя после вставки выше:
--   1..9, но если хочешь строго, можно уточнить SELECT’ом)
INSERT INTO reminders (parent_id, kid_id, schedule_slot_id, remind_before_minutes, channel, is_active)
VALUES
  (1, 2, 4, 60, 'telegram', TRUE),  -- Мария, АртMix Вт 16:00
  (1, 2, 6, 60, 'telegram', TRUE),  -- Мария, английский Ср 17:00
  (1, 3, 8, 90, 'email', TRUE);     -- Илья, пactivitiesлавание Вт 18:00

-- Тарифы
INSERT INTO tariff_plans (code, name, max_activities, max_kids, price_month)
VALUES
  ('BASIC', 'Базовый', 5, 100, 1990.00),
  ('PRO',   'Продвинутый', 20, 500, 4990.00);

-- Подписки для центров
INSERT INTO center_subscriptions (center_id, tariff_id, start_date, end_date, is_active)
VALUES
  (1, 2, '2025-01-01', '2025-12-31', TRUE),
  (2, 1, '2025-03-01', '2025-08-31', TRUE);

CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    age TINYINT NULL,
    education VARCHAR(255) NULL,
    experience_years TINYINT NULL,
    bio TEXT,
    photo_url VARCHAR(255),
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    role ENUM('parent','center_admin','guest') NOT NULL DEFAULT 'guest',
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open','in_progress','closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


