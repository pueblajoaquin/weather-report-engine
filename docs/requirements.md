# Weather Report Engine - Requirements

## Functional Requirements

| ID | Requirement |
| --- | --- |
| FR-01 | The user can request a weather report by providing a city and a date range. |
| FR-02 | Geocoding (resolving city name to coordinates) is performed as part of the background job, not during the initial HTTP request. |
| FR-03 | The user can query the current status of a report. |
| FR-04 | The user can download the generated CSV once the report is completed. |
| FR-05 | The user can retry a failed report. |
| FR-06 | The user can list all existing reports. |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | The HTTP request that creates a report must respond immediately (job enqueued), without waiting for processing to complete. |
| NFR-02 | If a call to an external API fails, the system must automatically retry a limited number of times before marking the report as `failed`. |
| NFR-03 | Every report must have a unique identifier to track its status. |
| NFR-04 | If a city cannot be resolved to coordinates, the job must fail with a clear error, without retrying (a permanent error cannot be fixed by retrying). |