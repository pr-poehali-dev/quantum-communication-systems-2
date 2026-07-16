CREATE TABLE IF NOT EXISTS project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    folder VARCHAR(255) NOT NULL DEFAULT 'Общая документация',
    file_name VARCHAR(512) NOT NULL,
    ext VARCHAR(32),
    size_bytes BIGINT DEFAULT 0,
    cdn_url TEXT,
    s3_key TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_folder ON project_documents(project_id, folder);