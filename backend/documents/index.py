import json
import os
import base64
import uuid
from datetime import datetime

import boto3
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    Хранилище документов проекта: список, загрузка и удаление файлов.
    GET  ?project_id=&folder=  — список документов проекта (или всех папок)
    POST {project_id, folder, file_name, content_base64} — загрузка файла в S3 + запись в БД
    DELETE ?id=  — удаление документа
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            project_id = params.get('project_id')
            folder = params.get('folder')
            cur = conn.cursor()
            query = "SELECT id, project_id, folder, file_name, ext, size_bytes, cdn_url, uploaded_at FROM project_documents"
            conds = []
            if project_id is not None and str(project_id).strip() != '':
                conds.append("project_id = " + str(int(project_id)))
            if folder:
                safe = folder.replace("'", "''")
                conds.append("folder = '" + safe + "'")
            if conds:
                query += " WHERE " + " AND ".join(conds)
            query += " ORDER BY uploaded_at DESC"
            cur.execute(query)
            rows = cur.fetchall()
            cur.close()
            docs = [{
                'id': r[0], 'project_id': r[1], 'folder': r[2], 'file_name': r[3],
                'ext': r[4], 'size_bytes': r[5], 'cdn_url': r[6],
                'uploaded_at': r[7].isoformat() if r[7] else None,
            } for r in rows]
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'documents': docs})}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            project_id = body.get('project_id')
            folder = (body.get('folder') or 'Общая документация').strip()
            file_name = (body.get('file_name') or 'file').strip()
            content_b64 = body.get('content_base64') or ''

            if not content_b64:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'content_base64 required'})}

            if ',' in content_b64 and content_b64.strip().startswith('data:'):
                content_b64 = content_b64.split(',', 1)[1]
            data = base64.b64decode(content_b64)

            ext = file_name.rsplit('.', 1)[-1].upper() if '.' in file_name else 'FILE'
            key = f"documents/{project_id or 'common'}/{uuid.uuid4().hex}_{file_name}"

            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket='files', Key=key, Body=data)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            cur = conn.cursor()
            pid_val = 'NULL' if project_id in (None, '') else str(int(project_id))
            fld = folder.replace("'", "''")
            fn = file_name.replace("'", "''")
            ex = ext.replace("'", "''")
            url = cdn_url.replace("'", "''")
            k = key.replace("'", "''")
            cur.execute(
                "INSERT INTO project_documents (project_id, folder, file_name, ext, size_bytes, cdn_url, s3_key) "
                f"VALUES ({pid_val}, '{fld}', '{fn}', '{ex}', {len(data)}, '{url}', '{k}') "
                "RETURNING id, uploaded_at"
            )
            row = cur.fetchone()
            cur.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'id': row[0], 'project_id': project_id, 'folder': folder,
                        'file_name': file_name, 'ext': ext, 'size_bytes': len(data),
                        'cdn_url': cdn_url, 'uploaded_at': row[1].isoformat() if row[1] else None,
                    })}

        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            doc_id = params.get('id')
            if not doc_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id required'})}
            cur = conn.cursor()
            cur.execute(f"DELETE FROM project_documents WHERE id = {int(doc_id)}")
            cur.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'deleted': int(doc_id)})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}
    finally:
        conn.close()
