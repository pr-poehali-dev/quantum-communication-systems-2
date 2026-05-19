
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'road',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_objects (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  object_type TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO projects (name, description, type, status) VALUES
  ('Главная парковка_Финал', 'Дорога и парковочная зона, трасса ШД-38', 'road', 'active'),
  ('Ул. Трумана реконструкция', 'Реконструкция городской улицы', 'road', 'active'),
  ('Ливневая канализация ЖК Север', 'Проектирование ливневой сети', 'network', 'draft');
