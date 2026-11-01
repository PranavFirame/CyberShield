# 09. CyberShield — REST & SSE API Contract

All endpoints follow RESTful conventions, return strict JSON payloads, and are prefixed with `/api/v1`.

---

## 1. Authentication & Users

### `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "Jane Developer"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "user": { "id": "u-1234", "email": "user@example.com", "fullName": "Jane Developer", "role": "USER" },
    "token": "jwt_token_string"
  }
  ```

### `POST /api/v1/auth/login`
- **Request Body**: `{ "email": "user@example.com", "password": "SecurePassword123!" }`
- **Response (200 OK)**: Returns JWT bearer token in JSON and sets secure `HttpOnly` session cookie.

---

## 2. Repositories & Scans

### `POST /api/v1/scans`
Submit a public GitHub repository for multi-engine analysis.
- **Request Body**:
  ```json
  {
    "repoUrl": "https://github.com/expressjs/express",
    "branch": "main",
    "forceRescan": false
  }
  ```
- **Response (202 Accepted)**:
  ```json
  {
    "scanId": "scan-9a8b-4c3d",
    "repository": {
      "fullName": "expressjs/express",
      "defaultBranch": "main"
    },
    "status": "QUEUED",
    "streamUrl": "/api/v1/scans/scan-9a8b-4c3d/stream"
  }
  ```

### `GET /api/v1/scans/:id`
Retrieve full scan report metadata, risk score, and summary counts.
- **Response (200 OK)**:
  ```json
  {
    "scanId": "scan-9a8b-4c3d",
    "status": "COMPLETED",
    "repository": "expressjs/express",
    "commitSha": "7c49b01",
    "durationMs": 42100,
    "riskScore": 68.5,
    "summary": {
      "totalFindings": 18,
      "critical": 2,
      "high": 5,
      "medium": 8,
      "low": 3,
      "novelDiscoveries": 4
    },
    "disasterCostModel": {
      "expectedLoss": 142500,
      "lowLoss": 45000,
      "worstCaseLoss": 310000,
      "currency": "USD"
    }
  }
  ```

### `GET /api/v1/scans/:id/stream` (Server-Sent Events)
Live telemetry stream for scan execution.
- **Headers**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- **SSE Event Stream**:
  ```
  event: progress
  data: {"scanId":"scan-9a8b-4c3d","stage":"FETCHING","percent":15,"message":"Downloading repo archive"}

  event: progress
  data: {"scanId":"scan-9a8b-4c3d","stage":"ANALYZING","percent":55,"message":"Running Semgrep SAST rules"}

  event: progress
  data: {"scanId":"scan-9a8b-4c3d","stage":"NOVEL_DISCOVERY","percent":75,"message":"Evaluating AST taint flows"}

  event: complete
  data: {"scanId":"scan-9a8b-4c3d","status":"COMPLETED","redirectUrl":"/app/scans/scan-9a8b-4c3d"}
  ```

### `POST /api/v1/scans/:id/cancel`
- **Response (200 OK)**: `{ "success": true, "message": "Scan cancelled" }`

---

## 3. Findings Explorer & Remediation

### `GET /api/v1/scans/:id/findings`
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `25` (max 100)
  - `severity`: `CRITICAL,HIGH,MEDIUM,LOW,INFO`
  - `engineType`: `KNOWN_VULNERABILITY,NOVEL_DISCOVERY`
  - `status`: `CONFIRMED,LIKELY,NEEDS_VERIFICATION,FALSE_POSITIVE`
  - `search`: string filter on title, rule, or filename
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "find-1122",
        "fingerprint": "a3f5b9c0...",
        "title": "Path Traversal via Unsafe decodeURIComponent",
        "engineType": "NOVEL_DISCOVERY",
        "toolName": "novel-ast",
        "ruleId": "cyber.novel.path-traversal-taint",
        "severity": "CRITICAL",
        "confidence": "CONFIRMED",
        "validationStatus": "CONFIRMED",
        "cweIds": ["CWE-22"],
        "location": {
          "filePath": "src/view.js",
          "startLine": 78,
          "endLine": 80
        },
        "codeSnippet": "const fullPath = path.join(BASE_DIR, decodeURIComponent(userFilename));",
        "hasRemediation": true
      }
    ],
    "pagination": { "page": 1, "limit": 25, "total": 18, "totalPages": 1 }
  }
  ```

### `GET /api/v1/findings/:id`
Retrieves granular finding details, AST taint trace, attack narrative, and code fix diff.
- **Response (200 OK)**:
  ```json
  {
    "id": "find-1122",
    "title": "Path Traversal via Unsafe decodeURIComponent",
    "description": "User-controlled route parameter is decoded and appended to base directory...",
    "attackNarrative": "An external adversary supplies %2e%2e directory escape sequences...",
    "taintTrace": {
      "source": "req.params.filename",
      "sink": "fs.readFileSync",
      "steps": [
        { "file": "src/router.js", "line": 42, "description": "Received parameter from HTTP GET" },
        { "file": "src/view.js", "line": 78, "description": "Passed without boundary normalization" }
      ]
    },
    "remediation": {
      "summary": "Normalize path and assert that path.resolve remains within allowed root directory",
      "patchDiff": "--- a/src/view.js\n+++ b/src/view.js\n@@ -78,1 +78,3 @@\n- const fullPath = path.join(BASE_DIR, decodeURIComponent(userFilename));\n+ const safe = path.resolve(BASE_DIR, path.normalize(decodeURIComponent(userFilename)));\n+ if (!safe.startsWith(BASE_DIR)) throw new Error('Path traversal blocked');",
      "unitTestFixture": "it('rejects path traversal attempts', () => { ... })"
    }
  }
  ```

---

## 4. Disaster Cost Customization

### `PUT /api/v1/scans/:id/cost-assumptions`
Update financial disaster variables and re-calculate low, expected, and worst-case ranges.
- **Request Body**:
  ```json
  {
    "recordsAtRisk": 25000,
    "costPerRecord": 165.0,
    "downtimeDays": 2.5,
    "downtimeCostPerDay": 30000.0,
    "incidentResponseCost": 50000.0
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "updatedCostModel": {
      "recordsLoss": 4125000.0,
      "downtimeLoss": 75000.0,
      "incidentResponse": 50000.0,
      "regulatoryOverhead": 625000.0,
      "totalExpectedLoss": 4875000.0,
      "lowLoss": 1706250.0,
      "worstCaseLoss": 10725000.0
    }
  }
  ```

---

## 5. Report Exports

- `GET /api/v1/scans/:id/export/sarif`: Returns standard SARIF 2.1.0 JSON format for GitHub / IDE integration.
- `GET /api/v1/scans/:id/export/json`: Returns raw CyberShield normalized finding dump.
- `GET /api/v1/scans/:id/export/pdf`: Streams generated printable executive summary PDF.
- `GET /api/v1/scans/:id/export/markdown`: Returns a markdown summary suitable for GitHub issues or PR comments.

---

## 6. Standard Error Format
All errors return consistent HTTP status codes and JSON envelopes:
```json
{
  "error": {
    "code": "INVALID_REPOSITORY_URL",
    "message": "Only public repositories on github.com are permitted in MVP.",
    "details": { "input": "http://192.168.1.1/exploit" },
    "timestamp": "2026-11-01T06:35:00.000Z"
  }
}
```
