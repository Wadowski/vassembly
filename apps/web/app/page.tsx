'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';

import { TaskInputComposer } from './_components/TaskInputComposer/TaskInputComposer';
import { TaskList } from './_components/TaskList/TaskList';
import { useHomeTaskList } from './lib/useHomeTaskList';
import styles from './page.module.scss';

const AuthenticatedTaskList = (): JSX.Element => {
  const {
    tasks,
    isLoading,
    isLoadingMore,
    hasMore,
    searchInput,
    handleSearchChange,
    handleLoadMore,
    refreshFromStart,
  } = useHomeTaskList();

  return (
    <>
      <TaskInputComposer onCreateSuccess={refreshFromStart} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onLoadMore={handleLoadMore}
      />
    </>
  );
};

const HomePageContent = (): JSX.Element => {
  const { isAuthenticated } = useUserAuth();

  return (
    <main className={styles.page}>
      {isAuthenticated ? <AuthenticatedTaskList /> : <TaskInputComposer />}
    </main>
  );
};

export default HomePageContent;
