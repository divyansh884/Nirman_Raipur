
# API Endpoint Documentation

**Base URL:** `/api/v1`

---

## 1. Work Progress

**Schema:** `WorkProgress`

### Endpoints
- `GET /work-progress` → Get all work progress records  
- `GET /work-progress/:id` → Get a single work progress record by ID  
- `POST /work-progress` → Create a new work progress record  
- `PUT /work-progress/:id` → Update a work progress record  
- `DELETE /work-progress/:id` → Delete a work progress record  

### Example POST Payload
```json
{
  "workName": "Road construction from Panchayat Bhawan to Devraj's house",
  "area": "Bagicha",
  "workAgency": "Suguja chhetra pradhikaran",
  "scheme": "District Development",
  "technicalApproval": "TS NO - 1870",
  "administrativeApproval": "AS NO - 135",
  "tenderApproval": "Not applicable",
  "workProgressStage": "Pending",
  "workDetails": "CC road construction"
}
```

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Name of executing agency                   |
| scheme                | String | ✅        | Name of scheme                             |
| technicalApproval     | String | ✅        | Technical approval number/details          |
| administrativeApproval| String | ✅        | Administrative approval number/details     |
| tenderApproval        | String | ❌        | Tender approval details                    |
| workProgressStage     | String | ✅        | Stage of work (Pending, In Progress, Completed) |
| workDetails           | String | ❌        | Additional description/details             |
| entryDate             | Date   | ❌        | Date of entry                              |
| lastModified          | Date   | ❌        | Last modification date                     |

---

## 2. Work Orders

**Schema:** `WorkOrder`

### Endpoints
- `GET /work-orders` → Get all work orders  
- `GET /work-orders/:id` → Get a single work order  
- `POST /work-orders` → Create new work order  
- `PUT /work-orders/:id` → Update work order  
- `DELETE /work-orders/:id` → Delete work order  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| scheme                | String | ✅        | Name of scheme                             |
| technicalApproval     | String | ✅        | Technical approval number                  |
| administrativeApproval| String | ✅        | Administrative approval number             |
| tenderApproval        | String | ❌        | Tender approval details                    |
| orderStatus           | String | ✅        | Order status (Pending, Issued, Completed)  |
| workDetails           | String | ❌        | Work details                               |
| entryDate             | Date   | ❌        | Date of entry                              |
| lastModified          | Date   | ❌        | Last modification date                     |

---

## 3. Tenders

**Schema:** `Tender`

### Endpoints
- `GET /tenders` → Get all tenders  
- `GET /tenders/:id` → Get single tender  
- `POST /tenders` → Create new tender  
- `PUT /tenders/:id` → Update tender  
- `DELETE /tenders/:id` → Delete tender  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| technicalApproval     | String | ✅        | Technical approval number                  |
| administrativeApproval| String | ✅        | Administrative approval number             |
| tenderApproval        | String | ❌        | Tender approval details                    |
| workProgressStage     | String | ✅        | Stage of work                              |
| workDetails           | String | ✅        | Additional work details                    |

---

## 4. Administrative Approvals

**Schema:** `AdministrativeApproval`

### Endpoints
- `GET /administrative-approvals` → Get all administrative approvals  
- `GET /administrative-approvals/:id` → Get single approval  
- `POST /administrative-approvals` → Create approval record  
- `PUT /administrative-approvals/:id` → Update approval record  
- `DELETE /administrative-approvals/:id` → Delete approval record  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| scheme                | String | ✅        | Scheme name                                |
| technicalApproval     | String | ✅        | Technical approval                         |
| administrativeApproval| String | ✅        | Administrative approval                    |
| tenderApproval        | String | ❌        | Tender approval details                    |
| workProgressStage     | String | ✅        | Progress stage                             |
| workDetails           | String | ❌        | Work details                               |

---

## 5. Work Types

**Schema:** `WorkType`

### Endpoints
- `GET /work-types` → Get all work types  
- `GET /work-types/:id` → Get single work type  
- `POST /work-types` → Create work type  
- `PUT /work-types/:id` → Update work type  
- `DELETE /work-types/:id` → Delete work type  

### POST / PUT Parameters
| Field        | Type   | Required | Description   |
|--------------|--------|----------|---------------|
| workType     | String | ✅        | Work type     |
| department   | String | ✅        | Department    |
| constituency | String | ❌        | Constituency  |
| engineer     | String | ❌        | Engineer      |
| scheme       | String | ❌        | Scheme        |
| description  | String | ❌        | Description   |
| area         | String | ❌        | Area name     |
| city         | String | ❌        | City name     |
| ward         | String | ❌        | Ward number   |

---

## 6. Reports (Read-Only)

**Schema:** Dynamic — no fixed table  

### Endpoints
- `GET /reports/agency-wise?year=2025&agency=Suguja%20chhetra%20pradhikaran` → Get agency-wise report  
- `GET /reports/block-wise?year=2025&block=Bagicha` → Get block-wise report  
- `GET /reports/scheme-wise?year=2025&scheme=District Development` → Get scheme-wise report  
- `GET /reports/pending?year=2025` → Get pending works report  
- `GET /reports/final-status?year=2025` → Get final status of all works  
- `GET /reports/engineer-wise?year=2025&engineer=XYZ` → Get works assigned to an engineer  
- `GET /reports/photo-missing?year=2025` → Get list of works without photos  

---

## 7. Search Filters (common for all GET endpoints)

All list endpoints can take query params for filtering:

```
?area=Bagicha&scheme=District Development&status=Pending
```

- **area** → block/city name  
- **scheme** → scheme name  
- **status** → progress stage  

---

## 1. Work Progress (Detailed)

**Schema:** `WorkProgress`

### Endpoints
- `GET /work-progress` → Get all work progress records  
- `GET /work-progress/:id` → Get a single work progress record by ID  
- `POST /work-progress` → Create a new work progress record  
- `PUT /work-progress/:id` → Update a work progress record  
- `DELETE /work-progress/:id` → Delete a work progress record  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Name of executing agency                   |
| scheme                | String | ✅        | Name of scheme                             |
| technicalApproval     | String | ✅        | Technical approval number/details          |
| administrativeApproval| String | ✅        | Administrative approval number/details     |
| tenderApproval        | String | ❌        | Tender approval details                    |
| workProgressStage     | String | ✅        | Stage of work (Pending, In Progress, Completed) |
| workDetails           | String | ❌        | Additional description/details             |
| entryDate             | Date   | ❌        | Date of entry                              |
| lastModified          | Date   | ❌        | Last modification date                     |

---

## 2. Work Orders

**Schema:** `WorkOrder`

### Endpoints
- `GET /work-orders` → Get all work orders  
- `GET /work-orders/:id` → Get a single work order  
- `POST /work-orders` → Create new work order  
- `PUT /work-orders/:id` → Update work order  
- `DELETE /work-orders/:id` → Delete work order  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| scheme                | String | ✅        | Name of scheme                             |
| technicalApproval     | String | ✅        | Technical approval number                  |
| administrativeApproval| String | ✅        | Administrative approval number             |
| tenderApproval        | String | ❌        | Tender approval details                    |
| orderStatus           | String | ✅        | Order status (Pending, Issued, Completed)  |
| workDetails           | String | ❌        | Work details                               |
| entryDate             | Date   | ❌        | Date of entry                              |
| lastModified          | Date   | ❌        | Last modification date                     |

---

## 3. Tenders

**Schema:** `Tender`

### Endpoints
- `GET /tenders` → Get all tenders  
- `GET /tenders/:id` → Get single tender  
- `POST /tenders` → Create new tender  
- `PUT /tenders/:id` → Update tender  
- `DELETE /tenders/:id` → Delete tender  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| technicalApproval     | String | ✅        | Technical approval number                  |
| administrativeApproval| String | ✅        | Administrative approval number             |
| tenderApproval        | String | ✅        | Tender approval details                    |
| workProgressStage     | String | ✅        | Stage of work                              |
| workDetails           | String | ❌        | Additional work details                    |

---

## 4. Administrative Approvals

**Schema:** `AdministrativeApproval`

### Endpoints
- `GET /administrative-approvals` → Get all administrative approvals  
- `GET /administrative-approvals/:id` → Get single approval  
- `POST /administrative-approvals` → Create approval record  
- `PUT /administrative-approvals/:id` → Update approval record  
- `DELETE /administrative-approvals/:id` → Delete approval record  

### POST / PUT Parameters
| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| workName              | String | ✅        | Name of the work                           |
| area                  | String | ✅        | Block / City name                          |
| workAgency            | String | ✅        | Executing agency                           |
| scheme                | String | ✅        | Scheme name                                |
| technicalApproval     | String | ✅        | Technical approval                         |
| administrativeApproval| String | ✅        | Administrative approval                    |
| tenderApproval        | String | ❌        | Tender approval details                    |
| workProgressStage     | String | ✅        | Progress stage                             |
| workDetails           | String | ❌        | Work details                               |

---

## 5. Work Types

**Schema:** `WorkType`

### Endpoints
- `GET /work-types` → Get all work types  
- `GET /work-types/:id` → Get single work type  
- `POST /work-types` → Create work type  
- `PUT /work-types/:id` → Update work type  
- `DELETE /work-types/:id` → Delete work type  

### POST / PUT Parameters
| Field        | Type   | Required | Description   |
|--------------|--------|----------|---------------|
| workType     | String | ✅        | Work type     |
| department   | String | ✅        | Department    |
| constituency | String | ❌        | Constituency  |
| engineer     | String | ❌        | Engineer      |
| scheme       | String | ❌        | Scheme        |
| description  | String | ❌        | Description   |
| area         | String | ❌        | Area name     |
| city         | String | ❌        | City name     |
| ward         | String | ❌        | Ward number   |

---

## 6. Reports (Read-Only)

**Schema:** Dynamic — no POST/PUT  

### Endpoints
- `GET /reports/agency-wise?year=2025&agency=Suguja%20chhetra%20pradhikaran` → Get agency-wise report  
- `GET /reports/block-wise?year=2025&block=Bagicha` → Get block-wise report  
- `GET /reports/scheme-wise?year=2025&scheme=District Development` → Get scheme-wise report  
- `GET /reports/pending?year=2025` → Get pending works report  
- `GET /reports/final-status?year=2025` → Get final work status  
- `GET /reports/engineer-wise?year=2025&engineer=XYZ` → Get works assigned to an engineer  
- `GET /reports/photo-missing?year=2025` → Get list of works without photos  
