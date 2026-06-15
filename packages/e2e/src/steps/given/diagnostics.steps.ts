import { Given } from '../../fixtures/bddTest';

Given('the test skips diagnostic checks', ({ world }) => {
  world.skipDiagnosticAssertions = true;
});

Given('diagnostic checks are enabled', ({ world }) => {
  world.skipDiagnosticAssertions = false;
});
