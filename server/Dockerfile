FROM python:3.13-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
ENV DB_PATH=/data/license.db SIGNING_KEY_PATH=/data/signing_key.pem
VOLUME /data
CMD ["uvicorn", "--factory", "app.api:application", "--host", "0.0.0.0", "--port", "8000"]
