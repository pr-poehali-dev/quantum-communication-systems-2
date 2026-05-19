import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """API для работы с проектами CivilPro: GET список, POST создать, PUT обновить, PATCH статус."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    qs = event.get("queryStringParameters") or {}

    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # GET /projects — список всех проектов
        if method == "GET" and not path.endswith("/objects"):
            cur.execute("""
                SELECT p.id, p.name, p.description, p.type, p.status,
                       p.created_at, p.updated_at,
                       COUNT(po.id) as objects_count
                FROM projects p
                LEFT JOIN project_objects po ON po.project_id = p.id
                WHERE p.user_id = 'default'
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            """)
            rows = cur.fetchall()
            result = []
            for r in rows:
                r = dict(r)
                r["created_at"] = str(r["created_at"])
                r["updated_at"] = str(r["updated_at"])
                result.append(r)
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps(result, ensure_ascii=False)}

        # GET /projects/objects?project_id=1 — объекты проекта
        if method == "GET" and path.endswith("/objects"):
            project_id = qs.get("project_id", "")
            cur.execute("""
                SELECT id, object_type, name, data, created_at
                FROM project_objects WHERE project_id = %s
                ORDER BY created_at DESC
            """, (project_id,))
            rows = [dict(r) for r in cur.fetchall()]
            for r in rows:
                r["created_at"] = str(r["created_at"])
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps(rows, ensure_ascii=False)}

        # POST /projects — создать проект
        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            # Если это добавление объекта в проект
            if "object_type" in body:
                cur.execute("""
                    INSERT INTO project_objects (project_id, object_type, name, data)
                    VALUES (%s, %s, %s, %s) RETURNING id, object_type, name, created_at
                """, (body["project_id"], body["object_type"], body["name"], json.dumps(body.get("data", {}))))
                row = dict(cur.fetchone())
                row["created_at"] = str(row["created_at"])
                # Обновим updated_at проекта
                cur.execute("UPDATE projects SET updated_at = NOW() WHERE id = %s", (body["project_id"],))
                conn.commit()
                conn.close()
                return {"statusCode": 201, "headers": cors, "body": json.dumps(row, ensure_ascii=False)}

            # Создать новый проект
            cur.execute("""
                INSERT INTO projects (user_id, name, description, type, status)
                VALUES ('default', %s, %s, %s, %s)
                RETURNING id, name, description, type, status, created_at, updated_at
            """, (body.get("name", "Новый проект"), body.get("description", ""),
                  body.get("type", "road"), body.get("status", "active")))
            row = dict(cur.fetchone())
            row["created_at"] = str(row["created_at"])
            row["updated_at"] = str(row["updated_at"])
            row["objects_count"] = 0
            conn.commit()
            conn.close()
            return {"statusCode": 201, "headers": cors, "body": json.dumps(row, ensure_ascii=False)}

        # PUT /projects — обновить проект
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            pid = body.get("id")
            cur.execute("""
                UPDATE projects SET name=%s, description=%s, type=%s, status=%s, updated_at=NOW()
                WHERE id=%s AND user_id='default'
                RETURNING id, name, description, type, status, updated_at
            """, (body.get("name"), body.get("description", ""),
                  body.get("type", "road"), body.get("status", "active"), pid))
            row = dict(cur.fetchone())
            row["updated_at"] = str(row["updated_at"])
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps(row, ensure_ascii=False)}

        # PATCH /projects — изменить статус
        if method == "PATCH":
            body = json.loads(event.get("body") or "{}")
            cur.execute("""
                UPDATE projects SET status=%s, updated_at=NOW()
                WHERE id=%s AND user_id='default'
                RETURNING id, status, updated_at
            """, (body.get("status"), body.get("id")))
            row = dict(cur.fetchone())
            row["updated_at"] = str(row["updated_at"])
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps(row, ensure_ascii=False)}

        conn.close()
        return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}

    except Exception as e:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": str(e)})}
