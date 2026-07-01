FROM python:3.12-slim

WORKDIR /app

COPY server.py index.html view.html ./
COPY css ./css
COPY js ./js
COPY data/.gitkeep ./data/

RUN mkdir -p /app/data

ENV HACCP_HOST=0.0.0.0
ENV HACCP_PORT=8765

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/api/health')"

CMD ["python3", "server.py"]
