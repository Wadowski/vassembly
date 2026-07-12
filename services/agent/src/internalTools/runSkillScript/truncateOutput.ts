export interface TruncateOutputParams {
  stdout: string;
  stderr: string;
  stdoutMaxBytes: number;
  stderrMaxBytes: number;
}

export interface TruncateOutputResult {
  stdout: string;
  stderr: string;
  truncated: boolean;
}

export const truncateOutput = ({
  stdout,
  stderr,
  stdoutMaxBytes,
  stderrMaxBytes,
}: TruncateOutputParams): TruncateOutputResult => {
  const stdoutTruncated = stdout.length > stdoutMaxBytes;
  const stderrTruncated = stderr.length > stderrMaxBytes;

  return {
    stdout: stdoutTruncated ? stdout.slice(0, stdoutMaxBytes) : stdout,
    stderr: stderrTruncated ? stderr.slice(0, stderrMaxBytes) : stderr,
    truncated: stdoutTruncated || stderrTruncated,
  };
};
