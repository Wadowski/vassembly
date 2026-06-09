'use client';

import { useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { UnauthorizedError } from '@vassembly/errors';
import { useMcp, useMcpConfiguration } from '@vassembly/ui-api-hooks';

import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';

import { EmptySchemaMessage } from './_components/EmptySchemaMessage';
import { McpConfigForm } from './_components/McpConfigForm';
import { McpDetailHeader } from './_components/McpDetailHeader';
import { McpDetailSkeleton } from './_components/McpDetailSkeleton';
import { McpNotFoundMessage } from './_components/McpNotFoundMessage';
import styles from './_components/McpDetailPage.module.scss';
import { useIsMobileLayout } from './_components/useIsMobileLayout';

/**
 * MCP detail and configuration page.
 */
export default function McpDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const mcpId = typeof params?.id === 'string' ? params.id : '';
  const isMobile = useIsMobileLayout();

  const { data: mcpData, loading: mcpLoading, error: mcpError } = useMcp(mcpId);
  const { data: configData, loading: configLoading } = useMcpConfiguration(mcpId);

  const loginRoute = `/login?returnUrl=${encodeURIComponent(`/mcps/${mcpId}`)}`;

  useEffect(() => {
    if (mcpError instanceof UnauthorizedError) {
      router.replace(loginRoute);
    }
  }, [loginRoute, mcpError, router]);

  const body = ((): JSX.Element | null => {
    if (mcpLoading || configLoading) {
      return <McpDetailSkeleton />;
    }

    if (mcpError instanceof UnauthorizedError) {
      return null;
    }

    const mcp = mcpData?.mcp;

    if (mcp === undefined || mcp === null) {
      return <McpNotFoundMessage />;
    }

    const fields = mcp.configSchema?.fields ?? [];
    const hasSchema = fields.length > 0;
    const configuration = configData?.configuration ?? null;

    return (
      <main
        className={styles.page}
        data-testid="mcp-detail-mobile-layout"
        data-layout={isMobile ? 'mobile' : 'desktop'}
      >
        <McpDetailHeader mcp={mcp} configuration={configuration} />
        {hasSchema ? (
          <McpConfigForm mcp={mcp} savedConfiguration={configuration} />
        ) : (
          <EmptySchemaMessage />
        )}
      </main>
    );
  })();

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={loginRoute} loadingFallback={<McpDetailSkeleton />}>
      {body}
    </ProtectedAuthRoute>
  );
}
