# Production Prerequisites — AI Concierge Features

> **Last updated:** 2026-03-15
> **Features covered:** EDA Builder, Document Forensics, RACM Generator
> **Status:** All three are in `feature/document-forensics` branch (BE + FE), not yet on production.

---

## 1. Database Migrations

Run these SQL scripts **in order** on the production MySQL database before deploying.

### EDA Builder
| Script | Purpose |
|--------|---------|
| `db_05_03_2026_eda_jobs.sql` | Creates `eda_jobs` table (job state, file URLs, results, report URLs, evidence URLs, LLM cost) |

### RACM Generator
| Script | Purpose |
|--------|---------|
| `db_27_02_2026_racm_jobs.sql` | Creates `racm_jobs` table (job state, custom prompt, RACM result) |
| `db_28_02_2026_racm_jobs_add_team_id.sql` | Adds `team_id` column to `racm_jobs` |

### Document Forensics
| Script | Purpose |
|--------|---------|
| `db_15_03_2026_document_forensics_jobs.sql` | Creates `document_forensics_jobs` table (job state, risk level, composite score, enabled checks) |
| `db_15_03_2026_document_forensics_alter_distributed_job_id.sql` | Alters `distributed_job_id` from BIGINT to VARCHAR(36) — run this if the table was already created with the original script |

### Pre-existing (should already exist on prod)
- `distributed_jobs` table (`db_03_08_2025_distributed_jobs_schema.sql`) — shared async job queue used by all features

All scripts are at: `datamanager/src/main/resources/db_scripts/`

---

## 2. Environment Variables

### Shared (required by all features)
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | Platform-level OpenAI API key. Used as fallback by EDA and Forensics |
| `ANTHROPIC_API_KEY` | Optional | For Anthropic/Claude LLM reports in EDA |
| `GEMINI_API_KEY` | Optional | For Google Gemini LLM reports in EDA |

### EDA Builder
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EDA_PYTHON_EXECUTABLE` | No | Auto-detected `.venv/bin/python3` or `python3` | Path to Python interpreter |
| `EDA_PYTHON_SCRIPT_DIR` | No | `src/main/python/eda` (local) / `/app/python/eda` (container) | Directory containing `run_eda.py` |

### Document Forensics
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FORENSICS_PYTHON_EXECUTABLE` | No | Auto-detected `.venv/bin/python3` or `python3` | Path to Python interpreter |
| `FORENSICS_PYTHON_SCRIPT_DIR` | No | `src/main/python/document-forensics` (local) / `/app/python/document-forensics` (container) | Directory containing `run_pipeline.py` |
| `FORENSICS_LLM_MODEL` | No | `gpt-4o` | LLM model for forensic analysis (litellm format) |
| `FORENSICS_LLM_API_KEY` | No | Falls back to `OPENAI_API_KEY` | Forensics-specific LLM API key |
| `FORENSICS_LLM_BASE_URL` | No | Falls back to `ai.openai.base-url` | Custom LLM endpoint |

### RACM Generator
- No Python subprocess — uses Java LLM integration directly
- Requires `OPENAI_API_KEY` (or whichever LLM provider is configured in `ai.openai.*` properties)

---

## 3. Docker / Container Changes (CRITICAL)

**Current state:** Dockerfiles (`Dockerfile`, `Dockerfile.azure`, `Dockerfile.prebuilt`) install Python 3 + pip and copy `scripts/` but do **NOT** copy `src/main/python/` directories.

### Changes needed in ALL Dockerfiles:

```dockerfile
# === ADD THESE LINES ===

# Copy EDA Python source
COPY src/main/python/eda/ /app/python/eda/

# Copy Document Forensics Python source
COPY src/main/python/document-forensics/ /app/python/document-forensics/

# Create virtual environments and install dependencies
RUN cd /app/python/eda && python3 -m venv .venv && .venv/bin/pip install --no-cache-dir -r requirements.txt
RUN cd /app/python/document-forensics && python3 -m venv .venv && .venv/bin/pip install --no-cache-dir -r requirements.txt
```

### Additional system packages needed for Forensics:
Document Forensics uses `opencv-python-headless` and `scikit-image` which may need:
```dockerfile
# Add to the existing apt-get install block:
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0
```

### Python version requirement:
- **Minimum:** Python 3.10 (required by scipy, scikit-image, numpy)
- **Tested with:** Python 3.13 (Homebrew) locally
- Current Dockerfiles use system Python from base image — verify it's 3.10+

---

## 4. Python Dependencies

### EDA Builder (`src/main/python/eda/requirements.txt`)
```
pandas>=2.2.0, numpy>=2.0.0, scipy>=1.14.0, plotly>=6.0.0,
pyarrow>=15.0.0, pydantic>=2.0.0, aiosqlite>=0.21.0,
anthropic>=0.25.0, openai>=1.35.0, google-generativeai>=0.8.0,
jinja2>=3.1.0, openpyxl>=3.1.0, python-calamine>=0.2.0,
python-docx>=1.1.0, tqdm>=4.66.0, matplotlib>=3.9.0
```

### Document Forensics (`src/main/python/document-forensics/requirements.txt`)
```
litellm>=1.0, pymupdf>=1.24.0, exifread>=3.0.0,
pillow>=10.0.0, opencv-python-headless>=4.8.0, scipy>=1.11.0,
numpy>=1.26.0, scikit-image>=0.19.0, scikit-learn>=1.0,
pyyaml>=6.0, python-dotenv>=1.0.0, python-dateutil>=2.8.0,
fastapi>=0.115.0, uvicorn>=0.32.0, python-multipart>=0.0.9
```

---

## 5. Application Config (`application.yaml`)

These sections should already exist in the `feature/document-forensics` branch:

```yaml
eda:
  python:
    executable: ${EDA_PYTHON_EXECUTABLE:#{null}}
    script:
      dir: ${EDA_PYTHON_SCRIPT_DIR:#{null}}

document-forensics:
  python:
    executable: ${FORENSICS_PYTHON_EXECUTABLE:#{null}}
    script:
      dir: ${FORENSICS_PYTHON_SCRIPT_DIR:#{null}}
  llm:
    model: ${FORENSICS_LLM_MODEL:#{null}}
    api-key: ${FORENSICS_LLM_API_KEY:#{null}}
    base-url: ${FORENSICS_LLM_BASE_URL:#{null}}
```

---

## 6. File Storage

Both EDA and Forensics download files to local temp directories during processing and clean up after.

| Concern | Detail |
|---------|--------|
| Temp directory | Java `Files.createTempDirectory()` — default OS temp dir |
| EDA report upload | Uploads generated HTML reports + evidence CSVs to S3/Azure Blob |
| Forensics result | Stored as JSON in `document_forensics_jobs.result` column — no file upload needed |
| Disk space | Ensure sufficient temp disk space for large file processing (PDFs up to 100MB for EDA, 50MB for Forensics) |

---

## 7. Memory & Resource Considerations

| Feature | Concern | Mitigation |
|---------|---------|------------|
| EDA | Python subprocess can OOM on large datasets | Monitor for exit code 137, consider memory limits on containers |
| Forensics | OpenCV + scikit-image are memory-heavy for large images | Same OOM handling, limit file size to 50MB |
| RACM | LLM calls can be slow on large SOPs | Timeout handling in pipeline service |
| All | Python venvs add ~500MB-1GB to container image | Consider multi-stage Docker build to reduce size |

Default JVM settings: `-Xmx1g -Xms512m` — may need to increase for production workloads with concurrent forensic/EDA jobs.

---

## 8. Pre-Deployment Checklist

- [ ] Run all DB migration scripts on production database
- [ ] Update Dockerfiles to copy Python source + create venvs
- [ ] Set required environment variables (at minimum: `OPENAI_API_KEY`)
- [ ] Verify Python 3.10+ is available in container
- [ ] Verify system libraries for OpenCV are installed in container
- [ ] Test EDA: upload CSV → check progress polling → verify HTML report generated
- [ ] Test Forensics: upload image → check progress polling → verify JSON result with risk score
- [ ] Test RACM: upload SOP PDF → check progress polling → verify RACM matrix output
- [ ] Monitor container memory during concurrent job execution
- [ ] Verify S3/Blob bucket permissions for EDA report uploads
- [ ] Verify temp directory has sufficient disk space

---

## 9. API Endpoints (for QA/testing reference)

### EDA Builder — `/app/v1/eda/jobs`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create EDA job (fileUrls + fileNames) |
| POST | `/upload` | Local dev: upload files directly |
| GET | `/{jobId}/status` | Poll job status |
| GET | `/{jobId}/result` | Get completed result + report URLs |
| GET | `/` | List user's jobs |
| DELETE | `/{jobId}` | Cancel/delete job |

### RACM Generator — `/app/v1/racm/jobs`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create RACM job (fileUrl + fileName + customPrompt) |
| POST | `/upload` | Local dev: upload file directly |
| GET | `/{jobId}/status` | Poll job status |
| GET | `/{jobId}/result` | Get completed RACM matrix |
| GET | `/` | List user's jobs |
| DELETE | `/{jobId}` | Cancel/delete job |

### Document Forensics — `/app/v1/forensics/jobs`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create forensic job (fileUrl + fileName + enabledChecks) |
| POST | `/upload` | Local dev: upload file directly |
| GET | `/{jobId}/status` | Poll job status |
| GET | `/{jobId}/result` | Get completed forensic result |
| GET | `/` | List user's jobs |
| DELETE | `/{jobId}` | Cancel/delete job |
