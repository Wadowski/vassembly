# @vassembly/client-script-storage

Strategy-based script content storage for local filesystem and AWS S3 backends.

## Exports

- `ScriptStorageStrategy` — interface for get/put/remove script content by storage key
- `LocalScriptStorageStrategy` — filesystem backend using `@vassembly/client-file`
- `S3ScriptStorageStrategy` — S3 backend using `@vassembly/client-aws-s3`

Consumed by domain `clients/` modules only.
